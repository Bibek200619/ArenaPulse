import type { SportsDataProvider } from './providers/sports-provider';
import type { MatchQuery } from '@/features/sports/types';
import { ProviderCache } from './cache';
import { DemoSportsProvider } from './providers/demo-provider';
import { AppError } from '@/lib/errors';
import { entityIdSchema, matchQuerySchema } from '@/features/sports/validation';

export class SportsService {
  constructor(
    readonly provider: SportsDataProvider,
    private readonly cache = new ProviderCache(),
  ) {}
  private async read<T>(key: string, ttl: number, load: () => Promise<T>) {
    try {
      return await this.cache.get(`${this.provider.id}:${key}`, ttl, load);
    } catch (error) {
      if (error instanceof AppError && error.code === 'NOT_FOUND') throw error;
      // Do not log provider error bodies: they may contain credentials or request URLs.
      throw new AppError(
        'EXTERNAL_PROVIDER_ERROR',
        'Sports data is temporarily unavailable. Please try again.',
      );
    }
  }
  getCatalog() {
    return this.read('catalog', 300_000, async () => {
      const [sports, competitions, teams, players, seasons] = await Promise.all(
        [
          this.provider.getSports(),
          this.provider.getCompetitions(),
          this.provider.getTeams(),
          this.provider.getPlayers(),
          this.provider.getSeasons(),
        ],
      );
      return {
        data: {
          sports: sports.data,
          competitions: competitions.data,
          teams: teams.data,
          players: players.data,
          seasons: seasons.data,
        },
        provenance: sports.provenance,
      };
    });
  }
  getFixtures(input: MatchQuery) {
    const query = matchQuerySchema.parse(input);
    return this.read(
      `fixtures:${JSON.stringify(query)}`,
      query.state === 'live' ? 30_000 : 60_000,
      () => this.provider.getFixtures(query),
    );
  }
  getMatch(id: string) {
    if (!entityIdSchema.safeParse(id).success)
      throw new AppError('VALIDATION_ERROR', 'Invalid match ID.');
    return this.read(`match:${id}`, 30_000, () => this.provider.getMatch(id));
  }
}
export const sportsService = new SportsService(new DemoSportsProvider());
