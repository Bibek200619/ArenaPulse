export type MatchState =
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'abandoned';
export const footballLeagueKeys = [
  'champions-league',
  'premier-league',
  'la-liga',
  'serie-a',
  'bundesliga',
  'ligue-1',
  'eredivisie',
  'brazilian-serie-a',
  'championship',
  'austrian-bundesliga',
] as const;
export const footballLeagues = [
  {
    value: 'champions-league',
    label: 'Champions League',
    competition: 'UEFA Champions League',
    slug: 'uefa-champions-league',
  },
  {
    value: 'premier-league',
    label: 'English Premier League',
    competition: 'English Premier League',
    slug: 'english-premier-league',
  },
  {
    value: 'la-liga',
    label: 'Spanish La Liga',
    competition: 'Spanish La Liga',
    slug: 'spanish-la-liga',
  },
  {
    value: 'serie-a',
    label: 'Italian Serie A',
    competition: 'Italian Serie A',
    slug: 'italian-serie-a',
  },
  {
    value: 'bundesliga',
    label: 'Bundesliga',
    competition: 'Bundesliga',
    slug: 'bundesliga',
  },
  {
    value: 'ligue-1',
    label: 'French Ligue 1',
    competition: 'French Ligue 1',
    slug: 'french-ligue-1',
  },
  {
    value: 'eredivisie',
    label: 'Netherlands Eredivisie',
    competition: 'Netherlands Eredivisie',
    slug: 'netherlands-eredivisie',
  },
  {
    value: 'brazilian-serie-a',
    label: 'Brazilian Serie A',
    competition: 'Brazilian Serie A',
    slug: 'brazilian-serie-a',
  },
  {
    value: 'championship',
    label: 'English Football League Championship',
    competition: 'English Football League Championship',
    slug: 'english-football-league-championship',
  },
  {
    value: 'austrian-bundesliga',
    label: 'Austrian Bundesliga',
    competition: 'Austrian Bundesliga',
    slug: 'austrian-bundesliga',
  },
] as const satisfies readonly {
  value: (typeof footballLeagueKeys)[number];
  label: string;
  competition: string;
  slug: string;
}[];
export type FootballLeague = (typeof footballLeagueKeys)[number];
export type Sport = { id: string; slug: string; name: string };
export type Competition = {
  id: string;
  sportId: string;
  name: string;
  country: string;
  seasonId: string;
};
export type Season = {
  id: string;
  competitionId: string;
  name: string;
  startsOn: string;
  endsOn: string;
};
export type Team = {
  id: string;
  sportId: string;
  name: string;
  shortName: string;
  country: string;
  color: string;
};
export type Player = {
  id: string;
  sportId: string;
  teamId: string | null;
  name: string;
  position: string;
  nationality: string;
};
export type Venue = { id: string; name: string; city: string; country: string };
export type MatchParticipant = {
  id: string;
  kind: 'team' | 'player';
  entityId: string;
  name: string;
  shortName: string;
  score: string | null;
  winner: boolean | null;
};
export type MatchEvent = {
  id: string;
  matchId: string;
  participantId: string;
  playerId: string | null;
  type: string;
  period: string;
  clock: string;
  description: string;
  sequence: number;
};
export type MatchStatistic = {
  participantId: string;
  code: string;
  label: string;
  value: number;
  unit: string | null;
};
export type LineupEntry = {
  participantId: string;
  playerId: string;
  position: string;
  starter: boolean;
};
export type Match = {
  id: string;
  sportId: string;
  competitionId: string;
  seasonId: string;
  competitionName?: string;
  venueId: string | null;
  startsAt: string;
  state: MatchState;
  clock: string | null;
  participants: MatchParticipant[];
  events: MatchEvent[];
  statistics: MatchStatistic[];
  lineups: LineupEntry[];
};
export type Standing = {
  competitionId: string;
  seasonId: string;
  teamId: string;
  rank: number;
  played: number;
  won: number;
  drawn: number | null;
  lost: number;
  points: number;
};
export type Page<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};
export type MatchQuery = {
  sportId?: string;
  competitionId?: string;
  footballLeague?: FootballLeague;
  state?: MatchState;
  date?: string;
  startsAfter?: string;
  teamId?: string;
  playerId?: string;
  offset: number;
  limit: number;
};
export type Provenance = {
  source: string;
  isDemo: boolean;
  observedAt: string;
  fetchedAt: string;
  label: string;
};
export type SportsResult<T> = { data: T; provenance: Provenance };
export type SportsCatalog = {
  sports: Sport[];
  competitions: Competition[];
  seasons: Season[];
  teams: Team[];
  players: Player[];
  venues: Venue[];
  matches: Match[];
  standings: Standing[];
};
