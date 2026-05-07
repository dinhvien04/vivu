import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlacesController } from '../../apps/api/src/places/places.controller';
import { PlacesService } from '../../apps/api/src/places/places.service';
import { ListPlacesQueryDto } from '../../apps/api/src/places/dto/list-places.query.dto';
import type { Place, Paginated } from '@vivu/types';

describe('PlacesController', () => {
  let controller: PlacesController;
  let service: PlacesService;

  const mockPlace: Place = {
    id: 'p_001',
    slug: 'vinh-ha-long',
    titleVi: 'Vịnh Hạ Long',
    titleEn: 'Ha Long Bay',
    summaryVi: 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi.',
    summaryEn: 'A UNESCO world heritage site with thousands of limestone islands.',
    descriptionVi: null,
    descriptionEn: null,
    regionId: 'r_quang_ninh',
    address: 'Quảng Ninh',
    geo: { lat: 20.9101, lng: 107.1839 },
    bestSeasons: ['spring', 'autumn'],
    status: 'published',
    heroImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const mockPaginatedPlaces: Paginated<Place> = {
    data: [mockPlace],
    meta: { page: 1, pageSize: 20, total: 1 }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlacesController],
      providers: [
        {
          provide: PlacesService,
          useValue: {
            list: jest.fn(),
            findBySlug: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PlacesController>(PlacesController);
    service = module.get<PlacesService>(PlacesService);
  });

  describe('list', () => {
    it('should return paginated places', async () => {
      const query: ListPlacesQueryDto = { page: 1, pageSize: 20 };
      jest.spyOn(service, 'list').mockReturnValue(mockPaginatedPlaces);

      const result = controller.list(query);
      expect(result).toEqual(mockPaginatedPlaces);
      expect(service.list).toHaveBeenCalledWith(query);
    });

    it('should handle search query', async () => {
      const query: ListPlacesQueryDto = { q: 'hạ long', page: 1, pageSize: 20 };
      jest.spyOn(service, 'list').mockReturnValue(mockPaginatedPlaces);

      const result = controller.list(query);
      expect(result).toEqual(mockPaginatedPlaces);
      expect(service.list).toHaveBeenCalledWith(query);
    });

    it('should handle region filter', async () => {
      const query: ListPlacesQueryDto = { region: 'r_quang_ninh', page: 1, pageSize: 20 };
      jest.spyOn(service, 'list').mockReturnValue(mockPaginatedPlaces);

      const result = controller.list(query);
      expect(result).toEqual(mockPaginatedPlaces);
      expect(service.list).toHaveBeenCalledWith(query);
    });
  });

  describe('detail', () => {
    it('should return place detail when found', () => {
      jest.spyOn(service, 'findBySlug').mockReturnValue(mockPlace);

      const result = controller.detail('vinh-ha-long');
      expect(result).toEqual({ data: mockPlace });
      expect(service.findBySlug).toHaveBeenCalledWith('vinh-ha-long');
    });

    it('should throw NotFoundException when place not found', () => {
      jest.spyOn(service, 'findBySlug').mockReturnValue(undefined);

      expect(() => controller.detail('non-existent')).toThrow(NotFoundException);
      expect(() => controller.detail('non-existent')).toThrow('Không tìm thấy địa điểm: non-existent');
    });
  });
});