import { listPlaces, getPlaceBySlug, ListPlacesOptions } from '../../apps/web/src/lib/api';
import type { Place, Paginated } from '@vivu/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const BASE_URL = 'http://localhost:4000/api/v1';

  beforeEach(() => {
    mockFetch.mockClear();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe('listPlaces', () => {
    const mockPaginatedResponse: Paginated<Place> = {
      data: [
        {
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
        }
      ],
      meta: { page: 1, pageSize: 20, total: 1 }
    };

    it('should fetch places with default options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse,
      } as Response);

      const result = await listPlaces();

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/places`,
        expect.objectContaining({
          next: { revalidate: 60 }
        })
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should build query string with all options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse,
      } as Response);

      const options: ListPlacesOptions = {
        page: 2,
        pageSize: 10,
        q: 'hạ long',
        region: 'r_quang_ninh'
      };

      await listPlaces(options);

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/places?page=2&pageSize=10&q=h%E1%BA%A1+long&region=r_quang_ninh`,
        expect.any(Object)
      );
    });

    it('should handle partial options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse,
      } as Response);

      await listPlaces({ q: 'đà lạt' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/places?q=%C4%91%C3%A0+l%E1%BA%A1t`,
        expect.any(Object)
      );
    });

    it('should handle empty options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse,
      } as Response);

      await listPlaces({});

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/places`,
        expect.any(Object)
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(listPlaces()).rejects.toThrow('API /places → 500 Internal Server Error');
    });

    it('should use default API URL when env var not set', async () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse,
      } as Response);

      await listPlaces();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/places',
        expect.any(Object)
      );
    });
  });

  describe('getPlaceBySlug', () => {
    const mockPlace: Place = {
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

    const mockResponse = { data: mockPlace };

    it('should fetch place by slug', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getPlaceBySlug('vinh-ha-long');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/places/vinh-ha-long`,
        expect.objectContaining({
          next: { revalidate: 60 }
        })
      );
      expect(result).toEqual(mockPlace);
    });

    it('should handle special characters in slug', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await getPlaceBySlug('pho-co-hoi-an');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/places/pho-co-hoi-an`,
        expect.any(Object)
      );
    });

    it('should throw error on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(getPlaceBySlug('non-existent')).rejects.toThrow(
        'API /places/non-existent → 404 Not Found'
      );
    });

    it('should throw error on server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(getPlaceBySlug('vinh-ha-long')).rejects.toThrow(
        'API /places/vinh-ha-long → 500 Internal Server Error'
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(listPlaces()).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      await expect(listPlaces()).rejects.toThrow('Invalid JSON');
    });
  });
});