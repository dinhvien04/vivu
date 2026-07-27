import { parseCorsOrigins } from './cors-origins';

describe('parseCorsOrigins', () => {
  it('normalizes origins to lowercase and drops wildcards', () => {
    expect(parseCorsOrigins('https://Vivu.vn, *, http://LOCALHOST:3000')).toEqual([
      'https://vivu.vn',
      'http://localhost:3000',
    ]);
  });
});
