import { FetchTimeoutError } from './fetch-json';

describe('fetchJson', () => {
  it('defines FetchTimeoutError with timeout metadata', () => {
    const error = new FetchTimeoutError('https://example.com/slow', 5_000);
    expect(error.name).toBe('FetchTimeoutError');
    expect(error.timeoutMs).toBe(5_000);
    expect(error.message).toContain('5000ms');
  });
});
