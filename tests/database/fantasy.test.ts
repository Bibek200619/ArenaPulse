import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
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
const anon = createClient(url, key, options);
const users: string[] = [];
const competitions: string[] = [];
const demo = fantasyDemoCompetitions[0];
const footballPlayers = catalog.players.filter(
  (player) => player.sportId === demo.sportId,
);
const initialRoster = [
  footballPlayers.find((player) => player.position === 'Goalkeeper')!,
  footballPlayers.find(
    (player) =>
      player.position === 'Defender' &&
      player.teamId === footballPlayers[0].teamId,
  )!,
  footballPlayers.find(
    (player) =>
      player.position === 'Midfielder' &&
      player.teamId !== footballPlayers[0].teamId,
  )!,
  footballPlayers.find(
    (player) =>
      player.position === 'Forward' &&
      player.teamId !== footballPlayers[0].teamId,
  )!,
];
const transferRoster = [
  initialRoster[0],
  footballPlayers.find(
    (player) =>
      player.position === 'Defender' &&
      player.teamId !== footballPlayers[0].teamId,
  )!,
  footballPlayers.find(
    (player) =>
      player.position === 'Midfielder' &&
      player.teamId === footballPlayers[0].teamId,
  )!,
  initialRoster[3],
];
const usersPasswordOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
};
async function actor() {
  const client = createClient(url!, key!, usersPasswordOptions);
  const email = `fantasy-${randomUUID()}@example.test`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error('Fantasy test setup failed.');
  const id = data.user.id;
  users.push(id);
  expect(
    (await client.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  expect(
    (
      await client.rpc('save_profile', {
        p_username: `fantasy_${randomUUID().slice(0, 8)}`,
        p_display_name: 'Fantasy tester',
        p_bio: '',
        p_country: '',
        p_favorite_sports: ['football'],
        p_is_private: false,
      })
    ).error,
  ).toBeNull();
  return { client, id };
}
type Actor = Awaited<ReturnType<typeof actor>>;
let alice: Actor;
let bob: Actor;

async function setupCompetition(
  overrides: {
    budget?: number;
    teamCap?: number;
    positionLimits?: Record<string, { min: number; max: number }>;
    transfersPerGameweek?: number;
  } = {},
) {
  const id = randomUUID();
  competitions.push(id);
  const { error: competitionError } = await admin
    .from('fantasy_competitions')
    .insert({
      id,
      source_competition_id: demo.sourceCompetitionId,
      sport_id: demo.sportId,
      name: 'Fantasy database test',
      status: 'open',
      current_rule_version: 1,
    });
  expect(competitionError).toBeNull();
  const { error: ruleError } = await admin.from('fantasy_rules').insert({
    competition_id: id,
    version: 1,
    squad_size: demo.squadSize,
    budget: overrides.budget ?? demo.budget,
    position_limits: overrides.positionLimits ?? demo.positionLimits,
    team_cap: overrides.teamCap ?? demo.teamCap,
    captain_multiplier: demo.captainMultiplier,
    vice_captain_multiplier: demo.viceCaptainMultiplier,
    transfers_per_gameweek:
      overrides.transfersPerGameweek ?? demo.transfersPerGameweek,
  });
  expect(ruleError).toBeNull();
  const { error: priceError } = await admin
    .from('fantasy_player_prices')
    .insert(
      footballPlayers.map((player) => ({
        competition_id: id,
        rule_version: 1,
        sport_id: demo.sportId,
        player_id: player.id,
        price: demo.prices[player.position],
      })),
    );
  expect(priceError).toBeNull();
  const firstWeek = randomUUID();
  const secondWeek = randomUUID();
  const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const starts = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const ends = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: gameweekError } = await admin
    .from('fantasy_gameweeks')
    .insert([
      {
        id: firstWeek,
        competition_id: id,
        number: 1,
        name: 'Test gameweek 1',
        rule_version: 1,
        deadline_at: deadline,
        starts_at: starts,
        ends_at: ends,
        status: 'open',
      },
      {
        id: secondWeek,
        competition_id: id,
        number: 2,
        name: 'Test gameweek 2',
        rule_version: 1,
        deadline_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        starts_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
      },
    ]);
  expect(gameweekError).toBeNull();
  return { id, firstWeek, secondWeek };
}

function save(
  user: Actor,
  competitionId: string,
  gameweekId: string,
  playerIds = initialRoster.map((player) => player.id),
  captainPlayerId = playerIds[0],
  viceCaptainPlayerId = playerIds[1],
  ruleVersion = 1,
) {
  return user.client.rpc('save_fantasy_squad', {
    p_competition_id: competitionId,
    p_gameweek_id: gameweekId,
    p_rule_version: ruleVersion,
    p_player_ids: playerIds,
    p_captain_player_id: captainPlayerId,
    p_vice_captain_player_id: viceCaptainPlayerId,
  });
}

beforeAll(async () => {
  [alice, bob] = await Promise.all([actor(), actor()]);
});
afterAll(async () => {
  for (const id of competitions) {
    expect(
      (await admin.from('fantasy_teams').delete().eq('competition_id', id))
        .error,
    ).toBeNull();
    expect(
      (await admin.from('fantasy_gameweeks').delete().eq('competition_id', id))
        .error,
    ).toBeNull();
    expect(
      (await admin.from('fantasy_competitions').delete().eq('id', id)).error,
    ).toBeNull();
  }
  for (const id of users)
    expect((await admin.auth.admin.deleteUser(id)).error).toBeNull();
});

it('saves a valid squad atomically and keeps team reads private to its owner', async () => {
  const { id, firstWeek } = await setupCompetition();
  const result = await save(alice, id, firstWeek);
  expect(result.error).toBeNull();
  const ownTeam = await alice.client
    .from('fantasy_teams')
    .select('id,name')
    .eq('competition_id', id)
    .single();
  expect(ownTeam.error).toBeNull();
  const ownRoster = await alice.client
    .from('fantasy_team_selections')
    .select('player_id,price_at_pick')
    .eq('team_id', ownTeam.data!.id)
    .eq('gameweek_id', firstWeek);
  expect(ownRoster.data).toHaveLength(4);
  expect(
    ownRoster.data?.reduce((sum, pick) => sum + pick.price_at_pick, 0),
  ).toBe(30);
  expect(
    (
      await bob.client
        .from('fantasy_teams')
        .select('id')
        .eq('competition_id', id)
    ).data,
  ).toEqual([]);
  expect(
    (
      await bob.client
        .from('fantasy_team_selections')
        .select('player_id')
        .eq('team_id', ownTeam.data!.id)
    ).data,
  ).toEqual([]);
  expect(
    (await anon.from('fantasy_competitions').select('id').eq('id', id)).data,
  ).toEqual([{ id }]);
  expect((await anon.from('fantasy_teams').select('id')).error).not.toBeNull();
  expect(
    (
      await alice.client.from('fantasy_teams').insert({
        competition_id: id,
        user_id: alice.id,
      })
    ).error,
  ).not.toBeNull();
});

it('rejects over-budget, invalid-position, team-cap and stale-rule submissions without partial teams', async () => {
  const budget = await setupCompetition({ budget: 29 });
  expect((await save(alice, budget.id, budget.firstWeek)).error?.code).toBe(
    '23514',
  );
  expect(
    (
      await alice.client
        .from('fantasy_teams')
        .select('id')
        .eq('competition_id', budget.id)
    ).data,
  ).toEqual([]);

  const positions = await setupCompetition({
    positionLimits: {
      Goalkeeper: { min: 2, max: 2 },
      Defender: { min: 0, max: 0 },
      Midfielder: { min: 1, max: 1 },
      Forward: { min: 1, max: 1 },
    },
  });
  expect(
    (await save(alice, positions.id, positions.firstWeek)).error?.code,
  ).toBe('23514');

  const teamCap = await setupCompetition({ teamCap: 1 });
  expect((await save(alice, teamCap.id, teamCap.firstWeek)).error?.code).toBe(
    '23514',
  );

  const stale = await setupCompetition();
  expect(
    (
      await save(
        alice,
        stale.id,
        stale.firstWeek,
        undefined,
        undefined,
        undefined,
        2,
      )
    ).error?.code,
  ).toBe('23514');
});

it('rejects captains outside the selected roster and rejects submissions after deadline', async () => {
  const setup = await setupCompetition();
  const outsideCaptain = footballPlayers.find(
    (player) => !initialRoster.some((selected) => selected.id === player.id),
  )!;
  expect(
    (
      await save(
        alice,
        setup.id,
        setup.firstWeek,
        initialRoster.map((player) => player.id),
        outsideCaptain.id,
        initialRoster[1].id,
      )
    ).error?.code,
  ).toBe('23514');
  const { error } = await admin
    .from('fantasy_gameweeks')
    .update({ deadline_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('id', setup.firstWeek);
  expect(error).toBeNull();
  expect((await save(alice, setup.id, setup.firstWeek)).error?.code).toBe(
    '23514',
  );
  expect(
    (
      await alice.client
        .from('fantasy_teams')
        .select('id')
        .eq('competition_id', setup.id)
    ).data,
  ).toEqual([]);
});

it('counts transfers from the prior gameweek roster and enforces the configured allowance', async () => {
  const setup = await setupCompetition({ transfersPerGameweek: 2, teamCap: 3 });
  expect((await save(alice, setup.id, setup.firstWeek)).error).toBeNull();
  const { error: openError } = await admin
    .from('fantasy_gameweeks')
    .update({ status: 'open' })
    .eq('id', setup.secondWeek);
  expect(openError).toBeNull();
  const validUpdate = await save(
    alice,
    setup.id,
    setup.secondWeek,
    transferRoster.map((player) => player.id),
    transferRoster[0].id,
    transferRoster[1].id,
  );
  expect(validUpdate.error).toBeNull();
  const teamId = validUpdate.data!;
  expect(
    (
      await alice.client
        .from('fantasy_team_gameweeks')
        .select('transfers_used')
        .eq('team_id', teamId)
        .eq('gameweek_id', setup.secondWeek)
        .single()
    ).data?.transfers_used,
  ).toBe(2);
  const tooManyChanges = [
    ...transferRoster.slice(0, 3),
    footballPlayers.find(
      (player) =>
        player.position === 'Forward' && player.id !== transferRoster[3].id,
    )!,
  ];
  expect(
    (
      await save(
        alice,
        setup.id,
        setup.secondWeek,
        tooManyChanges.map((player) => player.id),
        tooManyChanges[0].id,
        tooManyChanges[1].id,
      )
    ).error?.code,
  ).toBe('23514');
});
