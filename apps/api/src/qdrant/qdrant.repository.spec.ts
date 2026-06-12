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
});
