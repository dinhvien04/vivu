import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OAuthStateService } from './oauth-state.service';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

function makeKv() {
  const store = new Map<string, string>();
  return {
    setJson: jest.fn(async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
    getJson: jest.fn(async <T>(key: string): Promise<T | null> => {
      const raw = store.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    store,
  };
}

describe('OAuthStateService', () => {
  const allowed = 'http://localhost:3000,https://vivu.vn';

  it('creates and verifies a valid OAuth state once', async () => {
    const kv = makeKv();
    const service = new OAuthStateService(
      kv as never,
      config({
        GOOGLE_ALLOWED_REDIRECTS: allowed,
        CORS_ORIGINS: 'http://localhost:3000',
      }) as never,
    );

    const state = await service.createState('/trips', 'http://localhost:3000');
    const verified = await service.verifyAndConsumeState(state);

    expect(verified).toEqual({
      next: '/trips',
      origin: 'http://localhost:3000',
    });
    expect(kv.delete).toHaveBeenCalledWith(`oauth:state:${state}`);
  });

  it('rejects invalid state', async () => {
    const kv = makeKv();
    const service = new OAuthStateService(
      kv as never,
      config({
        GOOGLE_ALLOWED_REDIRECTS: allowed,
      }) as never,
    );

    await expect(service.verifyAndConsumeState('not-a-real-nonce')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.verifyAndConsumeState('')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects replayed state after successful verification', async () => {
    const kv = makeKv();
    const service = new OAuthStateService(
      kv as never,
      config({
        GOOGLE_ALLOWED_REDIRECTS: allowed,
      }) as never,
    );

    const state = await service.createState('/', 'https://vivu.vn');
    await service.verifyAndConsumeState(state);

    await expect(service.verifyAndConsumeState(state)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects disallowed origin instead of silently falling back', async () => {
    const kv = makeKv();
    const service = new OAuthStateService(
      kv as never,
      config({
        GOOGLE_ALLOWED_REDIRECTS: allowed,
      }) as never,
    );

    const state = await service.createState('/', 'https://evil.example');
    await expect(service.verifyAndConsumeState(state)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('resolveAllowedOrigin rejects disallowed origins', () => {
    const kv = makeKv();
    const service = new OAuthStateService(
      kv as never,
      config({
        GOOGLE_ALLOWED_REDIRECTS: allowed,
      }) as never,
    );

    expect(() => service.resolveAllowedOrigin('https://evil.example')).toThrow(
      UnauthorizedException,
    );
  });
});
