import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database, Json } from '@/lib/supabase/database.types';
import { fantasyCompetitionIdSchema } from './validation';

type Client = SupabaseClient<Database>;
const positionLimitsSchema = z.record(
  z.string(),
  z.object({ min: z.number(), max: z.number() }),
);

export type FantasyCompetitionSummary = {
  id: string;
  name: string;
  sportName: string;
};
export type FantasyPlayer = {
  id: string;
  name: string;
  position: string;
  teamName: string;
  price: number;
};
export type FantasySquadDraft = {
  playerIds: string[];
  captainPlayerId: string;
  viceCaptainPlayerId: string;
};
export type FantasyCompetitionDetail = {
  id: string;
  name: string;
  sportName: string;
  ruleVersion: number;
  squadSize: number;
  budget: number;
  teamCap: number;
  captainMultiplier: number;
  viceCaptainMultiplier: number;
  transfersPerGameweek: number;
  positionLimits: Record<string, { min: number; max: number }>;
  gameweek: {
    id: string;
    number: number;
    name: string;
    deadlineAt: string;
  } | null;
  players: FantasyPlayer[];
  draft: FantasySquadDraft;
};

function fail(_error: unknown, fallback: string): never {
  throw new Error(fallback);
}

export async function listFantasyCompetitions(client: Client) {
  const { data: competitions, error } = await client
    .from('fantasy_competitions')
    .select('id,name,sport_id')
    .eq('status', 'open')
    .order('name')
    .limit(50);
  if (error) fail(error, 'Fantasy competitions are unavailable.');
  if (!competitions.length) return [] satisfies FantasyCompetitionSummary[];
  const sportIds = [
    ...new Set(competitions.map((competition) => competition.sport_id)),
  ];
  const { data: sports, error: sportError } = await client
    .from('sports')
    .select('id,name')
    .in('id', sportIds)
    .limit(50);
  if (sportError) fail(sportError, 'Fantasy sports are unavailable.');
  const sportNames = new Map(sports.map((sport) => [sport.id, sport.name]));
  return competitions.map((competition) => ({
    id: competition.id,
    name: competition.name,
    sportName: sportNames.get(competition.sport_id) ?? 'Sport',
  }));
}

export async function getFantasyCompetition(
  client: Client,
  competitionId: string,
  userId: string | null,
): Promise<FantasyCompetitionDetail | null> {
  const parsedId = fantasyCompetitionIdSchema.safeParse(competitionId);
  if (!parsedId.success) return null;
  const { data: competition, error } = await client
    .from('fantasy_competitions')
    .select('id,name,sport_id,current_rule_version')
    .eq('id', parsedId.data)
    .eq('status', 'open')
    .maybeSingle();
  if (error) fail(error, 'Fantasy competition is unavailable.');
  if (!competition) return null;

  const { data: sport, error: sportError } = await client
    .from('sports')
    .select('name')
    .eq('id', competition.sport_id)
    .maybeSingle();
  if (sportError) fail(sportError, 'Fantasy competition is unavailable.');
  const { data: gameweek, error: gameweekError } = await client
    .from('fantasy_gameweeks')
    .select('id,number,name,deadline_at,rule_version')
    .eq('competition_id', competition.id)
    .eq('status', 'open')
    .gt('deadline_at', new Date().toISOString())
    .order('number')
    .limit(1)
    .maybeSingle();
  if (gameweekError) fail(gameweekError, 'Fantasy gameweek is unavailable.');
  const ruleVersion =
    gameweek?.rule_version ?? competition.current_rule_version;
  const { data: rules, error: rulesError } = await client
    .from('fantasy_rules')
    .select('*')
    .eq('competition_id', competition.id)
    .eq('version', ruleVersion)
    .maybeSingle();
  if (rulesError) fail(rulesError, 'Fantasy rules are unavailable.');
  if (!rules) return null;
  const parsedLimits = positionLimitsSchema.safeParse(
    rules.position_limits as Json,
  );
  if (!parsedLimits.success)
    fail(parsedLimits.error, 'Fantasy rules are invalid.');

  const { data: prices, error: pricesError } = await client
    .from('fantasy_player_prices')
    .select('player_id,price')
    .eq('competition_id', competition.id)
    .eq('rule_version', ruleVersion)
    .limit(100);
  if (pricesError) fail(pricesError, 'Fantasy player prices are unavailable.');
  const playerIds = prices.map((price) => price.player_id);
  const { data: playerRows, error: playersError } = playerIds.length
    ? await client
        .from('players')
        .select('id,name,position,team_id')
        .in('id', playerIds)
        .limit(100)
    : { data: [], error: null };
  if (playersError) fail(playersError, 'Fantasy players are unavailable.');
  const teamIds = [
    ...new Set(
      playerRows.flatMap((player) => (player.team_id ? [player.team_id] : [])),
    ),
  ];
  const { data: teams, error: teamsError } = teamIds.length
    ? await client.from('teams').select('id,name').in('id', teamIds).limit(100)
    : { data: [], error: null };
  if (teamsError) fail(teamsError, 'Fantasy teams are unavailable.');
  const playerPrices = new Map(
    prices.map((price) => [price.player_id, price.price]),
  );
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const players = playerRows
    .map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      teamName: player.team_id
        ? (teamNames.get(player.team_id) ?? 'Team')
        : 'Individual',
      price: playerPrices.get(player.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        a.position.localeCompare(b.position) || a.name.localeCompare(b.name),
    );

  let draft: FantasySquadDraft = {
    playerIds: [],
    captainPlayerId: '',
    viceCaptainPlayerId: '',
  };
  if (userId && gameweek) {
    const { data: ownTeam, error: ownTeamError } = await client
      .from('fantasy_teams')
      .select('id')
      .eq('competition_id', competition.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (ownTeamError) fail(ownTeamError, 'Your fantasy squad is unavailable.');
    if (ownTeam) {
      const { data: savedWeek, error: savedWeekError } = await client
        .from('fantasy_team_gameweeks')
        .select('captain_player_id,vice_captain_player_id')
        .eq('team_id', ownTeam.id)
        .eq('gameweek_id', gameweek.id)
        .maybeSingle();
      if (savedWeekError)
        fail(savedWeekError, 'Your fantasy squad is unavailable.');
      if (savedWeek) {
        const { data: selections, error: selectionsError } = await client
          .from('fantasy_team_selections')
          .select('player_id')
          .eq('team_id', ownTeam.id)
          .eq('gameweek_id', gameweek.id)
          .limit(40);
        if (selectionsError)
          fail(selectionsError, 'Your fantasy squad is unavailable.');
        draft = {
          playerIds: selections.map((selection) => selection.player_id),
          captainPlayerId: savedWeek.captain_player_id,
          viceCaptainPlayerId: savedWeek.vice_captain_player_id,
        };
      }
    }
  }

  return {
    id: competition.id,
    name: competition.name,
    sportName: sport?.name ?? 'Sport',
    ruleVersion: rules.version,
    squadSize: rules.squad_size,
    budget: rules.budget,
    teamCap: rules.team_cap,
    captainMultiplier: rules.captain_multiplier,
    viceCaptainMultiplier: rules.vice_captain_multiplier,
    transfersPerGameweek: rules.transfers_per_gameweek,
    positionLimits: parsedLimits.data,
    gameweek: gameweek
      ? {
          id: gameweek.id,
          number: gameweek.number,
          name: gameweek.name,
          deadlineAt: gameweek.deadline_at,
        }
      : null,
    players,
    draft,
  };
}
