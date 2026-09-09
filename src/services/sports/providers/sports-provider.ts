import type {
  Competition,
  Match,
  MatchQuery,
  Page,
  Player,
  Season,
  Sport,
  SportsResult,
  Standing,
  Team,
  Venue,
} from '@/features/sports/types';
export interface SportsDataProvider {
  readonly id: string;
  getSports(): Promise<SportsResult<Sport[]>>;
  getCompetitions(): Promise<SportsResult<Competition[]>>;
  getSeasons(): Promise<SportsResult<Season[]>>;
  getFixtures(query: MatchQuery): Promise<SportsResult<Page<Match>>>;
  getLiveMatches(
    query: Omit<MatchQuery, 'state'>,
  ): Promise<SportsResult<Page<Match>>>;
  getMatch(id: string): Promise<SportsResult<Match>>;
  getTeams(): Promise<SportsResult<Team[]>>;
  getTeam(id: string): Promise<SportsResult<Team>>;
  getPlayers(): Promise<SportsResult<Player[]>>;
  getPlayer(id: string): Promise<SportsResult<Player>>;
  getVenue(id: string): Promise<SportsResult<Venue>>;
  getStandings(competitionId: string): Promise<SportsResult<Standing[]>>;
}
