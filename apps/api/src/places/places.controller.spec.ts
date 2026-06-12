import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

describe('PlacesController', () => {
  let controller: PlacesController;
  let service: {
    list: jest.Mock;
    listNearby: jest.Mock;
    findBySlug: jest.Mock;
    listImages: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      listNearby: jest.fn(),
      findBySlug: jest.fn(),
      listImages: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [PlacesController],
      providers: [{ provide: PlacesService, useValue: service }],
    }).compile();
    controller = moduleRef.get(PlacesController);
  });

  describe('GET /places', () => {
    it('delegates to PlacesService.list with the full query DTO', () => {
      const query = { page: 1, pageSize: 12 } as never;
      const promise = Promise.resolve({ data: [], meta: { page: 1, pageSize: 12, total: 0 } });
      service.list.mockReturnValueOnce(promise);
      const out = controller.list(query);
      expect(service.list).toHaveBeenCalledWith(query);
      expect(out).toBe(promise);
    });
  });

  describe('GET /places/nearby', () => {
    it('passes lat/lng/excludeSlug and applies default radius=50, limit=8', async () => {
      service.listNearby.mockResolvedValueOnce([]);
      await controller.nearby({ lat: 21, lng: 105.8 } as never);
      expect(service.listNearby).toHaveBeenCalledWith({
        lat: 21,
        lng: 105.8,
        radiusKm: 50,
        limit: 8,
        excludeSlug: undefined,
      });
    });

    it('uses provided radius and limit when present', async () => {
      service.listNearby.mockResolvedValueOnce([]);
      await controller.nearby({
        lat: 21,
        lng: 105.8,
        radius: 5,
        limit: 20,
        excludeSlug: 's-1',
      } as never);
      expect(service.listNearby).toHaveBeenCalledWith({
        lat: 21,
        lng: 105.8,
        radiusKm: 5,
        limit: 20,
        excludeSlug: 's-1',
      });
    });

    it('wraps result in `{ data }`', async () => {
      const items = [{ id: 'p1', distanceKm: 1.2 }] as never;
      service.listNearby.mockResolvedValueOnce(items);
      const out = await controller.nearby({ lat: 21, lng: 105.8 } as never);
      expect(out).toEqual({ data: items });
    });
  });

  describe('GET /places/:slug/images', () => {
    it('returns `{ data }` when images are found', async () => {
      const images = [{ id: 'hero', s3Key: 'BIEN_HO/image/a.jpg', url: 'https://signed' }];
      service.listImages.mockResolvedValueOnce(images);
      const out = await controller.images('bien-ho');
      expect(service.listImages).toHaveBeenCalledWith('bien-ho');
      expect(out).toEqual({ data: images });
    });

    it('throws NotFoundException when missing', async () => {
      service.listImages.mockResolvedValueOnce(null);
      await expect(controller.images('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('GET /places/:slug', () => {
    it('returns `{ data }` when found', async () => {
      const place = { id: 'p1', slug: 's-1', titleVi: 'Ha Long' } as never;
      service.findBySlug.mockResolvedValueOnce(place);
      const out = await controller.detail('s-1');
      expect(service.findBySlug).toHaveBeenCalledWith('s-1');
      expect(out).toEqual({ data: place });
    });

    it('throws NotFoundException when missing', async () => {
      service.findBySlug.mockResolvedValueOnce(null);
      await expect(controller.detail('missing')).rejects.toBeInstanceOf(NotFoundException);
      await expect(controller.detail('missing')).rejects.toThrow(/Khong tim thay dia diem/);
    });
  });
});
