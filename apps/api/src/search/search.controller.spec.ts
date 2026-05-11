/**
 * Controller test cho SearchController. Dùng `Test.createTestingModule` của
 * NestJS để bootstrap module rỗng, mock SearchService, và verify controller
 * delegate đúng + bọc response trong `{ data }`.
 */
import { Test } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService, type SuggestPlace } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let service: { suggest: jest.Mock };

  beforeEach(async () => {
    service = { suggest: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: service }],
    }).compile();
    controller = moduleRef.get(SearchController);
  });

  it('delegates to SearchService.suggest with q + limit', async () => {
    service.suggest.mockResolvedValueOnce([]);
    await controller.suggest({ q: 'Hạ', limit: 10 });
    expect(service.suggest).toHaveBeenCalledWith('Hạ', 10);
  });

  it('forwards undefined limit (service applies default)', async () => {
    service.suggest.mockResolvedValueOnce([]);
    await controller.suggest({ q: 'Sài' });
    expect(service.suggest).toHaveBeenCalledWith('Sài', undefined);
  });

  it('wraps result in `{ data }`', async () => {
    const hits: SuggestPlace[] = [
      {
        id: 'p1',
        slug: 's-1',
        titleVi: 'Vịnh Hạ Long',
        titleEn: 'Halong Bay',
        address: 'Quảng Ninh',
        heroImageUrl: null,
      },
    ];
    service.suggest.mockResolvedValueOnce(hits);
    const out = await controller.suggest({ q: 'Hạ', limit: 5 });
    expect(out).toEqual({ data: hits });
  });

  it('wraps empty result as `{ data: [] }`', async () => {
    service.suggest.mockResolvedValueOnce([]);
    const out = await controller.suggest({ q: 'zzz', limit: 5 });
    expect(out).toEqual({ data: [] });
  });

  it('propagates errors from the service', async () => {
    service.suggest.mockRejectedValueOnce(new Error('boom'));
    await expect(controller.suggest({ q: 'a', limit: 5 })).rejects.toThrow('boom');
  });
});
