import type { ConfigService } from '@nestjs/config';
import type { AiTextGenerationService } from '../../ai-providers/ai-text-generation.service';
import type { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { S3Service } from '../../storage/s3.service';
import type { ContextBuilderService } from '../services/context-builder.service';
import type { ResponseFormatterService } from '../services/response-formatter.service';
import { ImageTextPipeline } from './image-text.pipeline';

describe('ImageTextPipeline', () => {
  const image = { buffer: Buffer.from('image'), contentType: 'image/jpeg' };

  it('filters text retrieval by place_slug for a confident image match', async () => {
    const deps = makeDeps([{ id: '1', score: 0.9, place_slug: 'bien-ho' }]);
    await makePipeline(deps).run('Chỗ này có gì chơi?', image);
    expect(deps.qdrant.searchTextByMessage).toHaveBeenCalledWith('Chỗ này có gì chơi?', {
      limit: 5,
      placeSlug: 'bien-ho',
    });
    expect(deps.textGeneration.generateTravelAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        detectedPlace: expect.objectContaining({ slug: 'bien-ho', score: 0.9 }),
      }),
    );
  });

  it('does not query text or Gemini for a low-confidence image match', async () => {
    const deps = makeDeps([{ id: '1', score: 0.1, place_slug: 'bien-ho' }]);
    await makePipeline(deps).run('Chỗ này có gì chơi?', image);
    expect(deps.qdrant.searchTextByMessage).not.toHaveBeenCalled();
    expect(deps.textGeneration.generateTravelAnswer).not.toHaveBeenCalled();
    expect(deps.formatter.format).toHaveBeenCalledWith(
      expect.objectContaining({
        inputType: 'image_text',
        answer: expect.stringContaining('chưa nhận diện'),
      }),
    );
  });

  it('does not query text when a confident image result has no place_slug', async () => {
    const deps = makeDeps([{ id: '1', score: 0.9, location_name: 'Không rõ slug' }]);
    await makePipeline(deps).run('Chỗ này có gì chơi?', image);
    expect(deps.qdrant.searchTextByMessage).not.toHaveBeenCalled();
    expect(deps.textGeneration.generateTravelAnswer).not.toHaveBeenCalled();
  });
});

function makeDeps(imageResults: object[]) {
  return {
    qdrant: {
      searchImagesByImageBase64: jest.fn().mockResolvedValue(imageResults),
      searchTextByMessage: jest.fn().mockResolvedValue([]),
    },
    textGeneration: { generateTravelAnswer: jest.fn().mockResolvedValue('answer') },
    s3: { uploadTemporaryImage: jest.fn() },
    context: {
      fromTextResults: jest.fn().mockReturnValue('text context'),
      fromImageResults: jest.fn().mockReturnValue('image context'),
    },
    formatter: { format: jest.fn().mockResolvedValue({ success: true }) },
  };
}

function makePipeline(deps: ReturnType<typeof makeDeps>) {
  return new ImageTextPipeline(
    config(),
    deps.qdrant as unknown as QdrantRepository,
    deps.textGeneration as unknown as AiTextGenerationService,
    deps.s3 as unknown as S3Service,
    deps.context as unknown as ContextBuilderService,
    deps.formatter as unknown as ResponseFormatterService,
  );
}

function config(): ConfigService {
  const values: Record<string, string> = {
    TOP_K_TEXT: '5',
    TOP_K_IMAGES: '5',
    IMAGE_MATCH_THRESHOLD: '0.25',
  };
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}
