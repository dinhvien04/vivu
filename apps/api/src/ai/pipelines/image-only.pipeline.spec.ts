import type { ConfigService } from '@nestjs/config';
import type { GeminiService } from '../../gemini/gemini.service';
import type { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { S3Service } from '../../storage/s3.service';
import type { ContextBuilderService } from '../services/context-builder.service';
import type { ResponseFormatterService } from '../services/response-formatter.service';
import { ImageOnlyPipeline } from './image-only.pipeline';

describe('ImageOnlyPipeline', () => {
  const image = { buffer: Buffer.from('image'), contentType: 'image/jpeg' };

  it('returns an uncertain answer when the top score is below threshold', async () => {
    const fixture = { id: '1', score: 0.1, place_slug: 'bien-ho' };
    const deps = makeDeps([fixture]);
    const pipeline = makePipeline(deps);

    await pipeline.run(image);

    expect(deps.gemini.generateTravelAnswer).not.toHaveBeenCalled();
    expect(deps.formatter.format).toHaveBeenCalledWith(
      expect.objectContaining({
        inputType: 'image_only',
        answer: expect.stringContaining('chưa nhận diện'),
      }),
    );
  });

  it('returns the detected place when the top score is high enough', async () => {
    const fixture = {
      id: '1',
      score: 0.91,
      place_slug: 'bien-ho',
      location_name: 'Biển Hồ',
    };
    const deps = makeDeps([fixture]);
    const pipeline = makePipeline(deps);

    await pipeline.run(image);

    expect(deps.gemini.generateTravelAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        detectedPlace: {
          slug: 'bien-ho',
          name: 'Biển Hồ',
          score: 0.91,
        },
      }),
    );
  });
});

function makeDeps(results: object[]) {
  return {
    qdrant: { searchImagesByImageBase64: jest.fn().mockResolvedValue(results) },
    gemini: { generateTravelAnswer: jest.fn().mockResolvedValue('answer') },
    s3: { assertConfigured: jest.fn(), uploadTemporaryImage: jest.fn() },
    context: { fromImageResults: jest.fn().mockReturnValue('image context') },
    formatter: { format: jest.fn().mockResolvedValue({ success: true }) },
  };
}

function makePipeline(deps: ReturnType<typeof makeDeps>) {
  return new ImageOnlyPipeline(
    config(),
    deps.qdrant as unknown as QdrantRepository,
    deps.gemini as unknown as GeminiService,
    deps.s3 as unknown as S3Service,
    deps.context as unknown as ContextBuilderService,
    deps.formatter as unknown as ResponseFormatterService,
  );
}

function config(): ConfigService {
  const values: Record<string, string> = {
    TOP_K_IMAGES: '5',
    IMAGE_MATCH_THRESHOLD: '0.25',
  };
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}
