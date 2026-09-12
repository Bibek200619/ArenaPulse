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
const users: string[] = [];
async function actor(isPrivate = false) {
  const client = createClient(url!, key!, options);
  const email = `social-${randomUUID()}@example.test`,
    password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error('Local social test setup failed.');
  const id = data.user.id;
  users.push(id);
  expect(
    (await client.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  expect(
    (
      await client.rpc('save_profile', {
        p_username: `social_${randomUUID().slice(0, 8)}`,
        p_display_name: 'Social tester',
        p_bio: '',
        p_country: '',
        p_favorite_sports: ['football'],
        p_is_private: isPrivate,
      })
    ).error,
  ).toBeNull();
  return { client, id };
}
type Actor = Awaited<ReturnType<typeof actor>>;
let alice: Actor, bob: Actor, carol: Actor;
let postId: string, privatePostId: string;
async function post(user: Actor, body = 'Who is watching the match?') {
  const result = await user.client
    .from('posts')
    .insert({ author_id: user.id, body })
    .select('id')
    .single();
  expect(result.error).toBeNull();
  return result.data!.id as string;
}
beforeAll(async () => {
  alice = await actor();
  bob = await actor();
  carol = await actor(true);
  postId = await post(alice);
  privatePostId = await post(carol);
});
afterAll(async () => {
  for (const id of users)
    expect((await admin.auth.admin.deleteUser(id)).error).toBeNull();
});
it('shows public posts while private activity is owner-only', async () => {
  for (const client of [anon, bob.client]) {
    const result = await client
      .from('posts')
      .select('id')
      .in('id', [postId, privatePostId]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ id: postId }]);
  }
  expect(
    (await carol.client.from('posts').select('id').eq('id', privatePostId))
      .data,
  ).toHaveLength(1);
});
it('rejects forged authors, anonymous writes and ownership changes', async () => {
  expect(
    (await anon.from('posts').insert({ author_id: alice.id, body: 'forged' }))
      .error?.code,
  ).toBe('42501');
  expect(
    (
      await bob.client
        .from('posts')
        .insert({ author_id: alice.id, body: 'forged' })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await bob.client
        .from('posts')
        .update({ body: 'stolen' })
        .eq('id', postId)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (await bob.client.from('posts').delete().eq('id', postId).select()).data,
  ).toEqual([]);
  expect(
    (
      await alice.client
        .from('posts')
        .update({ author_id: bob.id })
        .eq('id', postId)
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await alice.client
        .from('posts')
        .update({ body: 'Match night!' })
        .eq('id', postId)
        .select('body')
        .single()
    ).data?.body,
  ).toBe('Match night!');
});
it('validates content and reserves generated identities and timestamps', async () => {
  for (const body of ['  ', 'a'.repeat(2001)]) {
    expect(
      (await alice.client.from('posts').insert({ author_id: alice.id, body }))
        .error?.code,
    ).toBe('23514');
  }
  for (const reserved of [
    { id: randomUUID() },
    { created_at: '2000-01-01' },
    { updated_at: '2000-01-01' },
  ]) {
    expect(
      (
        await alice.client
          .from('posts')
          .insert({ author_id: alice.id, body: 'test', ...reserved })
      ).error?.code,
    ).toBe('42501');
  }
  expect(
    (
      await bob.client
        .from('comments')
        .insert({ author_id: bob.id, post_id: postId, body: 'a'.repeat(1001) })
    ).error?.code,
  ).toBe('23514');
});
it('supports actual PostgREST author joins and visible interaction counts', async () => {
  expect(
    (
      await bob.client
        .from('comments')
        .insert({ author_id: bob.id, post_id: postId, body: 'Great game!' })
    ).error,
  ).toBeNull();
  expect(
    (
      await carol.client.from('comments').insert({
        author_id: carol.id,
        post_id: postId,
        body: 'Private comment',
      })
    ).error,
  ).toBeNull();
  for (const user of [bob, carol])
    expect(
      (
        await user.client
          .from('reactions')
          .insert({ user_id: user.id, post_id: postId })
      ).error,
    ).toBeNull();
  const result = await anon
    .from('posts')
    .select(
      'id, author:profiles!posts_author_id_fkey(username), comments(count), reactions(count)',
    )
    .eq('id', postId)
    .single();
  expect(result.error).toBeNull();
  expect(result.data?.author).toHaveProperty('username');
  expect(result.data?.comments).toEqual([{ count: 1 }]);
  expect(result.data?.reactions).toEqual([{ count: 1 }]);
});
it('requires visible posts for comments and reactions', async () => {
  expect(
    (
      await bob.client.from('comments').insert({
        author_id: bob.id,
        post_id: privatePostId,
        body: 'intrusion',
      })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await bob.client
        .from('reactions')
        .insert({ user_id: bob.id, post_id: privatePostId })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await bob.client
        .from('comments')
        .insert({ author_id: alice.id, post_id: postId, body: 'forged' })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await alice.client
        .from('reactions')
        .insert({ user_id: bob.id, post_id: postId })
    ).error?.code,
  ).toBe('42501');
});
it('requires a visible reply target in the same post', async () => {
  const parent = await bob.client
    .from('comments')
    .insert({ author_id: bob.id, post_id: postId, body: 'Reply here' })
    .select('id')
    .single();
  expect(parent.error).toBeNull();
  expect(
    (
      await alice.client.from('comments').insert({
        author_id: alice.id,
        post_id: postId,
        parent_id: parent.data!.id,
        body: 'Reply',
      })
    ).error,
  ).toBeNull();
  const anotherPost = await post(bob);
  expect(
    (
      await bob.client.from('comments').insert({
        author_id: bob.id,
        post_id: anotherPost,
        parent_id: parent.data!.id,
        body: 'Wrong thread',
      })
    ).error?.code,
  ).toBe('42501');
  const hidden = await carol.client
    .from('comments')
    .select('id')
    .eq('author_id', carol.id)
    .single();
  expect(hidden.error).toBeNull();
  expect(
    (
      await bob.client.from('comments').insert({
        author_id: bob.id,
        post_id: postId,
        parent_id: hidden.data!.id,
        body: 'Hidden target',
      })
    ).error?.code,
  ).toBe('42501');
});
it('enforces interaction ownership and unique reactions', async () => {
  expect(
    (
      await bob.client
        .from('reactions')
        .insert({ user_id: bob.id, post_id: postId })
    ).error?.code,
  ).toBe('23505');
  expect(
    (
      await alice.client
        .from('reactions')
        .delete()
        .eq('user_id', bob.id)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (
      await alice.client
        .from('comments')
        .delete()
        .eq('author_id', bob.id)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (
      await bob.client
        .from('reactions')
        .update({ kind: 'other' })
        .eq('user_id', bob.id)
    ).error?.code,
  ).toBe('42501');
  expect(
    (await bob.client.from('reactions').delete().eq('post_id', postId).select())
      .data,
  ).toHaveLength(1);
});
it('enforces user-follow identity, target visibility and uniqueness', async () => {
  const follow = { follower_id: bob.id, followed_id: alice.id };
  expect(
    (await alice.client.from('user_follows').insert(follow)).error?.code,
  ).toBe('42501');
  expect(
    (
      await bob.client
        .from('user_follows')
        .insert({ follower_id: bob.id, followed_id: bob.id })
    ).error?.code,
  ).toBe('23514');
  expect(
    (
      await bob.client
        .from('user_follows')
        .insert({ follower_id: bob.id, followed_id: carol.id })
    ).error?.code,
  ).toBe('42501');
  expect(
    (await bob.client.from('user_follows').insert(follow)).error,
  ).toBeNull();
  expect(
    (await bob.client.from('user_follows').insert(follow)).error?.code,
  ).toBe('23505');
  expect(
    (
      await alice.client
        .from('user_follows')
        .delete()
        .eq('follower_id', bob.id)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (
      await carol.client
        .from('user_follows')
        .insert({ follower_id: carol.id, followed_id: alice.id })
    ).error,
  ).toBeNull();
  expect(
    (await anon.from('user_follows').select('*').eq('follower_id', carol.id))
      .data,
  ).toEqual([]);
});
it('hides previous activity on privacy change while owners can remove their interactions', async () => {
  const subject = await actor();
  const id = await post(subject);
  const comment = await bob.client
    .from('comments')
    .insert({ author_id: bob.id, post_id: id, body: 'My response' })
    .select('id')
    .single();
  expect(comment.error).toBeNull();
  expect(
    (
      await bob.client
        .from('reactions')
        .insert({ user_id: bob.id, post_id: id })
    ).error,
  ).toBeNull();
  expect(
    (
      await bob.client
        .from('user_follows')
        .insert({ follower_id: bob.id, followed_id: subject.id })
    ).error,
  ).toBeNull();
  expect(
    (
      await subject.client
        .from('profiles')
        .update({ is_private: true })
        .eq('id', subject.id)
    ).error,
  ).toBeNull();
  for (const client of [anon, bob.client])
    expect((await client.from('posts').select('*').eq('id', id)).data).toEqual(
      [],
    );
  expect(
    (await anon.from('comments').select('*').eq('post_id', id)).data,
  ).toEqual([]);
  expect(
    (await anon.from('reactions').select('*').eq('post_id', id)).data,
  ).toEqual([]);
  expect(
    (
      await bob.client
        .from('comments')
        .delete()
        .eq('id', comment.data!.id)
        .select()
    ).data,
  ).toHaveLength(1);
  expect(
    (await bob.client.from('reactions').delete().eq('post_id', id).select())
      .data,
  ).toHaveLength(1);
  expect(
    (
      await bob.client
        .from('user_follows')
        .delete()
        .eq('followed_id', subject.id)
        .select()
    ).data,
  ).toHaveLength(1);
});
it('deletes dependent discussions and reactions when their author deletes a post', async () => {
  const id = await post(alice);
  expect(
    (
      await bob.client
        .from('comments')
        .insert({ author_id: bob.id, post_id: id, body: 'A comment' })
    ).error,
  ).toBeNull();
  expect(
    (
      await bob.client
        .from('reactions')
        .insert({ user_id: bob.id, post_id: id })
    ).error,
  ).toBeNull();
  expect(
    (await alice.client.from('posts').delete().eq('id', id).select()).data,
  ).toHaveLength(1);
  for (const table of ['comments', 'reactions'])
    expect(
      (await admin.from(table).select('*').eq('post_id', id)).data,
    ).toEqual([]);
});
it('enforces concurrent write budgets that survive deleting content', async () => {
  const writer = await actor();
  const writes = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      writer.client
        .from('posts')
        .insert({ author_id: writer.id, body: `Post ${i}` }),
    ),
  );
  expect(writes.filter((result) => !result.error)).toHaveLength(10);
  expect(
    writes.filter((result) => result.error?.code === 'P0001'),
  ).toHaveLength(2);
  expect(
    (
      await writer.client
        .from('posts')
        .delete()
        .eq('author_id', writer.id)
        .select()
    ).data,
  ).toHaveLength(10);
  expect(
    (
      await writer.client
        .from('posts')
        .insert({ author_id: writer.id, body: 'Bypass attempt' })
    ).error?.code,
  ).toBe('P0001');
  // The internal budget is neither exposed nor mutable through the public API.
  expect(
    (
      await writer.client
        .schema('private')
        .from('social_write_limits')
        .select('*')
    ).error,
  ).not.toBeNull();
});
it.each([
  ['team', 'team_follows', 'team_id', catalog.teams[0].id],
  ['player', 'player_follows', 'player_id', catalog.players[0].id],
  [
    'competition',
    'competition_follows',
    'competition_id',
    catalog.competitions[0].id,
  ],
])(
  'returns aggregate %s followers without exposing private picks',
  async (kind, table, column, id) => {
    const before = await alice.client.rpc('sports_follower_count', {
      p_kind: kind,
      p_id: id,
    });
    expect(before.error).toBeNull();
    for (const user of [alice, carol])
      expect(
        (
          await user.client
            .from(table)
            .insert({ user_id: user.id, [column]: id })
        ).error,
      ).toBeNull();
    const count = await bob.client.rpc('sports_follower_count', {
      p_kind: kind,
      p_id: id,
    });
    expect(count.error).toBeNull();
    expect(count.data).toBe(before.data + 2);
    expect(
      (
        await bob.client
          .from(table)
          .select('*')
          .in('user_id', [alice.id, carol.id])
      ).data,
    ).toEqual([]);
    expect(
      (await anon.rpc('sports_follower_count', { p_kind: kind, p_id: id }))
        .error?.code,
    ).toBe('42501');
  },
);
it('rejects unknown aggregate kinds', async () => {
  expect(
    (
      await alice.client.rpc('sports_follower_count', {
        p_kind: 'profiles',
        p_id: alice.id,
      })
    ).error?.code,
  ).toBe('22023');
});
