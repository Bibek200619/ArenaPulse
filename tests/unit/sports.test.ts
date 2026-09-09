import { describe, expect, it, vi } from 'vitest';
import catalog from '@/features/sports/demo-catalog';
import {
  DemoSportsProvider,
  DEMO_OBSERVED_AT,
} from '@/services/sports/providers/demo-provider';
import { SportsService } from '@/services/sports/service';
import { matchQuerySchema } from '@/features/sports/validation';

const provider = new DemoSportsProvider(() => new Date('2026-10-01T00:00:00Z'));
describe('demo provider', () => {
  it('exposes a fictional snapshot separately from retrieval time', async () => {
    const result = await provider.getSports();
    expect(result.data.map((sport) => sport.slug)).toEqual([
      'football',
      'cricket',
      'basketball',
      'tennis',
    ]);
    expect(result.provenance).toMatchObject({
      isDemo: true,
      observedAt: DEMO_OBSERVED_AT,
      fetchedAt: '2026-10-01T00:00:00.000Z',
    });
  });
  it('keeps all seeded entity references coherent across sports', () => {
    for (const match of catalog.matches) {
      expect(
        catalog.competitions.find((c) => c.id === match.competitionId)?.sportId,
      ).toBe(match.sportId);
      expect(
        catalog.seasons.find((s) => s.id === match.seasonId)?.competitionId,
      ).toBe(match.competitionId);
      expect(catalog.venues.some((v) => v.id === match.venueId)).toBe(true);
      for (const participant of match.participants) {
        const entities =
          participant.kind === 'team' ? catalog.teams : catalog.players;
        expect(
          entities.find((e) => e.id === participant.entityId)?.sportId,
        ).toBe(match.sportId);
      }
      for (const event of match.events) {
        expect(event.matchId).toBe(match.id);
        expect(
          match.participants.some((p) => p.id === event.participantId),
        ).toBe(true);
        expect(catalog.players.some((p) => p.id === event.playerId)).toBe(true);
      }
    }
  });
  it('filters by sport, competition, UTC date and state with stable pagination', async () => {
    const sportId = catalog.sports[0].id;
    const result = await provider.getFixtures({
      sportId,
      competitionId: catalog.competitions[0].id,
      date: '2026-09-09',
      state: 'live',
      offset: 0,
      limit: 1,
    });
    expect(result.data.total).toBe(1);
    expect(result.data.items[0]).toMatchObject({ sportId, state: 'live' });
    const first = await provider.getFixtures({ offset: 0, limit: 5 });
    const second = await provider.getFixtures({ offset: 5, limit: 5 });
    expect(
      new Set([...first.data.items, ...second.data.items].map((m) => m.id))
        .size,
    ).toBe(10);
    expect(
      (await provider.getFixtures({ offset: 100, limit: 20 })).data.items,
    ).toEqual([]);
  });
  it('preserves sport-specific scores, individual participants and missing data', async () => {
    const live = await provider.getLiveMatches({ offset: 0, limit: 20 });
    expect(live.data.items).toHaveLength(4);
    expect(
      live.data.items
        .flatMap((m) => m.participants)
        .some((p) => p.score === '172/6'),
    ).toBe(true);
    expect(
      live.data.items
        .flatMap((m) => m.participants)
        .some((p) => p.kind === 'player'),
    ).toBe(true);
    const scheduled = await provider.getFixtures({
      state: 'scheduled',
      offset: 0,
      limit: 20,
    });
    for (const match of scheduled.data.items) {
      expect(
        match.participants.every((p) => p.score === null && p.winner === null),
      ).toBe(true);
      expect(match.statistics).toEqual([]);
    }
  });
  it('returns independent records and rejects unknown IDs', async () => {
    const team = await provider.getTeam(catalog.teams[0].id);
    team.data.name = 'corrupted';
    expect((await provider.getTeam(catalog.teams[0].id)).data.name).toBe(
      'Harbour Athletic',
    );
    await expect(provider.getMatch('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(provider.getPlayer('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
it.each([
  { limit: 0 },
  { limit: 51 },
  { offset: -1 },
  { sportId: 'x' },
  { state: 'in_progress' },
  { date: '2026-02-30' },
  { unknown: true },
])('rejects invalid filters: %j', (input) => {
  expect(matchQuerySchema.safeParse(input).success).toBe(false);
});
it('normalizes provider failures without leaking internal details and retries', async () => {
  const demo = new DemoSportsProvider();
  const call = vi
    .spyOn(demo, 'getFixtures')
    .mockRejectedValueOnce(new Error('secret upstream URL'));
  const service = new SportsService(demo);
  await expect(
    service.getFixtures({ offset: 0, limit: 20 }),
  ).rejects.toMatchObject({
    code: 'EXTERNAL_PROVIDER_ERROR',
    message: 'Sports data is temporarily unavailable. Please try again.',
  });
  expect((await service.getFixtures({ offset: 0, limit: 20 })).data.total).toBe(
    12,
  );
  expect(call).toHaveBeenCalledTimes(2);
  await expect(
    service.getMatch('00000000-0000-4000-8000-000000000000'),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});

it('scheduled matches before the cutoff are excluded from upcoming results', async () => {
  const result = await provider.getFixtures({
    state: 'scheduled',
    startsAfter: '2026-09-13T00:00:00Z',
    offset: 0,
    limit: 20,
  });
  expect(result.data.total).toBe(0);
});
