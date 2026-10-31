import { expect, it, vi } from 'vitest';
import type { MatchQuery } from '@/features/sports/types';
import type { SportsDataProvider } from '@/services/sports/providers/sports-provider';
import { DemoSportsProvider } from '@/services/sports/providers/demo-provider';
import { SportsService } from '@/services/sports/service';

it('uses SportScore only for explicit football league queries', async () => {
  const demo = new DemoSportsProvider(() => new Date('2026-10-31T12:00:00Z'));
  const demoGetFixtures = vi.spyOn(demo, 'getFixtures');
  const liveGetFixtures = vi.fn(async (query: MatchQuery) => ({
    data: {
      items: [],
      total: 0,
      offset: query.offset,
      limit: query.limit,
    },
    provenance: {
      source: 'sportscore-football-v1',
      isDemo: false,
      observedAt: '2026-10-31T12:00:00.000Z',
      fetchedAt: '2026-10-31T12:00:00.000Z',
      label: 'Live football fixtures',
    },
  }));
  const live = {
    id: 'sportscore-football-v1',
    getFixtures: liveGetFixtures,
  } as unknown as SportsDataProvider;
  const service = new SportsService(demo, undefined, live);

  await service.getFixtures({
    footballLeague: 'la-liga',
    offset: 0,
    limit: 20,
  });
  await service.getFixtures({ offset: 0, limit: 20 });

  expect(liveGetFixtures).toHaveBeenCalledWith(
    expect.objectContaining({ footballLeague: 'la-liga' }),
  );
  expect(liveGetFixtures).toHaveBeenCalledTimes(1);
  expect(demoGetFixtures).toHaveBeenCalledTimes(1);
});
