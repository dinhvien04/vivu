import { pathnameOnly, safeRequestUrl } from './safe-request-url';

describe('safe-request-url', () => {
  it('returns pathname only', () => {
    expect(pathnameOnly('/api/v1/auth/reset?token=abc')).toBe('/api/v1/auth/reset');
  });

  it('redacts sensitive query params when safe url is requested', () => {
    expect(safeRequestUrl('/callback?code=abc&state=xyz&next=%2F')).toBe(
      '/callback?code=%5BREDACTED%5D&state=%5BREDACTED%5D&next=%2F',
    );
  });
});
