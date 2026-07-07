import { resolveJwtAccessSecret, isWeakJwtSecret } from './jwt-secret';

function config(secret: string | undefined) {
  return {
    get: jest.fn(() => secret),
  };
}

describe('resolveJwtAccessSecret', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects weak secrets in production', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      JEST_WORKER_ID: undefined,
    };
    expect(() => resolveJwtAccessSecret(config('replace-me-access') as never)).toThrow(
      /JWT_ACCESS_SECRET is too weak/,
    );
  });

  it('accepts strong secrets in production', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      JEST_WORKER_ID: undefined,
    };
    const secret = 'a'.repeat(48);
    expect(resolveJwtAccessSecret(config(secret) as never)).toBe(secret);
  });

  it('flags placeholder-like secrets as weak', () => {
    expect(isWeakJwtSecret('replace-me-access')).toBe(true);
    const strongSecret = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEF';
    expect(isWeakJwtSecret(strongSecret)).toBe(false);
  });
});
