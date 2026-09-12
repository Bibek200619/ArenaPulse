import catalog from '@/features/sports/demo-catalog';
import type {
  SportsCatalog,
  SportsResult,
  MatchQuery,
} from '@/features/sports/types';
import type { SportsDataProvider } from './sports-provider';
import { AppError } from '@/lib/errors';
import { matchQuerySchema } from '@/features/sports/validation';
const data: SportsCatalog = catalog;
export const DEMO_OBSERVED_AT = '2026-09-09T18:00:00Z';
export class DemoSportsProvider implements SportsDataProvider {
  readonly id = 'arenapulse-demo-v1';
  constructor(private readonly now: () => Date = () => new Date()) {}
  private result<T>(value: T): SportsResult<T> {
    return {
      data: structuredClone(value),
      provenance: {
        source: this.id,
        isDemo: true,
        observedAt: DEMO_OBSERVED_AT,
        fetchedAt: this.now().toISOString(),
        label: 'Fictional demo data · Snapshot 9 Sep 2026 · Not live coverage',
      },
    };
  }
  private find<T extends { id: string }>(items: T[], id: string) {
    const value = items.find((item) => item.id === id);
    if (!value)
      throw new AppError('NOT_FOUND', 'This sports record was not found.');
    return this.result(value);
  }
  async getSports() {
    return this.result(data.sports);
  }
  async getCompetitions() {
    return this.result(data.competitions);
  }
  async getSeasons() {
    return this.result(data.seasons);
  }
  async getTeams() {
    return this.result(data.teams);
  }
  async getPlayers() {
    return this.result(data.players);
  }
  async getTeam(id: string) {
    return this.find(data.teams, id);
  }
  async getPlayer(id: string) {
    return this.find(data.players, id);
  }
  async getVenue(id: string) {
    return this.find(data.venues, id);
  }
  async getMatch(id: string) {
    return this.find(data.matches, id);
  }
  async getFixtures(input: MatchQuery) {
    const query = matchQuerySchema.parse(input);
    const filtered = data.matches
      .filter(
        (match) =>
          (!query.teamId ||
            match.participants.some(
              (participant) =>
                participant.kind === 'team' &&
                participant.entityId === query.teamId,
            )) &&
          (!query.playerId ||
            match.participants.some(
              (participant) =>
                participant.kind === 'player' &&
                participant.entityId === query.playerId,
            ) ||
            match.lineups.some((entry) => entry.playerId === query.playerId) ||
            match.events.some((event) => event.playerId === query.playerId)) &&
          (!query.sportId || match.sportId === query.sportId) &&
          (!query.competitionId ||
            match.competitionId === query.competitionId) &&
          (!query.state || match.state === query.state) &&
          (!query.date || match.startsAt.slice(0, 10) === query.date) &&
          (!query.startsAfter ||
            Date.parse(match.startsAt) >= Date.parse(query.startsAfter)),
      )
      .sort(
        (a, b) =>
          a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id),
      );
    return this.result({
      items: filtered.slice(query.offset, query.offset + query.limit),
      total: filtered.length,
      offset: query.offset,
      limit: query.limit,
    });
  }
  async getLiveMatches(query: Omit<MatchQuery, 'state'>) {
    return this.getFixtures({ ...query, state: 'live' });
  }
  async getStandings(competitionId: string) {
    this.find(data.competitions, competitionId);
    return this.result(
      data.standings
        .filter((standing) => standing.competitionId === competitionId)
        .sort((a, b) => a.rank - b.rank),
    );
  }
}
