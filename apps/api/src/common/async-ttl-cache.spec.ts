import { AsyncTtlCache } from './async-ttl-cache';

describe('AsyncTtlCache', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the cached value until the TTL expires', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const loader = jest.fn().mockResolvedValue('first');
    const cache = new AsyncTtlCache<string>(5_000);

    await expect(cache.get(loader)).resolves.toBe('first');
    await expect(cache.get(loader)).resolves.toBe('first');
    expect(loader).toHaveBeenCalledTimes(1);

    now.mockReturnValue(6_001);
    loader.mockResolvedValue('second');
    await expect(cache.get(loader)).resolves.toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('shares one pending load across concurrent callers', async () => {
    let resolve!: (value: string) => void;
    const loader = jest.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    const cache = new AsyncTtlCache<string>(5_000);

    const first = cache.get(loader);
    const second = cache.get(loader);
    expect(loader).toHaveBeenCalledTimes(1);

    resolve('value');
    await expect(Promise.all([first, second])).resolves.toEqual(['value', 'value']);
  });

  it('does not cache rejected loads', async () => {
    const loader = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('recovered');
    const cache = new AsyncTtlCache<string>(5_000);

    await expect(cache.get(loader)).rejects.toThrow('temporary');
    await expect(cache.get(loader)).resolves.toBe('recovered');
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
