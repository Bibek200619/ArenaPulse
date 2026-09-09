import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
// Refuse hosted targets even if someone accidentally loads production env.
if (
  !url ||
  !/^http:\/\/(127\.0\.0\.1|localhost):55431$/.test(url) ||
  !publicKey ||
  !secretKey
)
  throw new Error(
    'Database tests require the isolated local ArenaPulse stack on port 55431.',
  );
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, secretKey, options);
const alice = createClient(url, publicKey, options);
const bob = createClient(url, publicKey, options);
const anonymous = createClient(url, publicKey, options);
const run = randomUUID().slice(0, 8);
const password = `ArenaPulse-test-${randomUUID()}`;
let aliceId = '',
  bobId = '';
const save = (client: typeof alice, username: string, isPrivate = false) =>
  client.rpc('save_profile', {
    p_username: username,
    p_display_name: 'Sports fan',
    p_bio: 'Safe text',
    p_country: '',
    p_favorite_sports: ['football'],
    p_is_private: isPrivate,
  });
beforeAll(async () => {
  for (const [name, client] of [
    ['alice', alice],
    ['bob', bob],
  ] as const) {
    const email = `${name}-${run}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error('Local test account setup failed');
    if (name === 'alice') aliceId = data.user.id;
    else bobId = data.user.id;
    expect(
      (await client.auth.signInWithPassword({ email, password })).error,
    ).toBeNull();
  }
});
afterAll(async () => {
  for (const id of [aliceId, bobId].filter(Boolean))
    await admin.auth.admin.deleteUser(id);
});
describe('real Supabase identity and RLS', () => {
  it('atomically saves the authenticated owner profile and private preferences', async () => {
    expect((await save(alice, `alice_${run}`)).error).toBeNull();
    expect((await save(bob, `bob_${run}`, true)).error).toBeNull();
    const { data } = await alice
      .from('profile_preferences')
      .select('*')
      .eq('user_id', aliceId)
      .single();
    expect(data?.favorite_sports).toEqual(['football']);
    expect(data?.onboarding_completed).toBe(true);
  });
  it('shows public profiles but hides private ones from outsiders', async () => {
    const { data, error } = await anonymous
      .from('profiles')
      .select('id')
      .in('id', [aliceId, bobId]);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: aliceId }]);
    expect(
      (await alice.from('profiles').select('id').eq('id', bobId)).data,
    ).toEqual([]);
    expect(
      (await bob.from('profiles').select('id').eq('id', bobId)).data,
    ).toEqual([{ id: bobId }]);
  });
  it('prevents editing another user and changing ownership', async () => {
    const { data, error } = await bob
      .from('profiles')
      .update({ display_name: 'Hijacked' })
      .eq('id', aliceId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(
      (await alice.from('profiles').update({ id: bobId }).eq('id', aliceId))
        .error,
    ).not.toBeNull();
    expect(
      (
        await alice
          .from('profiles')
          .select('display_name')
          .eq('id', aliceId)
          .single()
      ).data?.display_name,
    ).toBe('Sports fan');
  });
  it('keeps preferences owner-only even for public profiles', async () => {
    expect(
      (await bob.from('profile_preferences').select('*').eq('user_id', aliceId))
        .data,
    ).toEqual([]);
    expect(
      (await anonymous.from('profile_preferences').select('*')).error,
    ).not.toBeNull();
    expect(
      (
        await bob
          .from('profile_preferences')
          .upsert({ user_id: aliceId, favorite_sports: ['cricket'] })
      ).error,
    ).not.toBeNull();
  });
  it('enforces unique usernames case-insensitively through the RPC', async () => {
    const { error } = await save(bob, `ALICE_${run}`);
    expect(error?.code).toBe('23505');
    expect(
      (await bob.from('profiles').select('username').eq('id', bobId).single())
        .data?.username,
    ).toBe(`bob_${run}`);
  });
  it('rolls back profile changes when preferences violate constraints', async () => {
    const { error } = await alice.rpc('save_profile', {
      p_username: `alice_${run}`,
      p_display_name: 'Should rollback',
      p_bio: '',
      p_country: '',
      p_favorite_sports: ['invented'],
      p_is_private: false,
    });
    expect(error?.code).toBe('23514');
    expect(
      (
        await alice
          .from('profiles')
          .select('display_name')
          .eq('id', aliceId)
          .single()
      ).data?.display_name,
    ).toBe('Sports fan');
  });
  it('rejects anonymous profile writes and untrusted fields', async () => {
    expect((await save(anonymous, 'anonymous')).error).not.toBeNull();
    expect(
      (
        await alice
          .from('profiles')
          .update({ created_at: '2000-01-01' })
          .eq('id', aliceId)
      ).error,
    ).not.toBeNull();
  });
  it('persists and refreshes sessions, then rejects refresh after signout', async () => {
    const { data } = await bob.auth.getSession();
    expect((await bob.auth.refreshSession()).error).toBeNull();
    const token = (await bob.auth.getSession()).data.session?.refresh_token;
    expect((await bob.auth.signOut()).error).toBeNull();
    expect(data.session?.user.id).toBe(bobId);
    expect(
      (await bob.auth.refreshSession({ refresh_token: token! })).error,
    ).not.toBeNull();
  });
});
