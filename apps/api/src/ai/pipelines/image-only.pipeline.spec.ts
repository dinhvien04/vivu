import type { ConfigService } from '@nestjs/config';
import type { QdrantRepository } from '../../qdrant/qdrant.repository';
import type { S3Service } from '../../storage/s3.service';
import type { ResponseFormatterService } from '../services/response-formatter.service';
import { ImageOnlyPipeline } from './image-only.pipeline';

describe('ImageOnlyPipeline', () => {
  const image = { buffer: Buffer.from('image'), contentType: 'image/jpeg' };

  it('returns an uncertain answer when the top score is below threshold', async () => {
    const fixture = { id: '1', score: 0.1, place_slug: 'bien-ho' };
    const deps = makeDeps([fixture]);
    const pipeline = makePipeline(deps);

    await pipeline.run(image);

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

    expect(deps.formatter.format).toHaveBeenCalledWith(
      expect.objectContaining({
        inputType: 'image_only',
        answer: expect.stringContaining('Biển Hồ'),
        detectedPlaceSlug: 'bien-ho',
      }),
    );
  });
});

function makeDeps(results: object[]) {
  return {
    qdrant: { searchImagesByImageBase64: jest.fn().mockResolvedValue(results) },
    s3: { uploadTemporaryImage: jest.fn() },
    formatter: { format: jest.fn().mockResolvedValue({ success: true }) },
  };
}

function makePipeline(deps: ReturnType<typeof makeDeps>) {
  return new ImageOnlyPipeline(
    config(),
    deps.qdrant as unknown as QdrantRepository,
    deps.s3 as unknown as S3Service,
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
