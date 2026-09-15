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
const service = createClient(url, secret, options),
  anon = createClient(url, key, options);
const users: string[] = [];
async function actor() {
  const client = createClient(url!, key!, options),
    email = `community-${randomUUID()}@example.test`,
    password = randomUUID();
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error('Community test setup failed');
  const id = data.user.id;
  users.push(id);
  expect(
    (await client.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  expect(
    (
      await client.rpc('save_profile', {
        p_username: `group_${randomUUID().slice(0, 8)}`,
        p_display_name: 'Community tester',
        p_bio: '',
        p_country: '',
        p_favorite_sports: [],
        p_is_private: false,
      })
    ).error,
  ).toBeNull();
  return { client, id };
}
type Actor = Awaited<ReturnType<typeof actor>>;
let alice: Actor, bob: Actor, carol: Actor;
beforeAll(async () => {
  alice = await actor();
  bob = await actor();
  carol = await actor();
});
afterAll(async () => {
  for (const id of users)
    expect((await service.auth.admin.deleteUser(id)).error).toBeNull();
});
async function group(visibility = 'public') {
  const owner = await actor(),
    slug = `fans-${randomUUID()}`;
  const created = await owner.client.rpc('create_community', {
    p_name: 'Test sports fans',
    p_slug: slug,
    p_visibility: visibility,
    p_rules: 'Be kind.',
  });
  expect(created.error).toBeNull();
  return { owner, id: created.data as string, slug };
}
function command(
  user: Actor,
  id: string,
  action: string,
  target?: string,
  role?: string,
  reason?: string,
) {
  return user.client.rpc('community_transition', {
    p_id: id,
    p_action: action,
    ...(target ? { p_target: target } : {}),
    ...(role ? { p_role: role } : {}),
    ...(reason ? { p_reason: reason } : {}),
  });
}
async function join(user: Actor, id: string) {
  expect((await command(user, id, 'join')).data).toBe('joined');
}

it('creates community, owner membership and audit atomically with verified ownership', async () => {
  const { owner, id } = await group();
  const record = await owner.client
    .from('communities')
    .select('owner_id')
    .eq('id', id)
    .single();
  expect(record.error).toBeNull();
  expect(record.data?.owner_id).toBe(owner.id);
  expect(
    (
      await owner.client
        .from('community_members')
        .select('user_id,role')
        .eq('community_id', id)
    ).data,
  ).toEqual([{ user_id: owner.id, role: 'owner' }]);
  expect(
    (
      await owner.client
        .from('community_audit')
        .select('actor_id,action')
        .eq('community_id', id)
    ).data,
  ).toEqual([{ actor_id: owner.id, action: 'create' }]);
  expect(
    (
      await anon.rpc('create_community', {
        p_name: 'Forged group',
        p_slug: 'forged-group',
      })
    ).error?.code,
  ).toBe('42501');
  expect(
    (
      await alice.client.rpc('create_community', {
        p_name: 'Forged group',
        p_slug: 'forged-group',
        p_owner_id: owner.id,
      })
    ).error,
  ).not.toBeNull();
});
it('enforces names, unique slugs and sport-consistent associations', async () => {
  const { owner, slug } = await group();
  expect(
    (
      await owner.client.rpc('create_community', {
        p_name: 'Duplicate',
        p_slug: slug,
      })
    ).error?.code,
  ).toBe('23505');
  for (const values of [
    { p_name: ' ', p_slug: 'valid-slug' },
    { p_name: 'Valid name', p_slug: '../unsafe' },
    { p_name: 'Valid name', p_slug: 'valid-slug', p_rules: 'x'.repeat(3001) },
  ])
    expect(
      (await owner.client.rpc('create_community', values)).error?.code,
    ).toBe('23514');
  expect(
    (
      await owner.client.rpc('create_community', {
        p_name: 'Invalid sport',
        p_slug: 'bad-sport',
        p_sport_id: catalog.sports[1].id,
        p_team_id: catalog.teams[0].id,
      })
    ).error?.code,
  ).toBe('23503');
  expect(
    (
      await owner.client
        .from('communities')
        .select('id')
        .eq('owner_id', owner.id)
    ).data,
  ).toHaveLength(1);
});
it.each([
  'communities',
  'community_members',
  'community_join_requests',
  'community_bans',
  'community_audit',
])('denies direct client and service-role mutations of %s', async (table) => {
  for (const client of [anon, alice.client, service]) {
    expect((await client.from(table).insert({})).error?.code).toBe('42501');
    expect(
      (
        await client
          .from(table)
          .delete()
          .eq(table === 'communities' ? 'id' : 'community_id', randomUUID())
      ).error?.code,
    ).toBe('42501');
    expect(
      (
        await client
          .from(table)
          .update(
            table === 'communities'
              ? { name: 'forged' }
              : { community_id: randomUUID() },
          )
          .eq(table === 'communities' ? 'id' : 'community_id', randomUUID())
      ).error?.code,
    ).toBe('42501');
  }
});
it('allows public discovery and joining without exposing member lists to outsiders', async () => {
  const { owner, id } = await group();
  expect(
    (await anon.from('communities').select('name').eq('id', id)).data,
  ).toHaveLength(1);
  expect(
    (
      await bob.client
        .from('community_members')
        .select('*')
        .eq('community_id', id)
    ).data,
  ).toEqual([]);
  expect((await anon.from('community_members').select('*')).error?.code).toBe(
    '42501',
  );
  await join(alice, id);
  await join(alice, id);
  const membership = await alice.client
    .from('community_members')
    .select('role')
    .eq('community_id', id)
    .eq('user_id', alice.id)
    .single();
  expect(membership.data?.role).toBe('member');
  expect(
    (
      await owner.client
        .from('community_audit')
        .select('id')
        .eq('community_id', id)
        .eq('action', 'join')
    ).data,
  ).toHaveLength(1);
  expect((await command(alice, id, 'leave')).data).toBe('left');
  expect(
    (
      await alice.client
        .from('community_members')
        .select('*')
        .eq('community_id', id)
    ).data,
  ).toEqual([]);
});
it('keeps private communities unlisted and grants access only after staff approval', async () => {
  const { owner, id } = await group('private');
  for (const client of [anon, alice.client])
    expect(
      (await client.from('communities').select('*').eq('id', id)).data,
    ).toEqual([]);
  expect((await command(alice, id, 'join', undefined, 'owner')).data).toBe(
    'requested',
  );
  expect(
    (await alice.client.from('communities').select('*').eq('id', id)).data,
  ).toEqual([]);
  expect(
    (
      await alice.client
        .from('community_join_requests')
        .select('status')
        .eq('community_id', id)
    ).data,
  ).toEqual([{ status: 'pending' }]);
  expect(
    (
      await bob.client
        .from('community_join_requests')
        .select('*')
        .eq('community_id', id)
    ).data,
  ).toEqual([]);
  expect((await command(alice, id, 'approve', alice.id)).error?.code).toBe(
    '42501',
  );
  expect((await command(owner, id, 'approve', alice.id)).data).toBe('approved');
  expect(
    (await alice.client.from('communities').select('id').eq('id', id)).data,
  ).toHaveLength(1);
  expect(
    (
      await alice.client
        .from('community_members')
        .select('role')
        .eq('community_id', id)
        .eq('user_id', alice.id)
        .single()
    ).data?.role,
  ).toBe('member');
  expect((await command(alice, id, 'leave')).data).toBe('left');
  expect(
    (await alice.client.from('communities').select('*').eq('id', id)).data,
  ).toEqual([]);
});
it('supports rejection, repeat requests and cancellation without granting membership', async () => {
  const { owner, id } = await group('private');
  expect((await command(bob, id, 'join')).data).toBe('requested');
  expect((await command(owner, id, 'reject', bob.id)).data).toBe('rejected');
  expect((await command(bob, id, 'join')).data).toBe('requested');
  expect((await command(bob, id, 'cancel-request')).data).toBe('cancelled');
  expect(
    (
      await owner.client
        .from('community_join_requests')
        .select('*')
        .eq('community_id', id)
    ).data,
  ).toEqual([]);
  expect((await command(owner, id, 'approve', bob.id)).error?.code).toBe(
    '23514',
  );
});
it('enforces owner/admin/moderator/member hierarchy without self-promotion', async () => {
  const { owner, id } = await group();
  for (const member of [alice, bob, carol]) await join(member, id);
  expect(
    (await command(alice, id, 'role', alice.id, 'admin')).error?.code,
  ).toBe('42501');
  expect((await command(owner, id, 'role', alice.id, 'admin')).data).toBe(
    'role_updated',
  );
  expect((await command(alice, id, 'role', bob.id, 'moderator')).data).toBe(
    'role_updated',
  );
  expect(
    (await command(alice, id, 'role', carol.id, 'admin')).error?.code,
  ).toBe('42501');
  expect(
    (await command(bob, id, 'role', carol.id, 'moderator')).error?.code,
  ).toBe('42501');
  expect(
    (await command(bob, id, 'ban', alice.id, undefined, 'Not allowed')).error
      ?.code,
  ).toBe('42501');
  expect(
    (await command(alice, id, 'role', owner.id, 'member')).error?.code,
  ).toBe('42501');
  expect(
    (await command(owner, id, 'role', carol.id, 'owner')).error?.code,
  ).toBe('42501');
  expect(
    (
      await carol.client
        .from('community_audit')
        .select('*')
        .eq('community_id', id)
    ).data,
  ).toEqual([]);
  expect(
    (
      await bob.client
        .from('community_audit')
        .select('id')
        .eq('community_id', id)
    ).data!.length,
  ).toBeGreaterThan(0);
});
it('bans remove membership, reject rejoining and require matching authority to lift', async () => {
  const { owner, id } = await group('private');
  for (const member of [alice, bob]) {
    await command(member, id, 'join');
    expect((await command(owner, id, 'approve', member.id)).error).toBeNull();
  }
  expect(
    (await command(owner, id, 'role', alice.id, 'moderator')).error,
  ).toBeNull();
  expect(
    (
      await command(
        owner,
        id,
        'ban',
        bob.id,
        undefined,
        'Repeated rule violations',
      )
    ).data,
  ).toBe('banned');
  expect(
    (await bob.client.from('communities').select('*').eq('id', id)).data,
  ).toEqual([]);
  expect(
    (
      await bob.client
        .from('community_bans')
        .select('reason')
        .eq('community_id', id)
    ).data,
  ).toEqual([{ reason: 'Repeated rule violations' }]);
  expect((await command(bob, id, 'join')).error?.code).toBe('42501');
  expect((await command(alice, id, 'unban', bob.id)).error?.code).toBe('42501');
  expect((await command(owner, id, 'unban', bob.id)).data).toBe('unbanned');
  expect((await command(bob, id, 'join')).data).toBe('requested');
  expect(
    (
      await owner.client
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', bob.id)
    ).data,
  ).toEqual([]);
});
it('keeps exactly one owner and rejects owner departure without transfer', async () => {
  const { owner, id } = await group();
  await join(alice, id);
  await join(bob, id);
  expect((await command(owner, id, 'leave')).error?.code).toBe('23514');
  expect(
    (await command(owner, id, 'ban', owner.id, undefined, 'Not allowed')).error
      ?.code,
  ).toBe('42501');
  expect((await command(alice, id, 'transfer', bob.id)).error?.code).toBe(
    '42501',
  );
  const transfers = await Promise.all([
    command(owner, id, 'transfer', alice.id),
    command(owner, id, 'transfer', bob.id),
  ]);
  expect(transfers.filter((result) => !result.error)).toHaveLength(1);
  expect(
    transfers.filter((result) => result.error?.code === '42501'),
  ).toHaveLength(1);
  const record = await owner.client
    .from('communities')
    .select('owner_id')
    .eq('id', id)
    .single();
  const members = await owner.client
    .from('community_members')
    .select('user_id,role')
    .eq('community_id', id);
  expect(members.data?.filter((row) => row.role === 'owner')).toEqual([
    { user_id: record.data!.owner_id, role: 'owner' },
  ]);
  expect((await command(owner, id, 'leave')).data).toBe('left');
});
it('serializes competing approval and ban without leaving a banned member', async () => {
  const { owner, id } = await group('private');
  const candidate = await actor();
  expect((await command(candidate, id, 'join')).data).toBe('requested');
  const [approval, ban] = await Promise.all([
    command(owner, id, 'approve', candidate.id),
    command(owner, id, 'ban', candidate.id, undefined, 'Access withdrawn'),
  ]);
  expect([undefined, '23514']).toContain(approval.error?.code);
  expect(ban.error).toBeNull();
  expect(
    (
      await owner.client
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', candidate.id)
    ).data,
  ).toEqual([]);
  expect(
    (
      await owner.client
        .from('community_join_requests')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', candidate.id)
    ).data,
  ).toEqual([]);
  expect((await command(candidate, id, 'join')).error?.code).toBe('42501');
});
it('enforces atomic creation budgets and transition budgets across parallel requests', async () => {
  const owner = await actor();
  const creation = await Promise.all(
    Array.from({ length: 4 }, (_, i) =>
      owner.client.rpc('create_community', {
        p_name: `Rate group ${i}`,
        p_slug: `rate-${randomUUID()}`,
      }),
    ),
  );
  expect(creation.filter((result) => !result.error)).toHaveLength(3);
  expect(
    creation.filter((result) => result.error?.code === 'P0001'),
  ).toHaveLength(1);
  const id = creation.find((result) => !result.error)!.data as string,
    member = await actor();
  const joins = await Promise.all(
    Array.from({ length: 32 }, () => command(member, id, 'join')),
  );
  expect(joins.filter((result) => !result.error)).toHaveLength(30);
  expect(joins.filter((result) => result.error?.code === 'P0001')).toHaveLength(
    2,
  );
  expect(
    (
      await owner.client
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', member.id)
    ).data,
  ).toHaveLength(1);
});

it('denies anonymous and service-role transition entry points', async () => {
  for (const client of [anon, service]) {
    expect(
      (
        await client.rpc('community_transition', {
          p_id: randomUUID(),
          p_action: 'join',
        })
      ).error?.code,
    ).toBe('42501');
    expect(
      (
        await client.rpc('create_community', {
          p_name: 'Denied community',
          p_slug: `denied-${randomUUID()}`,
        })
      ).error?.code,
    ).toBe('42501');
  }
});
it('requires an actual profile before accepting community operations', async () => {
  const user = await actor();
  // Remove the profile through trusted test maintenance; the auth identity remains signed in.
  expect(
    (await service.from('profiles').delete().eq('id', user.id)).error,
  ).toBeNull();
  expect(
    (
      await user.client.rpc('create_community', {
        p_name: 'No profile',
        p_slug: `no-profile-${randomUUID()}`,
      })
    ).error?.code,
  ).toBe('42501');
  expect((await command(user, randomUUID(), 'join')).error?.code).toBe('42501');
});
