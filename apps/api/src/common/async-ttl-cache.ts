export class AsyncTtlCache<T> {
  private cached?: { value: T; expiresAt: number };
  private pending?: Promise<T>;

  constructor(private readonly ttlMs: number) {}

  get(loader: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) {
      return Promise.resolve(this.cached.value);
    }
    if (this.pending) return this.pending;

    this.pending = loader()
      .then((value) => {
        if (this.ttlMs > 0) {
          this.cached = { value, expiresAt: Date.now() + this.ttlMs };
        }
        return value;
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }

  clear(): void {
    this.cached = undefined;
  }
}
