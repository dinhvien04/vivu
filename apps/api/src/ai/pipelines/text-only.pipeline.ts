import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiTextGenerationService } from '../../ai-providers/ai-text-generation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { QdrantTextResult } from '../../qdrant/qdrant.types';
import type { AiChatResponse } from '../types/ai.types';
import { ContextBuilderService } from '../services/context-builder.service';
import { PlaceMentionResolverService } from '../services/place-mention-resolver.service';
import { ResponseFormatterService } from '../services/response-formatter.service';

@Injectable()
export class TextOnlyPipeline {
  private readonly logger = new Logger(TextOnlyPipeline.name);
  private readonly topK: number;

  constructor(
    config: ConfigService,
    private readonly qdrant: QdrantRepository,
    private readonly aiText: AiTextGenerationService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly placeMentions: PlaceMentionResolverService,
    private readonly formatter: ResponseFormatterService,
    private readonly prisma: PrismaService,
  ) {
    this.topK = Number(config.get<string>('TOP_K_TEXT') ?? 5);
  }

  async run(message: string): Promise<AiChatResponse> {
    const mentionedPlace = await this.placeMentions.resolve(message);
    const textResults = (
      await this.qdrant.searchTextByMessage(message, {
        limit: this.topK,
        placeSlug: mentionedPlace?.slug,
      })
    ).filter((result) => !result.province || normalizeProvince(result.province) === 'gia lai');
    const context = [
      mentionedPlace ? await this.buildPlaceContext(mentionedPlace.slug) : '',
      this.contextBuilder.fromTextResults(textResults),
    ]
      .filter((part) => part.trim().length > 0)
      .join('\n\n---\n\n');
    let answer: string;
    try {
      answer = await this.aiText.generateTravelAnswer({
        question: message,
        context,
        detectedPlace: mentionedPlace
          ? { slug: mentionedPlace.slug, name: mentionedPlace.name }
          : undefined,
      });
    } catch (error) {
      this.logGenerationFallback(error);
      answer = buildLocalFallbackAnswer({
        mentionedPlace,
        textResults,
        context,
      });
    }

    return this.formatter.format({
      inputType: 'text_only',
      answer,
      textResults,
      detectedPlaceSlug: mentionedPlace?.slug,
    });
  }

  private async buildPlaceContext(slug: string): Promise<string> {
    const place = await this.prisma.place.findUnique({
      where: { slug },
      select: {
        titleVi: true,
        province: true,
        summaryVi: true,
        descriptionVi: true,
        address: true,
        aliases: true,
        categories: {
          select: {
            category: {
              select: {
                nameVi: true,
              },
            },
          },
        },
      },
    });

    if (!place) return '';

    return [
      `Địa điểm: ${place.titleVi}`,
      `Tỉnh/thành: ${place.province}`,
      place.address ? `Địa chỉ: ${place.address}` : '',
      place.aliases.length > 0 ? `Tên gọi khác: ${place.aliases.join(', ')}` : '',
      place.categories.length > 0
        ? `Chủ đề: ${place.categories.map((item) => item.category.nameVi).join(', ')}`
        : '',
      place.summaryVi ? `Tóm tắt:\n${place.summaryVi}` : '',
      place.descriptionVi ? `Mô tả:\n${place.descriptionVi}` : '',
    ]
      .filter((part) => part.trim().length > 0)
      .join('\n');
  }

  private logGenerationFallback(error: unknown): void {
    this.logger.warn(
      JSON.stringify({
        event: 'ai_chat_text_local_fallback',
        status: error instanceof HttpException ? error.getStatus() : undefined,
      }),
    );
  }
}

function buildLocalFallbackAnswer(params: {
  mentionedPlace: { slug: string; name: string } | null;
  textResults: QdrantTextResult[];
  context: string;
}): string {
  const places = uniqueResultSummaries(params.textResults).slice(0, 3);
  if (places.length > 0) {
    const intro = params.mentionedPlace
      ? `AI tạo sinh đang bận, nhưng Vivu vẫn tìm thấy dữ liệu về ${params.mentionedPlace.name}.`
      : 'AI tạo sinh đang bận, nhưng Vivu vẫn tìm thấy một vài địa danh phù hợp trong dữ liệu hiện có.';
    const lines = places.map((place) => {
      const province = place.province ? ` (${place.province})` : '';
      return `- ${place.name}${province}: ${place.snippet}`;
    });
    return [
      intro,
      'Bạn có thể tham khảo nhanh:',
      ...lines,
      'Khi hệ thống AI ổn định lại, Vivu sẽ viết câu trả lời chi tiết hơn cho bạn.',
    ].join('\n');
  }

  const contextSnippet = firstUsefulContextSnippet(params.context);
  if (params.mentionedPlace && contextSnippet) {
    return [
      `AI tạo sinh đang bận, nhưng Vivu có dữ liệu về ${params.mentionedPlace.name}.`,
      contextSnippet,
      'Bạn có thể mở trang địa điểm hoặc hỏi lại sau để nhận câu trả lời chi tiết hơn.',
    ].join('\n');
  }

  return [
    'AI tạo sinh đang tạm thời không phản hồi, nên Vivu chưa thể viết câu trả lời đầy đủ ngay lúc này.',
    'Hiện dữ liệu của Vivu ưu tiên các địa danh ở Gia Lai. Bạn thử hỏi một địa danh cụ thể như Biển Hồ, núi lửa Chư Đăng Ya hoặc thác Phú Cường nhé.',
  ].join('\n');
}

function uniqueResultSummaries(results: QdrantTextResult[]): Array<{
  key: string;
  name: string;
  province?: string;
  snippet: string;
}> {
  const seen = new Set<string>();
  const summaries: Array<{ key: string; name: string; province?: string; snippet: string }> = [];

  for (const result of results) {
    const key = result.place_slug ?? result.location_key ?? result.location_name;
    if (!key || seen.has(key)) continue;
    const snippet = summarizeText(result.text);
    if (!snippet) continue;
    seen.add(key);
    summaries.push({
      key,
      name: result.location_name ?? result.place_slug ?? 'Địa danh',
      province: result.province,
      snippet,
    });
  }

  return summaries;
}

function summarizeText(value: string | undefined): string | null {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.length > 180 ? `${normalized.slice(0, 177).trimEnd()}...` : normalized;
}

function firstUsefulContextSnippet(context: string): string | null {
  const line = context
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(
      (item) =>
        item.length >= 40 &&
        !/^(-+|Địa điểm:|Tỉnh\/thành:|Địa chỉ:|Tên gọi khác:|Chủ đề:|Tóm tắt:|Mô tả:|Nguồn:|Nội dung:)/i.test(
          item,
        ),
    );
  return summarizeText(line);
}

function normalizeProvince(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .trim();
}
