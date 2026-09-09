import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import catalog from '../../src/features/sports/demo-catalog';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (url !== 'http://127.0.0.1:55431' || !key || !secret)
  throw new Error('Only the isolated local ArenaPulse database is allowed.');
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, secret, options);
const anon = createClient(url, key, options);
const alice = createClient(url, key, options);
const bob = createClient(url, key, options);
const users: string[] = [];
beforeAll(async () => {
  for (const client of [alice, bob]) {
    const email = `sports-${randomUUID()}@example.test`,
      password = `sports-${randomUUID()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error('Local sports test setup failed.');
    users.push(data.user.id);
    expect(
      (await client.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();
    expect(
      (
        await client.rpc('save_profile', {
          p_username: `sport_${randomUUID().slice(0, 8)}`,
          p_display_name: 'Sports tester',
          p_bio: '',
          p_country: '',
          p_favorite_sports: ['football'],
          p_is_private: true,
        })
      ).error,
    ).toBeNull();
  }
});
afterAll(async () => {
  for (const id of users) await admin.auth.admin.deleteUser(id);
});
it('reads the actual seeded catalog with composite scores and individual participants', async () => {
  const sports = await anon.from('sports').select('id');
  expect(sports.error).toBeNull();
  expect(sports.data).toHaveLength(4);
  expect((await anon.from('matches').select('id')).data).toHaveLength(12);
  expect(
    (await anon.from('match_participants').select('score').eq('score', '172/6'))
      .data,
  ).toHaveLength(2);
  expect(
    (
      await anon
        .from('match_participants')
        .select('player_id')
        .not('player_id', 'is', null)
    ).data,
  ).toHaveLength(6);
  expect(
    (await anon.from('sports_data_sources').select('is_demo').single()).data
      ?.is_demo,
  ).toBe(true);
});
it.each([
  'sports',
  'competitions',
  'seasons',
  'teams',
  'players',
  'venues',
  'sports_data_sources',
  'matches',
  'match_participants',
  'match_events',
  'match_statistics',
  'match_lineups',
  'standings',
])('denies all client mutations of %s', async (table) => {
  const probeColumn = ['match_statistics', 'match_lineups'].includes(table)
    ? 'match_id'
    : table === 'standings'
      ? 'season_id'
      : 'id';
  for (const client of [anon, alice]) {
    expect((await client.from(table).insert({})).error?.code).toBe('42501');
    expect(
      (await client.from(table).delete().eq(probeColumn, randomUUID())).error
        ?.code,
    ).toBe('42501');
    const row = (await admin.from(table).select('*').limit(1).single()).data;
    expect(row).not.toBeNull();
    expect(
      (await client.from(table).update(row).eq(probeColumn, randomUUID())).error
        ?.code,
    ).toBe('42501');
  }
});
it.each([
  ['team_follows', 'team_id', catalog.teams[0].id],
  ['player_follows', 'player_id', catalog.players[0].id],
  ['competition_follows', 'competition_id', catalog.competitions[0].id],
])(
  'enforces ownership, privacy, uniqueness and deletion for %s',
  async (table, column, id) => {
    const row = { user_id: users[0], [column]: id };
    expect((await anon.from(table).insert(row)).error).not.toBeNull();
    expect((await bob.from(table).insert(row)).error?.code).toBe('42501');
    expect((await alice.from(table).insert(row)).error).toBeNull();
    expect((await alice.from(table).insert(row)).error?.code).toBe('23505');
    expect(
      (await bob.from(table).select('*').eq('user_id', users[0])).data,
    ).toEqual([]);
    expect((await anon.from(table).select('*')).error).not.toBeNull();
    expect(
      (await bob.from(table).delete().eq('user_id', users[0]).select()).data,
    ).toEqual([]);
    expect(
      (await alice.from(table).select('*').eq('user_id', users[0])).data,
    ).toHaveLength(1);
    expect(
      (
        await alice
          .from(table)
          .update({ user_id: users[1] })
          .eq('user_id', users[0])
      ).error,
    ).not.toBeNull();
    expect(
      (await alice.from(table).delete().eq(column, id).select()).data,
    ).toHaveLength(1);
    expect(
      (
        await alice
          .from(table)
          .insert({ user_id: users[0], [column]: randomUUID() })
      ).error?.code,
    ).toBe('23503');
    expect(
      (await alice.from(table).insert({ ...row, created_at: '2000-01-01' }))
        .error,
    ).not.toBeNull();
  },
);
it('rejects cross-sport player and participant relationships', async () => {
  const wrong = await admin.from('players').insert({
    id: randomUUID(),
    sport_id: catalog.sports[1].id,
    team_id: catalog.teams[0].id,
    name: 'Invalid test',
    position: 'test',
    nationality: 'test',
  });
  expect(wrong.error?.code).toBe('23503');
  const participant = await admin.from('match_participants').insert({
    id: randomUUID(),
    match_id: catalog.matches[0].id,
    sport_id: catalog.sports[1].id,
    team_id: catalog.teams[2].id,
    display_order: 99,
  });
  expect(participant.error?.code).toBe('23503');
});
