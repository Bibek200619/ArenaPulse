import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import catalog from '@/features/sports/demo-catalog';
import type {
  Match,
  MatchQuery,
  Page,
  SportsResult,
} from '@/features/sports/types';
import { matchQuerySchema } from '@/features/sports/validation';
import { AppError } from '@/lib/errors';
import { DemoSportsProvider } from './demo-provider';

const FOOTBALL_ID = catalog.sports.find(
  (sport) => sport.slug === 'football',
)!.id;
const FOOTBALL_SEASON_ID = catalog.seasons.find(
  (season) =>
    season.competitionId ===
    catalog.competitions.find((c) => c.sportId === FOOTBALL_ID)!.id,
)!.id;
const FOOTBALL_COMPETITION_ID = catalog.competitions.find(
  (competition) => competition.sportId === FOOTBALL_ID,
)!.id;

const matchSchema = z.object({
  home: z.string().min(1),
  away: z.string().min(1),
  home_score: z.union([z.string(), z.number()]).nullable().optional(),
  away_score: z.union([z.string(), z.number()]).nullable().optional(),
  status: z.string().min(1),
  status_text: z.string().optional(),
  time: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  competition: z.string().default('Football'),
  url: z.string().optional(),
});
const responseSchema = z.object({
  updated: z.string().optional(),
  matches: z.array(matchSchema),
});
type SportScoreMatch = z.infer<typeof matchSchema>;

function stableId(value: string) {
  const hex = createHash('sha256').update(value).digest('hex').slice(0, 32);
  const chars = hex.split('');
  chars[12] = '5';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const uuid = chars.join('');
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}

function matchKey(match: SportScoreMatch) {
  const pathId = match.url
    ? new URL(match.url, 'https://sportscore.com').pathname
        .split('/')
        .filter(Boolean)
        .at(-1)
    : undefined;
  return (
    pathId ?? `${match.home}:${match.away}:${match.time}:${match.competition}`
  );
}

function scoreText(value: string | number | null | undefined) {
  return value === null || value === undefined || value === ''
    ? null
    : String(value);
}

function stateFor(status: string): Match['state'] {
  const normalized = status.trim().toLowerCase().replaceAll(/[_-]+/g, ' ');
  if (['ht', 'half time', 'halftime', 'break', 'paused'].includes(normalized))
    return 'paused';
  if (
    ['live', 'in progress', '1h', '2h', 'et', 'pen', 'extra time'].includes(
      normalized,
    ) ||
    /^(first|second) half$/.test(normalized)
  )
    return 'live';
  if (['ft', 'finished', 'full time', 'ended', 'aet'].includes(normalized))
    return 'finished';
  if (normalized.includes('postpon')) return 'postponed';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('abandon')) return 'abandoned';
  return 'scheduled';
}

function numericScore(value: string | number | null) {
  if (value === null) return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function mapMatch(match: SportScoreMatch): Match {
  const id = stableId(`sportscore-match:${matchKey(match)}`);
  const homeScore = scoreText(match.home_score);
  const awayScore = scoreText(match.away_score);
  const homeNumeric = numericScore(homeScore);
  const awayNumeric = numericScore(awayScore);
  const competitionName = match.competition;
  return {
    id,
    sportId: FOOTBALL_ID,
    competitionId: stableId(`sportscore-competition:${competitionName}`),
    competitionName,
    seasonId: FOOTBALL_SEASON_ID,
    venueId: null,
    startsAt: new Date(match.time).toISOString(),
    state: stateFor(match.status),
    clock: match.status_text ?? null,
    participants: [
      {
        id: `${id}:home`,
        kind: 'team',
        entityId: stableId(`sportscore-team:${match.home}`),
        name: match.home,
        shortName: match.home,
        score: homeScore,
        winner:
          homeNumeric === null || awayNumeric === null
            ? null
            : homeNumeric === awayNumeric
              ? false
              : homeNumeric > awayNumeric,
      },
      {
        id: `${id}:away`,
        kind: 'team',
        entityId: stableId(`sportscore-team:${match.away}`),
        name: match.away,
        shortName: match.away,
        score: awayScore,
        winner:
          homeNumeric === null || awayNumeric === null
            ? null
            : homeNumeric === awayNumeric
              ? false
              : awayNumeric > homeNumeric,
      },
    ],
    events: [],
    statistics: [],
    lineups: [],
  };
}

function matchesQuery(match: Match, query: MatchQuery) {
  return (
    (!query.competitionId || match.competitionId === query.competitionId) &&
    (!query.state || match.state === query.state) &&
    (!query.date || match.startsAt.slice(0, 10) === query.date) &&
    (!query.startsAfter ||
      Date.parse(match.startsAt) >= Date.parse(query.startsAfter))
  );
}

function page<T>(items: T[], query: MatchQuery): Page<T> {
  return {
    items: items.slice(query.offset, query.offset + query.limit),
    total: items.length,
    offset: query.offset,
    limit: query.limit,
  };
}

function compareMatches(a: Match, b: Match) {
  const priority = (state: Match['state']) =>
    state === 'live'
      ? 0
      : state === 'paused'
        ? 1
        : state === 'scheduled'
          ? 2
          : 3;
  const stateOrder = priority(a.state) - priority(b.state);
  if (stateOrder !== 0) return stateOrder;
  return a.state === 'finished' || a.state === 'cancelled'
    ? b.startsAt.localeCompare(a.startsAt)
    : a.startsAt.localeCompare(b.startsAt);
}

export class SportScoreProvider extends DemoSportsProvider {
  readonly id = 'sportscore-football-v1';

  constructor(
    private readonly apiKey?: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly clock: () => Date = () => new Date(),
  ) {
    super(clock);
  }

  private async fetchMatches() {
    const headers = new Headers({ accept: 'application/json' });
    if (this.apiKey) headers.set('X-API-Key', this.apiKey);
    const response = await this.fetcher(
      'https://sportscore.com/api/widget/matches/?sport=football&limit=50&src=arenapulse',
      { headers, signal: AbortSignal.timeout(8_000), cache: 'no-store' },
    );
    if (!response.ok) throw new Error('SportScore request failed.');
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error('SportScore response was invalid.');
    const fetchedAt = this.clock().toISOString();
    const providerUpdated = parsed.data.updated;
    const observedAt =
      providerUpdated && Number.isFinite(Date.parse(providerUpdated))
        ? new Date(providerUpdated).toISOString()
        : fetchedAt;
    return {
      matches: parsed.data.matches.map(mapMatch),
      provenance: {
        source: this.id,
        isDemo: false,
        observedAt,
        fetchedAt,
        label: `Live football scores and recent fixtures · Updated ${observedAt}`,
      },
    } as const;
  }

  override async getFixtures(
    input: MatchQuery,
  ): Promise<SportsResult<Page<Match>>> {
    const query = matchQuerySchema.parse(input);
    if (
      query.teamId ||
      query.playerId ||
      (query.sportId && query.sportId !== FOOTBALL_ID) ||
      query.competitionId === FOOTBALL_COMPETITION_ID
    )
      return super.getFixtures(query);

    // A remote outage must not take down the fictional non-football catalog.
    let live: Awaited<ReturnType<SportScoreProvider['fetchMatches']>>;
    try {
      live = await this.fetchMatches();
    } catch (error) {
      if (query.sportId === FOOTBALL_ID || query.competitionId) throw error;
      const demo = await super.getFixtures({ ...query, offset: 0, limit: 50 });
      const otherSports = demo.data.items.filter(
        (match) => match.sportId !== FOOTBALL_ID,
      );
      return {
        ...demo,
        data: {
          ...demo.data,
          items: otherSports.slice(query.offset, query.offset + query.limit),
          total: otherSports.length,
        },
        provenance: {
          ...demo.provenance,
          label: 'SportScore unavailable · Showing fictional demo fixtures only',
        },
      };
    }
    const realFootball = live.matches
      .filter((match) => matchesQuery(match, query))
      .sort(compareMatches);

    if (query.sportId === FOOTBALL_ID) {
      return {
        data: page(realFootball, query),
        provenance: live.provenance,
      };
    }

    const demo = await super.getFixtures({ ...query, offset: 0, limit: 50 });
    const otherSports = demo.data.items.filter(
      (match) => match.sportId !== FOOTBALL_ID,
    );
    const combined = [...realFootball, ...otherSports].sort(compareMatches);
    return {
      data: page(combined, query),
      provenance: {
        ...live.provenance,
        source: 'sportscore-football-v1+arenapulse-demo-v1',
        isDemo: true,
        label: 'Mixed sources · SportScore football (live/recent) and fictional demo fixtures for other sports',
      },
    };
  }

  override async getMatch(id: string): Promise<SportsResult<Match>> {
    // Preserve navigation from demo fixtures displayed alongside live football.
    if (
      catalog.matches.some(
        (match) => match.id === id && match.sportId !== FOOTBALL_ID,
      )
    ) {
      return super.getMatch(id);
    }
    const result = await this.getFixtures({
      sportId: FOOTBALL_ID,
      offset: 0,
      limit: 50,
    });
    const match = result.data.items.find((item) => item.id === id);
    if (!match)
      throw new AppError('NOT_FOUND', 'This sports record was not found.');
    return { data: match, provenance: result.provenance };
  }
}
