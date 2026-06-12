import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { ImageOnlyPipeline } from './pipelines/image-only.pipeline';
import { ImageTextPipeline } from './pipelines/image-text.pipeline';
import { TextOnlyPipeline } from './pipelines/text-only.pipeline';
import { InputRouterService } from './services/input-router.service';
import type { AiChatResponse, AiPipelineInput, AiUploadedImage } from './types/ai.types';
import type { AiChatDto } from './dto/ai-chat.dto';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class AiChatService {
  private readonly maxImageBytes: number;

  constructor(
    config: ConfigService,
    private readonly inputRouter: InputRouterService,
    private readonly textOnly: TextOnlyPipeline,
    private readonly imageOnly: ImageOnlyPipeline,
    private readonly imageText: ImageTextPipeline,
  ) {
    this.maxImageBytes = Number(config.get<string>('AI_MAX_IMAGE_SIZE_BYTES') ?? 4 * 1024 * 1024);
  }

  async handleRequest(request: FastifyRequest, body: AiChatDto): Promise<AiChatResponse> {
    const input = request.isMultipart()
      ? await this.readMultipart(request)
      : {
          message: normalizeText(body?.message),
          sessionId: normalizeText(body?.session_id),
        };
    return this.run(input);
  }

  async run(input: AiPipelineInput): Promise<AiChatResponse> {
    const inputType = this.inputRouter.route(input.message, input.image);
    if (inputType === 'text_only') return this.textOnly.run(input.message!);
    if (inputType === 'image_only') return this.imageOnly.run(input.image!);
    return this.imageText.run(input.message!, input.image!);
  }

  private async readMultipart(request: FastifyRequest): Promise<AiPipelineInput> {
    let message: string | undefined;
    let sessionId: string | undefined;
    let image: AiUploadedImage | undefined;

    try {
      for await (const part of request.parts({
        limits: {
          fileSize: this.maxImageBytes,
          files: 1,
          fields: 2,
          parts: 3,
        },
      })) {
        if (part.type === 'file') {
          if (part.fieldname !== 'image') {
            part.file.resume();
            throw new BadRequestException(`Trường file không được hỗ trợ: ${part.fieldname}`);
          }
          if (!ALLOWED_IMAGE_TYPES.has(part.mimetype)) {
            part.file.resume();
            throw new BadRequestException('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
          }
          image = {
            buffer: await part.toBuffer(),
            contentType: part.mimetype,
            filename: part.filename,
          };
          continue;
        }
        if (part.fieldname === 'message') message = normalizeText(String(part.value));
        if (part.fieldname === 'session_id') sessionId = normalizeText(String(part.value));
      }
    } catch (error) {
      if (isFileTooLargeError(error)) {
        throw new PayloadTooLargeException(
          `Ảnh vượt quá giới hạn ${Math.floor(this.maxImageBytes / 1024 / 1024)}MB.`,
        );
      }
      throw error;
    }

    if (message && message.length > 4000) {
      throw new BadRequestException('message không được vượt quá 4000 ký tự.');
    }
    if (sessionId && sessionId.length > 200) {
      throw new BadRequestException('session_id không được vượt quá 200 ký tự.');
    }
    return { message, sessionId, image };
  }
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function isFileTooLargeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ('code' in error
      ? String((error as Error & { code?: string }).code).includes('FILE_TOO_LARGE')
      : /file.*large|limit/i.test(error.message))
  );
}
