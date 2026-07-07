import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { ImageOnlyPipeline } from './pipelines/image-only.pipeline';
import { ImageTextPipeline } from './pipelines/image-text.pipeline';
import { TextOnlyPipeline } from './pipelines/text-only.pipeline';
import { AiQuotaService } from './services/ai-quota.service';
import { assertValidImageBuffer } from './services/image-file-validator';
import { InputRouterService } from './services/input-router.service';
import type {
  AiChatResponse,
  AiInputType,
  AiPipelineInput,
  AiUploadedImage,
} from './types/ai.types';
import type { AiChatDto } from './dto/ai-chat.dto';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly maxImageBytes: number;

  constructor(
    config: ConfigService,
    private readonly inputRouter: InputRouterService,
    private readonly quota: AiQuotaService,
    private readonly textOnly: TextOnlyPipeline,
    private readonly imageOnly: ImageOnlyPipeline,
    private readonly imageText: ImageTextPipeline,
  ) {
    this.maxImageBytes = Number(config.get<string>('AI_MAX_IMAGE_SIZE_BYTES') ?? 4 * 1024 * 1024);
  }

  async handleRequest(request: FastifyRequest, body: AiChatDto): Promise<AiChatResponse> {
    const startedAt = Date.now();
    let inputType: AiInputType | 'unknown' = 'unknown';
    let quotaKeyType = 'unknown';
    let messageLength = 0;
    let imageBytes = 0;

    try {
      const input = request.isMultipart()
        ? await this.readMultipart(request)
        : {
            message: normalizeText(body?.message),
            sessionId: normalizeText(body?.session_id),
          };

      messageLength = input.message?.length ?? 0;
      imageBytes = input.image?.buffer.length ?? 0;
      inputType = this.inputRouter.route(input.message, input.image);

      const quota = await this.quota.consume(request, input);
      quotaKeyType = quota.keyType;

      const response = await this.runRouted(input, inputType);
      this.logRequest({
        status: 200,
        latencyMs: Date.now() - startedAt,
        inputType,
        quotaKeyType,
        messageLength,
        imageBytes,
      });
      return response;
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      this.logRequest({
        status,
        latencyMs: Date.now() - startedAt,
        inputType,
        quotaKeyType,
        messageLength,
        imageBytes,
      });
      throw error;
    }
  }

  async run(input: AiPipelineInput): Promise<AiChatResponse> {
    const inputType = this.inputRouter.route(input.message, input.image);
    return this.runRouted(input, inputType);
  }

  private async runRouted(input: AiPipelineInput, inputType: AiInputType): Promise<AiChatResponse> {
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
          const buffer = await part.toBuffer();
          const detectedContentType = assertValidImageBuffer(buffer);
          image = {
            buffer,
            contentType: detectedContentType,
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

  private logRequest(event: {
    status: number;
    latencyMs: number;
    inputType: AiInputType | 'unknown';
    quotaKeyType: string;
    messageLength: number;
    imageBytes: number;
  }): void {
    const payload = JSON.stringify({
      route: '/api/v1/ai/chat',
      status: event.status,
      latencyMs: event.latencyMs,
      inputType: event.inputType,
      quotaKeyType: event.quotaKeyType,
      messageLength: event.messageLength,
      imageBytes: event.imageBytes,
    });
    if (event.status >= 500) this.logger.error(payload);
    else if (event.status >= 400) this.logger.warn(payload);
    else this.logger.log(payload);
  }
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function isFileTooLargeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  if (code && String(code).includes('FILE_TOO_LARGE')) return true;
  return /file too large|files? exceed(?:s|ed)? (?:the )?limit/i.test(error.message);
}
