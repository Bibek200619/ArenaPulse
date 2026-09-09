import { expect, it, vi } from 'vitest';
import { ProviderCache } from '@/services/sports/cache';
it('deduplicates concurrent reads and isolates callers from mutation', async () => {
  const cache = new ProviderCache();
  const load = vi.fn(async () => ({ scores: [1, 2] }));
  const [first, second] = await Promise.all([
    cache.get('match', 1000, load),
    cache.get('match', 1000, load),
  ]);
  first.scores[0] = 99;
  expect(second.scores).toEqual([1, 2]);
  expect((await cache.get('match', 1000, load)).scores).toEqual([1, 2]);
  expect(load).toHaveBeenCalledTimes(1);
});
it('expires data at its deadline and evicts old entries at capacity', async () => {
  let time = 0;
  const cache = new ProviderCache(1, () => time);
  const load = vi.fn(async () => 1);
  await cache.get('a', 100, load);
  time = 99;
  await cache.get('a', 100, load);
  expect(load).toHaveBeenCalledTimes(1);
  time = 100;
  await cache.get('a', 100, load);
  expect(load).toHaveBeenCalledTimes(2);
  await cache.get('b', 100, load);
  await cache.get('a', 100, load);
  expect(load).toHaveBeenCalledTimes(4);
});
it('does not poison the cache after a failed concurrent load', async () => {
  const cache = new ProviderCache();
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(2);
  const results = await Promise.allSettled([
    cache.get('a', 100, load),
    cache.get('a', 100, load),
  ]);
  expect(results.every((r) => r.status === 'rejected')).toBe(true);
  expect(await cache.get('a', 100, load)).toBe(2);
  expect(load).toHaveBeenCalledTimes(2);
});
