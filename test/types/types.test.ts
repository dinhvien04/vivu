import type { 
  Locale, 
  UserRole, 
  PlaceStatus, 
  GeoPoint, 
  Region, 
  Category, 
  Place, 
  Paginated, 
  ApiError 
} from '@vivu/types';

describe('Types Package', () => {
  describe('Locale', () => {
    it('should accept valid locale values', () => {
      const vi: Locale = 'vi';
      const en: Locale = 'en';
      
      expect(vi).toBe('vi');
      expect(en).toBe('en');
    });
  });

  describe('UserRole', () => {
    it('should accept valid user role values', () => {
      const user: UserRole = 'user';
      const editor: UserRole = 'editor';
      const admin: UserRole = 'admin';
      
      expect(user).toBe('user');
      expect(editor).toBe('editor');
      expect(admin).toBe('admin');
    });
  });

  describe('PlaceStatus', () => {
    it('should accept valid place status values', () => {
      const draft: PlaceStatus = 'draft';
      const published: PlaceStatus = 'published';
      const archived: PlaceStatus = 'archived';
      
      expect(draft).toBe('draft');
      expect(published).toBe('published');
      expect(archived).toBe('archived');
    });
  });

  describe('GeoPoint', () => {
    it('should have correct structure', () => {
      const geoPoint: GeoPoint = {
        lat: 20.9101,
        lng: 107.1839
      };
      
      expect(typeof geoPoint.lat).toBe('number');
      expect(typeof geoPoint.lng).toBe('number');
      expect(geoPoint.lat).toBe(20.9101);
      expect(geoPoint.lng).toBe(107.1839);
    });
  });

  describe('Region', () => {
    it('should have correct structure', () => {
      const region: Region = {
        id: 'r_quang_ninh',
        slug: 'quang-ninh',
        nameVi: 'Quảng Ninh',
        nameEn: 'Quang Ninh',
        parentId: null
      };
      
      expect(typeof region.id).toBe('string');
      expect(typeof region.slug).toBe('string');
      expect(typeof region.nameVi).toBe('string');
      expect(typeof region.nameEn).toBe('string');
      expect(region.parentId).toBeNull();
    });

    it('should allow parentId to be string', () => {
      const childRegion: Region = {
        id: 'r_ha_long',
        slug: 'ha-long',
        nameVi: 'Hạ Long',
        nameEn: 'Ha Long',
        parentId: 'r_quang_ninh'
      };
      
      expect(typeof childRegion.parentId).toBe('string');
    });
  });

  describe('Category', () => {
    it('should have correct structure', () => {
      const category: Category = {
        id: 'c_beach',
        slug: 'beach',
        nameVi: 'Biển',
        nameEn: 'Beach',
        icon: 'beach_access'
      };
      
      expect(typeof category.id).toBe('string');
      expect(typeof category.slug).toBe('string');
      expect(typeof category.nameVi).toBe('string');
      expect(typeof category.nameEn).toBe('string');
      expect(typeof category.icon).toBe('string');
    });

    it('should allow icon to be null', () => {
      const category: Category = {
        id: 'c_other',
        slug: 'other',
        nameVi: 'Khác',
        nameEn: 'Other',
        icon: null
      };
      
      expect(category.icon).toBeNull();
    });
  });

  describe('Place', () => {
    it('should have correct structure with all required fields', () => {
      const place: Place = {
        id: 'p_001',
        slug: 'vinh-ha-long',
        titleVi: 'Vịnh Hạ Long',
        titleEn: 'Ha Long Bay',
        summaryVi: 'Di sản thiên nhiên thế giới',
        summaryEn: 'UNESCO world heritage site',
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
      
      expect(typeof place.id).toBe('string');
      expect(typeof place.slug).toBe('string');
      expect(typeof place.titleVi).toBe('string');
      expect(typeof place.titleEn).toBe('string');
      expect(Array.isArray(place.bestSeasons)).toBe(true);
      expect(place.status).toBe('published');
      expect(place.geo).toHaveProperty('lat');
      expect(place.geo).toHaveProperty('lng');
    });

    it('should allow nullable fields to be null', () => {
      const place: Place = {
        id: 'p_002',
        slug: 'test-place',
        titleVi: 'Test Place',
        titleEn: null,
        summaryVi: null,
        summaryEn: null,
        descriptionVi: null,
        descriptionEn: null,
        regionId: 'r_test',
        address: null,
        geo: null,
        bestSeasons: [],
        status: 'draft',
        heroImageUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      
      expect(place.titleEn).toBeNull();
      expect(place.summaryVi).toBeNull();
      expect(place.geo).toBeNull();
      expect(place.heroImageUrl).toBeNull();
    });
  });

  describe('Paginated', () => {
    it('should have correct structure', () => {
      const paginatedPlaces: Paginated<Place> = {
        data: [],
        meta: {
          page: 1,
          pageSize: 20,
          total: 0
        }
      };
      
      expect(Array.isArray(paginatedPlaces.data)).toBe(true);
      expect(typeof paginatedPlaces.meta.page).toBe('number');
      expect(typeof paginatedPlaces.meta.pageSize).toBe('number');
      expect(typeof paginatedPlaces.meta.total).toBe('number');
    });

    it('should work with different data types', () => {
      const paginatedStrings: Paginated<string> = {
        data: ['test1', 'test2'],
        meta: {
          page: 1,
          pageSize: 2,
          total: 2
        }
      };
      
      expect(paginatedStrings.data).toHaveLength(2);
      expect(paginatedStrings.data[0]).toBe('test1');
    });
  });

  describe('ApiError', () => {
    it('should have correct structure with required fields', () => {
      const error: ApiError = {
        type: 'about:blank',
        title: 'Not Found',
        status: 404
      };
      
      expect(typeof error.type).toBe('string');
      expect(typeof error.title).toBe('string');
      expect(typeof error.status).toBe('number');
    });

    it('should allow optional fields', () => {
      const error: ApiError = {
        type: 'https://example.com/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'The request body is invalid',
        instance: '/api/v1/places'
      };
      
      expect(typeof error.detail).toBe('string');
      expect(typeof error.instance).toBe('string');
    });
  });
});