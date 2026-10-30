import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (url !== 'http://127.0.0.1:55431' || !key || !secret)
  throw new Error('Only the isolated local ArenaPulse database is allowed.');
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, secret, options);
const anon = createClient(url, key, options);
const users: string[] = [];
const matchA = randomUUID();
const matchB = randomUUID();

async function actor() {
  const client = createClient(url!, key!, options);
  const email = `discussion-${randomUUID()}@example.test`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error('Discussion test setup failed.');
  const id = data.user.id;
  users.push(id);
  expect(
    (await client.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  expect(
    (
      await client.rpc('save_profile', {
        p_username: `talk_${randomUUID().slice(0, 8)}`,
        p_display_name: 'Discussion tester',
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
let messageId: string;

beforeAll(async () => {
  [alice, bob] = await Promise.all([actor(), actor()]);
  const { data, error } = await alice.client.rpc(
    'create_match_discussion_message',
    {
      p_match_id: matchA,
      p_body: 'A scoped match discussion',
      p_parent_id: null,
    },
  );
  expect(error).toBeNull();
  messageId = data!;
});

afterAll(async () => {
  for (const id of users)
    expect((await admin.auth.admin.deleteUser(id)).error).toBeNull();
});

it('shares messages and replies only inside their match and rejects direct writes', async () => {
  const reply = await bob.client.rpc('create_match_discussion_message', {
    p_match_id: matchA,
    p_body: 'A reply from another fan',
    p_parent_id: messageId,
  });
  expect(reply.error).toBeNull();
  const otherMatchReply = await bob.client.rpc(
    'create_match_discussion_message',
    {
      p_match_id: matchB,
      p_body: 'Cross-match parent must fail',
      p_parent_id: messageId,
    },
  );
  expect(otherMatchReply.error?.code).toBe('42501');
  const shared = await bob.client
    .from('match_discussion_messages')
    .select('id,body')
    .eq('match_id', matchA);
  expect(shared.error).toBeNull();
  expect(shared.data?.map((row) => row.body)).toEqual([
    'A scoped match discussion',
    'A reply from another fan',
  ]);
  const isolated = await bob.client
    .from('match_discussion_messages')
    .select('id')
    .eq('match_id', matchB);
  expect(isolated.data).toEqual([]);
  expect(
    (
      await bob.client.from('match_discussion_messages').insert({
        match_id: matchA,
        author_id: bob.id,
        body: 'Forged direct write',
      })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await anon
        .from('match_discussion_messages')
        .select('id')
        .eq('match_id', matchA)
    ).error,
  ).not.toBeNull();
});

it('supports reactions and only allows message owners to remove their messages', async () => {
  expect(
    (
      await bob.client.rpc('set_match_discussion_reaction', {
        p_match_id: matchA,
        p_message_id: messageId,
        p_active: true,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await bob.client.rpc('delete_match_discussion_message', {
        p_match_id: matchA,
        p_message_id: messageId,
      })
    ).data,
  ).toBe(false);
  expect(
    (
      await alice.client.rpc('delete_match_discussion_message', {
        p_match_id: matchA,
        p_message_id: messageId,
      })
    ).data,
  ).toBe(true);
});

it('honors private author visibility and moderator claims', async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: `private-${randomUUID()}@example.test`,
    password: randomUUID(),
    email_confirm: true,
  });
  expect(error).toBeNull();
  const privateId = data.user!.id;
  users.push(privateId);
  const privateClient = createClient(url!, key!, options);
  const { data: created, error: signInError } =
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: data.user!.email!,
    });
  expect(signInError).toBeNull();
  expect(created).toBeTruthy();
  const password = randomUUID();
  expect(
    (await admin.auth.admin.updateUserById(privateId, { password })).error,
  ).toBeNull();
  expect(
    (
      await privateClient.auth.signInWithPassword({
        email: data.user!.email!,
        password,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await privateClient.rpc('save_profile', {
        p_username: `private_${randomUUID().slice(0, 8)}`,
        p_display_name: 'Private fan',
        p_bio: '',
        p_country: '',
        p_favorite_sports: [],
        p_is_private: true,
      })
    ).error,
  ).toBeNull();
  const privateMessage = await privateClient.rpc(
    'create_match_discussion_message',
    {
      p_match_id: matchA,
      p_body: 'Private author content',
      p_parent_id: null,
    },
  );
  expect(privateMessage.error).toBeNull();
  const hidden = await bob.client
    .from('match_discussion_messages')
    .select('id')
    .eq('id', privateMessage.data!);
  expect(hidden.data).toEqual([]);

  expect(
    (
      await admin.auth.admin.updateUserById(bob.id, {
        app_metadata: { role: 'moderator' },
      })
    ).error,
  ).toBeNull();
  await bob.client.auth.refreshSession();
  const moderated = await bob.client.rpc('moderate_match_discussion_message', {
    p_match_id: matchA,
    p_message_id: privateMessage.data!,
  });
  expect(moderated.data).toBe(true);
});
