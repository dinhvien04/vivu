import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../gemini/gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { AiChatResponse } from '../types/ai.types';
import { ContextBuilderService } from '../services/context-builder.service';
import { PlaceMentionResolverService } from '../services/place-mention-resolver.service';
import { ResponseFormatterService } from '../services/response-formatter.service';

@Injectable()
export class TextOnlyPipeline {
  private readonly topK: number;

  constructor(
    config: ConfigService,
    private readonly qdrant: QdrantRepository,
    private readonly gemini: GeminiService,
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
    const answer = await this.gemini.generateTravelAnswer({
      question: message,
      context,
      detectedPlace: mentionedPlace
        ? { slug: mentionedPlace.slug, name: mentionedPlace.name }
        : undefined,
    });
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
}

function normalizeProvince(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .trim();
}
