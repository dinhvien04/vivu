import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { AiTextGenerationService } from '../../ai-providers/ai-text-generation.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { ContextBuilderService } from '../services/context-builder.service';
import type { PlaceMentionResolverService } from '../services/place-mention-resolver.service';
import type { ResponseFormatterService } from '../services/response-formatter.service';
import { TextOnlyPipeline } from './text-only.pipeline';

describe('TextOnlyPipeline', () => {
  it('filters Qdrant retrieval by a place mentioned in the question', async () => {
    const result = {
      id: '1',
      score: 0.9,
      place_slug: 'bien-ho',
      location_name: 'Biển Hồ',
      province: 'Gia Lai',
      text: 'Biển Hồ là thắng cảnh tại Gia Lai.',
    };
    const qdrant = {
      searchTextByMessage: jest.fn().mockResolvedValue([result]),
    };
    const aiText = {
      generateTravelAnswer: jest.fn().mockResolvedValue('Câu trả lời'),
    };
    const contextBuilder = {
      fromTextResults: jest.fn().mockReturnValue('retrieved context'),
    };
    const placeMentions = {
      resolve: jest.fn().mockResolvedValue({ slug: 'bien-ho', name: 'Biển Hồ' }),
    };
    const formatter = {
      format: jest.fn().mockResolvedValue({ success: true, input_type: 'text_only' }),
    };
    const prisma = {
      place: {
        findUnique: jest.fn().mockResolvedValue({
          titleVi: 'Biển Hồ',
          province: 'Gia Lai',
          summaryVi: 'Biển Hồ là thắng cảnh nổi tiếng.',
          descriptionVi: null,
          address: null,
          aliases: ['Hồ Tơ Nưng'],
          categories: [],
        }),
      },
    };
    const pipeline = new TextOnlyPipeline(
      config({ TOP_K_TEXT: '3' }),
      qdrant as unknown as QdrantRepository,
      aiText as unknown as AiTextGenerationService,
      contextBuilder as unknown as ContextBuilderService,
      placeMentions as unknown as PlaceMentionResolverService,
      formatter as unknown as ResponseFormatterService,
      prisma as unknown as PrismaService,
    );

    await pipeline.run('Biển Hồ có gì đẹp?');

    expect(qdrant.searchTextByMessage).toHaveBeenCalledWith('Biển Hồ có gì đẹp?', {
      limit: 3,
      placeSlug: 'bien-ho',
    });
    expect(aiText.generateTravelAnswer).toHaveBeenCalledWith({
      question: 'Biển Hồ có gì đẹp?',
      context: expect.stringContaining('retrieved context'),
      detectedPlace: { slug: 'bien-ho', name: 'Biển Hồ' },
    });
    expect(aiText.generateTravelAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.stringContaining('Biển Hồ là thắng cảnh nổi tiếng.'),
      }),
    );
    expect(formatter.format).toHaveBeenCalledWith(
      expect.objectContaining({
        textResults: [result],
        detectedPlaceSlug: 'bien-ho',
      }),
    );
  });

  it('returns a local fallback answer when text generation providers fail', async () => {
    const result = {
      id: '1',
      score: 0.9,
      place_slug: 'bien-ho',
      location_name: 'Biển Hồ',
      province: 'Gia Lai',
      text: 'Biển Hồ là thắng cảnh nổi tiếng ở Pleiku, phù hợp để ngắm cảnh và chụp ảnh.',
    };
    const qdrant = {
      searchTextByMessage: jest.fn().mockResolvedValue([result]),
    };
    const aiText = {
      generateTravelAnswer: jest
        .fn()
        .mockRejectedValue(new ServiceUnavailableException('Tài khoản AI đã hết credit.')),
    };
    const contextBuilder = {
      fromTextResults: jest.fn().mockReturnValue('retrieved context'),
    };
    const placeMentions = {
      resolve: jest.fn().mockResolvedValue(null),
    };
    const formatter = {
      format: jest.fn().mockImplementation(async (bundle) => ({
        success: true,
        input_type: bundle.inputType,
        answer: bundle.answer,
      })),
    };
    const prisma = {
      place: {
        findUnique: jest.fn(),
      },
    };
    const pipeline = new TextOnlyPipeline(
      config({ TOP_K_TEXT: '3' }),
      qdrant as unknown as QdrantRepository,
      aiText as unknown as AiTextGenerationService,
      contextBuilder as unknown as ContextBuilderService,
      placeMentions as unknown as PlaceMentionResolverService,
      formatter as unknown as ResponseFormatterService,
      prisma as unknown as PrismaService,
    );

    const response = await pipeline.run('Gia Lai có chỗ nào đẹp?');

    expect(response).toMatchObject({
      success: true,
      input_type: 'text_only',
      answer: expect.stringContaining('AI tạo sinh đang bận'),
    });
    expect(formatter.format).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: expect.stringContaining('Biển Hồ'),
        textResults: [result],
      }),
    );
  });
});

function config(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}
