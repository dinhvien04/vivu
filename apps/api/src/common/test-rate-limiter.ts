export function makeRateLimiter(options: { allowed?: boolean; limit?: number } = {}) {
  let count = 0;
  const limit = options.limit ?? Number.MAX_SAFE_INTEGER;
  return {
    incrementAndCheck: jest.fn().mockImplementation(async () => {
      count += 1;
      if (options.allowed === false) return false;
      return count <= limit;
    }),
    peek: jest.fn().mockResolvedValue(0),
    reset: jest.fn().mockResolvedValue(undefined),
  };
}