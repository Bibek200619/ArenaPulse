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

  it.each([
    ['champions-league', 'UEFA Champions League', 'uefa-champions-league'],
    ['premier-league', 'English Premier League', 'english-premier-league'],
    ['la-liga', 'Spanish La Liga', 'spanish-la-liga'],
  ] as const)(
    'fetches only the selected %s fixtures for the UTC date',
    async (footballLeague, competition, slug) => {
      const request = fetchResponse({
        matches: [
          {
            ...payload.matches[0],
            competition,
            time: '2026-10-31T12:30:00Z',
          },
          { ...payload.matches[1], competition: 'Unrelated Competition' },
        ],
      });
      const provider = new SportScoreProvider(
        undefined,
        request,
        () => new Date('2026-10-31T04:00:00Z'),
      );
      const result = await provider.getFixtures({
        sportId: catalog.sports.find((sport) => sport.slug === 'cricket')!.id,
        competitionId: catalog.competitions[1].id,
        footballLeague,
        date: '2026-10-31',
        offset: 0,
        limit: 10,
      });
      const [url] = request.mock.calls[0];
      const requestUrl = new URL(String(url));
      expect(requestUrl.pathname).toBe('/api/v1/fixtures/');
      expect(requestUrl.searchParams.get('competition')).toBe(slug);
      expect(requestUrl.searchParams.get('date')).toBe('2026-10-31');
      expect(requestUrl.searchParams.get('limit')).toBe('200');
      expect(result.provenance).toMatchObject({
        source: 'sportscore-football-v1',
        isDemo: false,
      });
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].competitionName).toBe(competition);
      expect(result.data.items[0].sportId).toBe(footballId);
    },
  );

  it('uses today in UTC and does not replace an empty league response with demo data', async () => {
    const request = fetchResponse({ matches: [] });
    const provider = new SportScoreProvider(
      undefined,
      request,
      () => new Date('2026-10-31T04:00:00Z'),
    );
    const result = await provider.getFixtures({
      footballLeague: 'champions-league',
      offset: 0,
      limit: 10,
    });
    const [url] = request.mock.calls[0];
    expect(new URL(String(url)).searchParams.get('date')).toBe('2026-10-31');
    expect(result.provenance.isDemo).toBe(false);
    expect(result.data).toMatchObject({ items: [], total: 0 });
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
