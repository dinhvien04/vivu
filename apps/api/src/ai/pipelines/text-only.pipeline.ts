import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../gemini/gemini.service';
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
    const context = this.contextBuilder.fromTextResults(textResults);
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
}

function normalizeProvince(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('vi-VN')
    .trim();
}
