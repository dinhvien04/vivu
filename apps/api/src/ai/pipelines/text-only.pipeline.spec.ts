import type { ConfigService } from '@nestjs/config';
import type { GeminiService } from '../../gemini/gemini.service';
import type { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { ContextBuilderService } from '../services/context-builder.service';
import type { ResponseFormatterService } from '../services/response-formatter.service';
import { TextOnlyPipeline } from './text-only.pipeline';

describe('TextOnlyPipeline', () => {
  it('searches Qdrant text and asks Gemini with the retrieved context', async () => {
    const result = {
      id: '1',
      score: 0.9,
      place_slug: 'bien-ho',
      location_name: 'Biển Hồ',
      text: 'Biển Hồ là thắng cảnh tại Gia Lai.',
    };
    const qdrant = {
      searchTextByMessage: jest.fn().mockResolvedValue([result]),
    };
    const gemini = {
      generateTravelAnswer: jest.fn().mockResolvedValue('Câu trả lời'),
    };
    const contextBuilder = {
      fromTextResults: jest.fn().mockReturnValue('retrieved context'),
    };
    const formatter = {
      format: jest.fn().mockResolvedValue({ success: true, input_type: 'text_only' }),
    };
    const pipeline = new TextOnlyPipeline(
      config({ TOP_K_TEXT: '3' }),
      qdrant as unknown as QdrantRepository,
      gemini as unknown as GeminiService,
      contextBuilder as unknown as ContextBuilderService,
      formatter as unknown as ResponseFormatterService,
    );

    await pipeline.run('Biển Hồ có gì đẹp?');

    expect(qdrant.searchTextByMessage).toHaveBeenCalledWith('Biển Hồ có gì đẹp?', {
      limit: 3,
    });
    expect(gemini.generateTravelAnswer).toHaveBeenCalledWith({
      question: 'Biển Hồ có gì đẹp?',
      context: 'retrieved context',
    });
  });
});

function config(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}
