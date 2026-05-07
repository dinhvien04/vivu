import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../apps/api/src/app.module';

describe('Places API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/places', () => {
    it('should return paginated places', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('pageSize');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should return 3 seed places by default', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.total).toBe(3);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places?page=1&pageSize=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.pageSize).toBe(2);
      expect(response.body.meta.total).toBe(3);
    });

    it('should handle search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places?q=hạ long')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('vinh-ha-long');
    });

    it('should handle region filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places?region=r_lam_dong')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('da-lat');
    });

    it('should validate pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/places?page=0')
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/v1/places?pageSize=101')
        .expect(400);
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places?q=nonexistent')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /api/v1/places/:slug', () => {
    it('should return place detail for valid slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places/vinh-ha-long')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.slug).toBe('vinh-ha-long');
      expect(response.body.data.titleVi).toBe('Vịnh Hạ Long');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Không tìm thấy địa điểm');
    });

    it('should return all required place fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places/da-lat')
        .expect(200);

      const place = response.body.data;
      expect(place).toHaveProperty('id');
      expect(place).toHaveProperty('slug');
      expect(place).toHaveProperty('titleVi');
      expect(place).toHaveProperty('titleEn');
      expect(place).toHaveProperty('summaryVi');
      expect(place).toHaveProperty('regionId');
      expect(place).toHaveProperty('geo');
      expect(place).toHaveProperty('bestSeasons');
      expect(place).toHaveProperty('status');
      expect(place).toHaveProperty('createdAt');
      expect(place).toHaveProperty('updatedAt');
    });

    it('should return place with correct geo coordinates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/places/pho-co-hoi-an')
        .expect(200);

      const place = response.body.data;
      expect(place.geo).toHaveProperty('lat');
      expect(place.geo).toHaveProperty('lng');
      expect(typeof place.geo.lat).toBe('number');
      expect(typeof place.geo.lng).toBe('number');
    });
  });

  describe('Health endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/healthz')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/readyz')
        .expect(200);

      expect(response.body).toEqual({ status: 'ready' });
    });
  });

  describe('Security headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/healthz')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      await request(app.getHttpServer())
        .options('/api/v1/places')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
    });
  });
});