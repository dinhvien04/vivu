import type { QdrantService } from './qdrant.service';
import { QdrantRepository } from './qdrant.repository';

describe('QdrantRepository', () => {
  it('uses the configured cloud collections and inference models', async () => {
    const query = jest.fn().mockResolvedValue({ points: [] });
    const service = {
      assertConfigured: jest.fn(),
      textCollection: 'text_collection_cloud',
      imageCollection: 'image_collection_cloud',
      textModel: 'intfloat/multilingual-e5-small',
      imageModel: 'qdrant/clip-vit-b-32-vision',
      imageTextModel: 'qdrant/clip-vit-b-32-text',
      client: { query },
    };
    const repository = new QdrantRepository(service as unknown as QdrantService);

    await repository.searchTextByMessage('Biển Hồ', { placeSlug: 'bien-ho' });
    expect(query).toHaveBeenLastCalledWith(
      'text_collection_cloud',
      expect.objectContaining({
        query: {
          text: 'query: Biển Hồ',
          model: 'intfloat/multilingual-e5-small',
        },
        filter: {
          must: [{ key: 'place_slug', match: { value: 'bien-ho' } }],
        },
      }),
    );

    await repository.searchImagesByText('Biển Hồ');
    expect(query).toHaveBeenLastCalledWith(
      'image_collection_cloud',
      expect.objectContaining({
        query: {
          text: 'Biển Hồ',
          model: 'qdrant/clip-vit-b-32-text',
        },
      }),
    );

    await repository.searchImagesByImageBase64('base64');
    expect(query).toHaveBeenLastCalledWith(
      'image_collection_cloud',
      expect.objectContaining({
        query: {
          image: 'base64',
          model: 'qdrant/clip-vit-b-32-vision',
        },
      }),
    );
  });

  it('falls back to client-side place filtering when the payload index is missing', async () => {
    const missingIndex = Object.assign(new Error('Bad Request'), {
      data: {
        status: {
          error: 'Index required but not found for "place_slug" of type keyword.',
        },
      },
    });
    const query = jest
      .fn()
      .mockRejectedValueOnce(missingIndex)
      .mockResolvedValueOnce({
        points: [
          { id: '1', score: 0.9, payload: { place_slug: 'bien-ho', text: 'matching' } },
          { id: '2', score: 0.8, payload: { place_slug: 'thac-phu-cuong', text: 'other' } },
        ],
      });
    const repository = new QdrantRepository({
      assertConfigured: jest.fn(),
      textCollection: 'text_collection_cloud',
      textModel: 'intfloat/multilingual-e5-small',
      client: { query },
    } as unknown as QdrantService);

    const results = await repository.searchTextByMessage('Chỗ này có gì chơi?', {
      limit: 5,
      placeSlug: 'bien-ho',
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.place_slug).toBe('bien-ho');
    expect(query).toHaveBeenNthCalledWith(
      2,
      'text_collection_cloud',
      expect.objectContaining({
        query: {
          text: 'query: bien ho Chỗ này có gì chơi?',
          model: 'intfloat/multilingual-e5-small',
        },
        filter: undefined,
        limit: 50,
      }),
    );
  });
});
