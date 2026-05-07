import { PlacesService } from '../../apps/api/src/places/places.service';
import { ListPlacesQueryDto } from '../../apps/api/src/places/dto/list-places.query.dto';
import type { Place } from '@vivu/types';

describe('PlacesService', () => {
  let service: PlacesService;

  beforeEach(() => {
    service = new PlacesService();
  });

  describe('list', () => {
    it('should return all places with default pagination', () => {
      const query: ListPlacesQueryDto = {};
      const result = service.list(query);

      expect(result.data).toHaveLength(3);
      expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 3 });
      expect(result.data[0].slug).toBe('vinh-ha-long');
      expect(result.data[1].slug).toBe('da-lat');
      expect(result.data[2].slug).toBe('pho-co-hoi-an');
    });

    it('should handle custom pagination', () => {
      const query: ListPlacesQueryDto = { page: 2, pageSize: 1 };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 2, pageSize: 1, total: 3 });
      expect(result.data[0].slug).toBe('da-lat');
    });

    it('should filter by search query (Vietnamese title)', () => {
      const query: ListPlacesQueryDto = { q: 'hạ long' };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('vinh-ha-long');
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search query (English title)', () => {
      const query: ListPlacesQueryDto = { q: 'da lat' };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('da-lat');
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search query (summary)', () => {
      const query: ListPlacesQueryDto = { q: 'di sản' };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('vinh-ha-long');
      expect(result.meta.total).toBe(1);
    });

    it('should be case insensitive', () => {
      const query: ListPlacesQueryDto = { q: 'HẠ LONG' };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('vinh-ha-long');
    });

    it('should filter by region', () => {
      const query: ListPlacesQueryDto = { region: 'r_lam_dong' };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('da-lat');
      expect(result.meta.total).toBe(1);
    });

    it('should combine search and region filters', () => {
      const query: ListPlacesQueryDto = { q: 'đà lạt', region: 'r_lam_dong' };
      const result = service.list(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('da-lat');
    });

    it('should return empty results for non-matching filters', () => {
      const query: ListPlacesQueryDto = { q: 'non-existent' };
      const result = service.list(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should handle empty page results', () => {
      const query: ListPlacesQueryDto = { page: 10, pageSize: 20 };
      const result = service.list(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta).toEqual({ page: 10, pageSize: 20, total: 3 });
    });
  });

  describe('findBySlug', () => {
    it('should return place when found', () => {
      const result = service.findBySlug('vinh-ha-long');
      
      expect(result).toBeDefined();
      expect(result?.slug).toBe('vinh-ha-long');
      expect(result?.titleVi).toBe('Vịnh Hạ Long');
    });

    it('should return undefined when not found', () => {
      const result = service.findBySlug('non-existent');
      
      expect(result).toBeUndefined();
    });

    it('should find all seed places by slug', () => {
      const slugs = ['vinh-ha-long', 'da-lat', 'pho-co-hoi-an'];
      
      slugs.forEach(slug => {
        const result = service.findBySlug(slug);
        expect(result).toBeDefined();
        expect(result?.slug).toBe(slug);
      });
    });
  });
});