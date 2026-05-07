import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ListPlacesQueryDto } from '../../../apps/api/src/places/dto/list-places.query.dto';

describe('ListPlacesQueryDto', () => {
  async function validateDto(dto: any) {
    const transformed = plainToClass(ListPlacesQueryDto, dto);
    const errors = await validate(transformed);
    return { transformed, errors };
  }

  describe('q (search query)', () => {
    it('should accept valid string', async () => {
      const { errors } = await validateDto({ q: 'hạ long' });
      expect(errors).toHaveLength(0);
    });

    it('should accept empty string', async () => {
      const { errors } = await validateDto({ q: '' });
      expect(errors).toHaveLength(0);
    });

    it('should be optional', async () => {
      const { errors } = await validateDto({});
      expect(errors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const { errors } = await validateDto({ q: 123 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('q');
    });
  });

  describe('region', () => {
    it('should accept valid string', async () => {
      const { errors } = await validateDto({ region: 'r_quang_ninh' });
      expect(errors).toHaveLength(0);
    });

    it('should be optional', async () => {
      const { errors } = await validateDto({});
      expect(errors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const { errors } = await validateDto({ region: 123 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('region');
    });
  });

  describe('category', () => {
    it('should accept valid string', async () => {
      const { errors } = await validateDto({ category: 'c_beach' });
      expect(errors).toHaveLength(0);
    });

    it('should be optional', async () => {
      const { errors } = await validateDto({});
      expect(errors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const { errors } = await validateDto({ category: 123 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('category');
    });
  });

  describe('page', () => {
    it('should accept valid positive integer', async () => {
      const { transformed, errors } = await validateDto({ page: '5' });
      expect(errors).toHaveLength(0);
      expect(transformed.page).toBe(5);
    });

    it('should transform string to number', async () => {
      const { transformed, errors } = await validateDto({ page: '10' });
      expect(errors).toHaveLength(0);
      expect(transformed.page).toBe(10);
      expect(typeof transformed.page).toBe('number');
    });

    it('should be optional', async () => {
      const { errors } = await validateDto({});
      expect(errors).toHaveLength(0);
    });

    it('should reject zero', async () => {
      const { errors } = await validateDto({ page: '0' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject negative numbers', async () => {
      const { errors } = await validateDto({ page: '-1' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject non-integer values', async () => {
      const { errors } = await validateDto({ page: '1.5' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject non-numeric strings', async () => {
      const { errors } = await validateDto({ page: 'abc' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });
  });

  describe('pageSize', () => {
    it('should accept valid positive integer', async () => {
      const { transformed, errors } = await validateDto({ pageSize: '20' });
      expect(errors).toHaveLength(0);
      expect(transformed.pageSize).toBe(20);
    });

    it('should transform string to number', async () => {
      const { transformed, errors } = await validateDto({ pageSize: '50' });
      expect(errors).toHaveLength(0);
      expect(transformed.pageSize).toBe(50);
      expect(typeof transformed.pageSize).toBe('number');
    });

    it('should be optional', async () => {
      const { errors } = await validateDto({});
      expect(errors).toHaveLength(0);
    });

    it('should reject zero', async () => {
      const { errors } = await validateDto({ pageSize: '0' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageSize');
    });

    it('should reject values over 100', async () => {
      const { errors } = await validateDto({ pageSize: '101' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageSize');
    });

    it('should accept maximum value of 100', async () => {
      const { transformed, errors } = await validateDto({ pageSize: '100' });
      expect(errors).toHaveLength(0);
      expect(transformed.pageSize).toBe(100);
    });

    it('should reject negative numbers', async () => {
      const { errors } = await validateDto({ pageSize: '-1' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageSize');
    });
  });

  describe('combined validation', () => {
    it('should accept all valid parameters together', async () => {
      const { transformed, errors } = await validateDto({
        q: 'hạ long',
        region: 'r_quang_ninh',
        category: 'c_beach',
        page: '2',
        pageSize: '10'
      });

      expect(errors).toHaveLength(0);
      expect(transformed.q).toBe('hạ long');
      expect(transformed.region).toBe('r_quang_ninh');
      expect(transformed.category).toBe('c_beach');
      expect(transformed.page).toBe(2);
      expect(transformed.pageSize).toBe(10);
    });

    it('should handle mixed valid and invalid parameters', async () => {
      const { errors } = await validateDto({
        q: 'valid query',
        page: '-1', // invalid
        pageSize: '20' // valid
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });
  });
});