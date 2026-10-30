import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import catalog from '../../src/features/sports/demo-catalog';
import { fantasyDemoCompetitions } from '../../src/features/fantasy/demo-config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (url !== 'http://127.0.0.1:55431' || !key || !secret)
  throw new Error('Only the isolated local ArenaPulse database is allowed.');
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, secret, options);
const users: string[] = [];
const competitions: string[] = [];
const demo = fantasyDemoCompetitions[0];
type TestPlayer = (typeof catalog.players)[number];
const footballPlayers = catalog.players.filter(
  (player) => player.sportId === demo.sportId,
);
const matchFixture = catalog.matches.find(
  (match) =>
    match.competitionId === demo.sourceCompetitionId &&
    match.events.some((event) => event.playerId),
)!;
const goalFixture = matchFixture.events.find((event) => event.playerId)!;
type LeaderboardRow = {
  display_name: string;
  rank: number;
  total_points: number;
};

async function actor() {
  const client = createClient(url!, key!, options);
  const email = `fantasy-league-${randomUUID()}@example.test`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error('Fantasy league setup failed.');
  users.push(data.user.id);
  expect(
    (await client.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  expect(
    (
      await client.rpc('save_profile', {
        p_username: `league_${randomUUID().slice(0, 8)}`,
        p_display_name: 'League tester',
        p_bio: '',
        p_country: '',
        p_favorite_sports: ['football'],
        p_is_private: false,
      })
    ).error,
  ).toBeNull();
  return { client, id: data.user.id };
}

async function setupCompetition() {
  const id = randomUUID();
  competitions.push(id);
  expect(
    (
      await admin.from('fantasy_competitions').insert({
        id,
        source_competition_id: demo.sourceCompetitionId,
        sport_id: demo.sportId,
        name: 'Scoring and league test',
        status: 'open',
        current_rule_version: 1,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.from('fantasy_rules').insert({
        competition_id: id,
        version: 1,
        squad_size: demo.squadSize,
        budget: demo.budget,
        position_limits: demo.positionLimits,
        team_cap: demo.teamCap,
        captain_multiplier: demo.captainMultiplier,
        vice_captain_multiplier: demo.viceCaptainMultiplier,
        transfers_per_gameweek: demo.transfersPerGameweek,
        scoring_rules: { goal: 5, assist: 3, yellow_card: -1 },
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.from('fantasy_player_prices').insert(
        footballPlayers.map((player) => ({
          competition_id: id,
          rule_version: 1,
          sport_id: demo.sportId,
          player_id: player.id,
          price: demo.prices[player.position],
        })),
      )
    ).error,
  ).toBeNull();
  const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const deadline = new Date(Date.now() + 60 * 60 * 1000);
  const weekId = randomUUID();
  expect(
    (
      await admin.from('fantasy_gameweeks').insert({
        id: weekId,
        competition_id: id,
        number: 1,
        name: 'Scoring test gameweek',
        rule_version: 1,
        deadline_at: deadline.toISOString(),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: 'open',
      })
    ).error,
  ).toBeNull();
  return { id, weekId };
}

function squadWithPlayer(playerId: string): TestPlayer[] {
  const selected = footballPlayers.find((player) => player.id === playerId);
  if (!selected)
    throw new Error('Scoring fixture player is not in the catalog.');
  const positions = Object.keys(demo.positionLimits);
  const build = (
    index: number,
    selectedPlayers: TestPlayer[],
  ): TestPlayer[] | null => {
    if (index === positions.length) return selectedPlayers;
    const position = positions[index];
    const candidates =
      position === selected.position
        ? [selected]
        : footballPlayers.filter((player) => player.position === position);
    for (const candidate of candidates) {
      const next = [...selectedPlayers, candidate];
      const clubCounts = new Map<string, number>();
      for (const player of next)
        if (player.teamId)
          clubCounts.set(
            player.teamId,
            (clubCounts.get(player.teamId) ?? 0) + 1,
          );
      if ([...clubCounts.values()].some((count) => count > demo.teamCap))
        continue;
      const result = build(index + 1, next);
      if (result) return result;
    }
    return null;
  };
  const roster = build(0, []);
  if (roster) return roster;
  throw new Error('Could not build a valid test roster.');
}

async function saveSquad(
  user: Awaited<ReturnType<typeof actor>>,
  competitionId: string,
  weekId: string,
  roster: TestPlayer[],
  captain: string,
  vice: string,
) {
  return user.client.rpc('save_fantasy_squad', {
    p_competition_id: competitionId,
    p_gameweek_id: weekId,
    p_rule_version: 1,
    p_player_ids: roster.map((player) => player.id),
    p_captain_player_id: captain,
    p_vice_captain_player_id: vice,
  });
}

afterAll(async () => {
  for (const id of competitions) {
    await admin.from('fantasy_competitions').delete().eq('id', id);
  }
  for (const id of users) await admin.auth.admin.deleteUser(id);
});

it('rebuilds corrected scores idempotently, applies captain multipliers, and keeps league data private', async () => {
  const alice = await actor();
  const bob = await actor();
  const charlie = await actor();
  const outsider = await actor();
  const competition = await setupCompetition();
  const roster = squadWithPlayer(goalFixture.playerId!);
  const scorer = roster.find((player) => player.id === goalFixture.playerId)!;
  const vice = roster.find(
    (player) => player.id !== scorer.id && player.position === 'Defender',
  )!;
  const bobCaptain = roster.find(
    (player) => player.id !== scorer.id && player.id !== vice.id,
  )!;
  expect(
    (
      await saveSquad(
        alice,
        competition.id,
        competition.weekId,
        roster,
        scorer.id,
        vice.id,
      )
    ).error,
  ).toBeNull();
  expect(
    (
      await saveSquad(
        charlie,
        competition.id,
        competition.weekId,
        roster,
        bobCaptain.id,
        vice.id,
      )
    ).error,
  ).toBeNull();
  expect(
    (
      await saveSquad(
        bob,
        competition.id,
        competition.weekId,
        roster,
        bobCaptain.id,
        vice.id,
      )
    ).error,
  ).toBeNull();

  const inviteCode = randomBytes(24).toString('base64url');
  const { data: leagueId, error: createError } = await alice.client.rpc(
    'create_fantasy_league',
    {
      p_competition_id: competition.id,
      p_name: 'Harbour Test League',
      p_invite_code: inviteCode,
    },
  );
  expect(createError).toBeNull();
  expect(leagueId).toBeTruthy();
  expect(
    (
      await bob.client.rpc('join_fantasy_league', {
        p_invite_code: inviteCode,
      })
    ).data,
  ).toBe(leagueId);
  expect(
    (
      await charlie.client.rpc('join_fantasy_league', {
        p_invite_code: inviteCode,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await alice.client
        .from('fantasy_leagues')
        .select('id')
        .eq('id', leagueId!)
    ).data,
  ).toEqual([{ id: leagueId }]);
  expect(
    (
      await outsider.client
        .from('fantasy_leagues')
        .select('id')
        .eq('id', leagueId!)
    ).data,
  ).toEqual([]);
  expect(
    (
      await outsider.client.rpc('get_fantasy_league_leaderboard', {
        p_league_id: leagueId!,
      })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await alice.client
        .from('fantasy_leagues')
        .select('invite_code_hash')
        .eq('id', leagueId!)
    ).error,
  ).not.toBeNull();
  expect(
    (
      await outsider.client.rpc('join_fantasy_league', {
        p_invite_code: randomBytes(24).toString('base64url'),
      })
    ).error?.code,
  ).toBe('23514');

  const { data: matchRow, error: matchError } = await admin
    .from('matches')
    .select('id,state,starts_at')
    .eq('id', matchFixture.id)
    .single();
  expect(matchError).toBeNull();
  const eventInDb = await admin
    .from('match_events')
    .select('id,match_id,participant_id,player_id,type,sequence')
    .eq('id', goalFixture.id)
    .single();
  expect(eventInDb.error).toBeNull();
  const { data: lastEvent } = await admin
    .from('match_events')
    .select('sequence')
    .eq('match_id', matchFixture.id)
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();
  const correctionEventId = randomUUID();
  try {
    const now = Date.now();
    expect(
      (
        await admin
          .from('matches')
          .update({
            state: 'finished',
            starts_at: new Date(now - 60 * 60_000).toISOString(),
          })
          .eq('id', matchFixture.id)
      ).error,
    ).toBeNull();
    expect(
      (
        await admin
          .from('fantasy_gameweeks')
          .update({
            deadline_at: new Date(now - 3 * 60 * 60_000).toISOString(),
            starts_at: new Date(now - 2 * 60 * 60_000).toISOString(),
            ends_at: new Date(now + 2 * 60 * 60_000).toISOString(),
            status: 'locked',
          })
          .eq('id', competition.weekId)
      ).error,
    ).toBeNull();
    expect(
      (
        await admin.from('match_events').insert({
          id: correctionEventId,
          match_id: goalFixture.matchId,
          participant_id: goalFixture.participantId,
          player_id: vice.id,
          type: 'assist',
          period: 'second_half',
          clock: '80′',
          description: 'Scoring test assist.',
          sequence: (lastEvent?.sequence ?? 0) + 1,
        })
      ).error,
    ).toBeNull();

    const scored = await admin.rpc('recalculate_fantasy_gameweek_scores', {
      p_gameweek_id: competition.weekId,
    });
    expect(scored.error).toBeNull();
    expect(scored.data).toBe(3);
    const leaderboard = await alice.client.rpc(
      'get_fantasy_league_leaderboard',
      { p_league_id: leagueId! },
    );
    expect(leaderboard.error).toBeNull();
    expect(
      leaderboard.data?.map((row: LeaderboardRow) => [
        row.rank,
        row.total_points,
      ]),
    ).toEqual([
      [1, 14.5],
      [2, 9.5],
      [2, 9.5],
    ]);
    expect(
      (
        await alice.client
          .from('fantasy_team_gameweek_scores')
          .select('team_id,total_points')
          .eq('gameweek_id', competition.weekId)
      ).data,
    ).toHaveLength(3);
    expect(
      (
        await outsider.client
          .from('fantasy_team_gameweek_scores')
          .select('team_id,total_points')
          .eq('gameweek_id', competition.weekId)
      ).data,
    ).toEqual([]);

    expect(
      (
        await admin
          .from('match_events')
          .update({ type: 'yellow_card' })
          .eq('id', goalFixture.id)
      ).error,
    ).toBeNull();
    const replayed = await admin.rpc('recalculate_fantasy_gameweek_scores', {
      p_gameweek_id: competition.weekId,
    });
    expect(replayed.error).toBeNull();
    expect(replayed.data).toBe(3);
    const run = await admin
      .from('fantasy_gameweek_score_runs')
      .select('revision')
      .eq('gameweek_id', competition.weekId)
      .single();
    expect(run.data?.revision).toBe(2);
    const corrected = await alice.client.rpc('get_fantasy_league_leaderboard', {
      p_league_id: leagueId!,
    });
    expect(
      corrected.data?.map((row: LeaderboardRow) => [
        row.rank,
        row.total_points,
      ]),
    ).toEqual([
      [1, 3.5],
      [1, 3.5],
      [3, 2.5],
    ]);
  } finally {
    await admin.from('match_events').delete().eq('id', correctionEventId);
    await admin
      .from('match_events')
      .update({ type: eventInDb.data!.type })
      .eq('id', goalFixture.id);
    await admin
      .from('matches')
      .update({ state: matchRow!.state, starts_at: matchRow!.starts_at })
      .eq('id', matchFixture.id);
  }
});
