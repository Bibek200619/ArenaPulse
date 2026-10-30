import { describe, expect, it, vi } from 'vitest';
import catalog from '@/features/sports/demo-catalog';
import { SportScoreProvider } from '@/services/sports/providers/sportscore-provider';

const footballId = catalog.sports.find(
  (sport) => sport.slug === 'football',
)!.id;
const payload = {
  updated: '2026-10-30T16:15:00Z',
  matches: [
    {
      home: 'Harbour Town FC',
      away: 'Summit Rovers',
      home_score: '2',
      away_score: '1',
      status: 'live',
      status_text: '67′',
      time: '2026-10-30T15:00:00Z',
      competition: 'Example Premier League',
      url: '/football/match/harbour-town-vs-summit-rovers/abc123/',
    },
    {
      home: 'North FC',
      away: 'South FC',
      home_score: '0',
      away_score: '0',
      status: 'not_started',
      status_text: '20:00',
      time: '2026-10-30T20:00:00Z',
      competition: 'Example Cup',
      url: '/football/match/north-fc-vs-south-fc/def456/',
    },
    {
      home: 'East FC',
      away: 'West FC',
      home_score: '1',
      away_score: '1',
      status: 'finished',
      status_text: 'Finished',
      time: '2026-10-29T20:00:00Z',
      competition: 'Example League',
      url: '/football/match/east-fc-vs-west-fc/ghi789/',
    },
  ],
};

function fetchResponse(body: unknown = payload, status = 200) {
  return vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

describe('SportScoreProvider', () => {
  it('maps live scores and sends an optional key only in the server request header', async () => {
    const request = fetchResponse();
    const provider = new SportScoreProvider('test-secret', request);
    const result = await provider.getFixtures({
      sportId: footballId,
      offset: 0,
      limit: 10,
    });

    expect(result).toMatchObject({
      provenance: {
        source: 'sportscore-football-v1',
        isDemo: false,
        observedAt: '2026-10-30T16:15:00.000Z',
      },
      data: { total: 3 },
    });
    expect(result.data.items[0]).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      competitionName: 'Example Premier League',
      state: 'live',
      clock: '67′',
      participants: [
        { name: 'Harbour Town FC', score: '2', winner: true },
        { name: 'Summit Rovers', score: '1', winner: false },
      ],
      events: [],
      lineups: [],
    });
    const [url, options] = request.mock.calls[0];
    expect(String(url)).toContain('sport=football');
    expect(new Headers(options?.headers).get('X-API-Key')).toBe('test-secret');
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it('filters and paginates live fixtures using the existing match query', async () => {
    const provider = new SportScoreProvider(undefined, fetchResponse());
    const result = await provider.getFixtures({
      sportId: footballId,
      state: 'live',
      offset: 0,
      limit: 1,
    });
    expect(result.data).toMatchObject({ total: 1, offset: 0, limit: 1 });
    expect(result.data.items[0].state).toBe('live');
  });

  it('uses demo fixtures for other sports without making a network request', async () => {
    const request = fetchResponse();
    const provider = new SportScoreProvider(undefined, request);
    const result = await provider.getFixtures({
      sportId: catalog.sports.find((sport) => sport.slug === 'cricket')!.id,
      offset: 0,
      limit: 10,
    });
    expect(result.provenance.isDemo).toBe(true);
    expect(
      result.data.items.every((match) => match.sportId !== footballId),
    ).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it('resolves detail IDs from the provider match list', async () => {
    const provider = new SportScoreProvider(undefined, fetchResponse());
    const [listed] = (
      await provider.getFixtures({
        sportId: footballId,
        offset: 0,
        limit: 10,
      })
    ).data.items;
    const detail = await provider.getMatch(listed.id);
    expect(detail.data).toMatchObject({ id: listed.id, state: 'live' });
  });

  it('rejects malformed and failed provider responses', async () => {
    const invalid = new SportScoreProvider(
      undefined,
      fetchResponse({ matches: [{}] }),
    );
    await expect(
      invalid.getFixtures({ sportId: footballId, offset: 0, limit: 10 }),
    ).rejects.toThrow('SportScore response was invalid.');

    const unavailable = new SportScoreProvider(
      undefined,
      fetchResponse({}, 503),
    );
    await expect(
      unavailable.getFixtures({ sportId: footballId, offset: 0, limit: 10 }),
    ).rejects.toThrow('SportScore request failed.');
  });
});
