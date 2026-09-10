// Public provider data only. User-specific data must never enter this cache.
export class ProviderCache {
  private entries = new Map<string, { expires: number; value: unknown }>();
  private pending = new Map<string, Promise<unknown>>();
  constructor(
    private readonly capacity = 100,
    private readonly now = Date.now,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error('Cache capacity must be positive.');
  }
  async get<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
    if (!Number.isFinite(ttl) || ttl <= 0)
      throw new Error('Cache TTL must be positive.');
    const found = this.entries.get(key);
    if (found && found.expires > this.now())
      return structuredClone(found.value as T);
    const inflight = this.pending.get(key);
    if (inflight) return structuredClone((await inflight) as T);
    // Bound deduplication memory too; callers still receive a result at capacity.
    const canTrack = this.pending.size < this.capacity;
    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        this.entries.delete(key);
        if (this.entries.size >= this.capacity)
          this.entries.delete(this.entries.keys().next().value!);
        this.entries.set(key, {
          expires: this.now() + ttl,
          value: structuredClone(value),
        });
        return value;
      })
      .finally(() => {
        if (canTrack) this.pending.delete(key);
      });
    if (canTrack) this.pending.set(key, promise);
    return structuredClone(await promise);
  }
}
