import { test, expect } from '@playwright/test';

test.describe('Places API E2E', () => {
  const API_BASE = process.env.API_URL || 'http://localhost:4000';

  test('should fetch places list successfully', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/places`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(3);
  });

  test('should fetch place detail successfully', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/places/vinh-ha-long`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data.slug).toBe('vinh-ha-long');
    expect(data.data.titleVi).toBe('Vịnh Hạ Long');
  });

  test('should return 404 for non-existent place', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/places/non-existent`);
    
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Không tìm thấy địa điểm');
  });

  test('should handle search query', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/places?q=hạ long`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data.length).toBe(1);
    expect(data.data[0].slug).toBe('vinh-ha-long');
  });

  test('should handle pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/places?page=1&pageSize=2`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data.length).toBe(2);
    expect(data.meta.page).toBe(1);
    expect(data.meta.pageSize).toBe(2);
    expect(data.meta.total).toBe(3);
  });

  test('should validate query parameters', async ({ request }) => {
    // Invalid page
    const invalidPage = await request.get(`${API_BASE}/api/v1/places?page=0`);
    expect(invalidPage.status()).toBe(400);
    
    // Invalid pageSize
    const invalidPageSize = await request.get(`${API_BASE}/api/v1/places?pageSize=101`);
    expect(invalidPageSize.status()).toBe(400);
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/places`);
    
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('should handle CORS correctly', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}/api/v1/places`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    expect(response.status()).toBe(204);
  });

  test('should return health status', async ({ request }) => {
    const healthResponse = await request.get(`${API_BASE}/api/v1/healthz`);
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    expect(healthData).toEqual({ status: 'ok' });
    
    const readyResponse = await request.get(`${API_BASE}/api/v1/readyz`);
    expect(readyResponse.ok()).toBeTruthy();
    
    const readyData = await readyResponse.json();
    expect(readyData).toEqual({ status: 'ready' });
  });

  test('should handle concurrent requests', async ({ request }) => {
    const requests = Array.from({ length: 10 }, () => 
      request.get(`${API_BASE}/api/v1/places`)
    );
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });
  });

  test('should return consistent data structure', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE}/api/v1/places`);
    const listData = await listResponse.json();
    
    // Check list response structure
    expect(listData).toHaveProperty('data');
    expect(listData).toHaveProperty('meta');
    expect(listData.meta).toHaveProperty('page');
    expect(listData.meta).toHaveProperty('pageSize');
    expect(listData.meta).toHaveProperty('total');
    
    // Check individual place structure
    const place = listData.data[0];
    expect(place).toHaveProperty('id');
    expect(place).toHaveProperty('slug');
    expect(place).toHaveProperty('titleVi');
    expect(place).toHaveProperty('geo');
    expect(place).toHaveProperty('bestSeasons');
    expect(place).toHaveProperty('status');
    
    // Check detail response structure
    const detailResponse = await request.get(`${API_BASE}/api/v1/places/${place.slug}`);
    const detailData = await detailResponse.json();
    
    expect(detailData).toHaveProperty('data');
    expect(detailData.data).toMatchObject(place);
  });
});