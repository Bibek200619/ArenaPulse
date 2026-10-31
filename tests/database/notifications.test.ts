import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { fantasyDemoCompetitions } from '../../src/features/fantasy/demo-config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const expectedUrl = process.env.ARENAPULSE_TEST_URL ?? 'http://127.0.0.1:55431';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_TEST_SECRET_KEY;
if (
  url !== expectedUrl ||
  !expectedUrl.startsWith('http://127.0.0.1:') ||
  !key ||
  !secret
)
  throw new Error('Only the isolated local ArenaPulse database is allowed.');
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, secret, options);
const users: string[] = [];
const competitions: string[] = [];
async function actor() {
  const client = createClient(url!, key!, options);
  const email = `notifications-${randomUUID()}@example.test`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error('Notification test setup failed.');
  const id = data.user.id;
  users.push(id);
  expect(
    (await client.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  expect(
    (
      await client.rpc('save_profile', {
        p_username: `notify_${randomUUID().slice(0, 8)}`,
        p_display_name: 'Notification tester',
        p_bio: '',
        p_country: '',
        p_favorite_sports: ['football'],
        p_is_private: false,
      })
    ).error,
  ).toBeNull();
  return { client, id };
}
let alice: Awaited<ReturnType<typeof actor>>;
let bob: Awaited<ReturnType<typeof actor>>;
let carol: Awaited<ReturnType<typeof actor>>;
let postId: string;
beforeAll(async () => {
  alice = await actor();
  bob = await actor();
  carol = await actor();
  const post = await alice.client
    .from('posts')
    .insert({ author_id: alice.id, body: 'A notification test post.' })
    .select('id')
    .single();
  expect(post.error).toBeNull();
  postId = post.data!.id;
});
afterAll(async () => {
  for (const id of competitions)
    expect(
      (await admin.from('fantasy_competitions').delete().eq('id', id)).error,
    ).toBeNull();
  for (const id of users)
    expect((await admin.auth.admin.deleteUser(id)).error).toBeNull();
});

it('delivers comment events to the recipient inbox and protects it from other users', async () => {
  const comment = await bob.client
    .from('comments')
    .insert({
      author_id: bob.id,
      post_id: postId,
      body: 'A comment that creates an outbox event.',
    })
    .select('id')
    .single();
  expect(comment.error).toBeNull();

  const queued = await alice.client
    .from('notification_outbox')
    .select('id,event_type,status')
    .eq('recipient_id', alice.id);
  expect(queued.data).toEqual([
    expect.objectContaining({ event_type: 'social_comment', status: 'queued' }),
  ]);
  expect(
    (await bob.client.from('notification_outbox').select('id')).data,
  ).toEqual([]);
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );

  const inbox = await alice.client
    .from('notifications')
    .select('id,event_type,read_at')
    .eq('recipient_id', alice.id)
    .eq('event_type', 'social_comment');
  expect(inbox.error).toBeNull();
  expect(inbox.data).toEqual([
    expect.objectContaining({ event_type: 'social_comment', read_at: null }),
  ]);
  expect((await bob.client.from('notifications').select('id')).data).toEqual(
    [],
  );
  expect(
    (
      await bob.client.rpc('mark_notification_read', {
        p_id: inbox.data![0].id,
      })
    ).data,
  ).toBe(false);
  expect(
    (
      await alice.client.rpc('mark_notification_read', {
        p_id: inbox.data![0].id,
      })
    ).data,
  ).toBe(true);
  expect(
    (
      await alice.client
        .from('notifications')
        .select('read_at')
        .eq('id', inbox.data![0].id)
        .single()
    ).data?.read_at,
  ).not.toBeNull();
});

it('checks preferences, blocks, and current content visibility before delivery', async () => {
  expect(
    (
      await alice.client.rpc('save_notification_preferences', {
        p_in_app_enabled: true,
        p_social_enabled: false,
        p_community_enabled: true,
        p_match_enabled: true,
        p_fantasy_enabled: true,
        p_time_zone: 'Asia/Kolkata',
      })
    ).error,
  ).toBeNull();
  const preferenceComment = await bob.client
    .from('comments')
    .insert({
      author_id: bob.id,
      post_id: postId,
      body: 'Disabled by preference.',
    })
    .select('id')
    .single();
  expect(preferenceComment.error).toBeNull();
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const skippedPreference = await admin
    .from('notification_outbox')
    .select('status')
    .eq('related_id', preferenceComment.data!.id)
    .single();
  expect(skippedPreference.data?.status).toBe('skipped');

  expect(
    (
      await alice.client.rpc('save_notification_preferences', {
        p_in_app_enabled: true,
        p_social_enabled: true,
        p_community_enabled: true,
        p_match_enabled: true,
        p_fantasy_enabled: true,
        p_time_zone: 'UTC',
      })
    ).error,
  ).toBeNull();
  const stalePost = await alice.client
    .from('posts')
    .insert({
      author_id: alice.id,
      body: 'This post will be removed before notification delivery.',
    })
    .select('id')
    .single();
  expect(stalePost.error).toBeNull();
  const staleComment = await carol.client
    .from('comments')
    .insert({
      author_id: carol.id,
      post_id: stalePost.data!.id,
      body: 'Queued then removed.',
    })
    .select('id')
    .single();
  expect(staleComment.error).toBeNull();
  expect(
    (await alice.client.from('posts').delete().eq('id', stalePost.data!.id))
      .error,
  ).toBeNull();
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const skippedStale = await admin
    .from('notification_outbox')
    .select('status')
    .eq('related_id', staleComment.data!.id)
    .single();
  expect(skippedStale.data?.status).toBe('skipped');

  const blockedComment = await bob.client
    .from('comments')
    .insert({
      author_id: bob.id,
      post_id: postId,
      body: 'Blocked before delivery.',
    })
    .select('id')
    .single();
  expect(blockedComment.error).toBeNull();
  expect(
    (
      await alice.client.from('user_blocks').insert({
        blocker_id: alice.id,
        blocked_id: bob.id,
      })
    ).error,
  ).toBeNull();
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const skippedBlock = await admin
    .from('notification_outbox')
    .select('status')
    .eq('related_id', blockedComment.data!.id)
    .single();
  expect(skippedBlock.data?.status).toBe('skipped');
});

it('notifies community owners of joins and rechecks current membership', async () => {
  const community = await alice.client.rpc('create_community', {
    p_name: 'Notification Test Community',
    p_slug: `notification-${randomUUID().slice(0, 8)}`,
  });
  expect(community.error).toBeNull();
  const joined = await carol.client.rpc('community_transition', {
    p_id: community.data!,
    p_action: 'join',
  });
  expect(joined.data).toBe('joined');
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const delivered = await alice.client
    .from('notifications')
    .select('event_type,target_id')
    .eq('event_type', 'community_join')
    .eq('target_id', community.data!);
  expect(delivered.data).toHaveLength(1);

  await carol.client.rpc('community_transition', {
    p_id: community.data!,
    p_action: 'leave',
  });
  const laterJoin = await carol.client.rpc('community_transition', {
    p_id: community.data!,
    p_action: 'join',
  });
  expect(laterJoin.data).toBe('joined');
  const pending = await admin
    .from('notification_outbox')
    .select('id,event_type,status')
    .eq('recipient_id', alice.id)
    .eq('target_id', community.data!)
    .eq('status', 'queued');
  expect(pending.data).toEqual([]);
});

it('notifies match-discussion recipients and fantasy league owners', async () => {
  const matchId = randomUUID();
  const root = await alice.client.rpc('create_match_discussion_message', {
    p_match_id: matchId,
    p_body: 'A match discussion root.',
  });
  expect(root.error).toBeNull();
  const reply = await carol.client.rpc('create_match_discussion_message', {
    p_match_id: matchId,
    p_body: 'A reply for the root author.',
    p_parent_id: root.data,
  });
  expect(reply.error).toBeNull();
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const matchNotification = await alice.client
    .from('notifications')
    .select('event_type,target_id,related_id')
    .eq('event_type', 'match_reply')
    .single();
  expect(matchNotification.data).toMatchObject({
    target_id: matchId,
    related_id: root.data,
  });

  const demo = fantasyDemoCompetitions[0];
  const competitionId = randomUUID();
  competitions.push(competitionId);
  expect(
    (
      await admin.from('fantasy_competitions').insert({
        id: competitionId,
        source_competition_id: demo.sourceCompetitionId,
        sport_id: demo.sportId,
        name: 'Notification test competition',
        status: 'open',
        current_rule_version: 1,
      })
    ).error,
  ).toBeNull();
  const ownerTeamId = randomUUID();
  const memberTeamId = randomUUID();
  expect(
    (
      await admin.from('fantasy_teams').insert([
        { id: ownerTeamId, competition_id: competitionId, user_id: alice.id },
        { id: memberTeamId, competition_id: competitionId, user_id: carol.id },
      ])
    ).error,
  ).toBeNull();
  const leagueId = randomUUID();
  expect(
    (
      await admin.from('fantasy_leagues').insert({
        id: leagueId,
        competition_id: competitionId,
        owner_id: alice.id,
        name: 'Notification league',
        invite_code_hash: `\\x${'ab'.repeat(32)}`,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.from('fantasy_league_members').insert({
        league_id: leagueId,
        competition_id: competitionId,
        user_id: alice.id,
        team_id: ownerTeamId,
        role: 'owner',
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await admin.from('fantasy_league_members').insert({
        league_id: leagueId,
        competition_id: competitionId,
        user_id: carol.id,
        team_id: memberTeamId,
      })
    ).error,
  ).toBeNull();
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const fantasyNotification = await alice.client
    .from('notifications')
    .select('event_type,target_id')
    .eq('event_type', 'fantasy_join')
    .eq('target_id', leagueId);
  expect(fantasyNotification.data).toHaveLength(1);
});

it('stores timezone-aware reminders, delivers them only when due, and rejects invalid zones', async () => {
  const localTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const created = await alice.client.rpc('schedule_notification_reminder', {
    p_label: 'Kickoff reminder',
    p_target_type: 'match',
    p_target_id: postId,
    p_local_scheduled_for: `${localTime}:00`,
    p_time_zone: 'UTC',
  });
  expect(created.error).toBeNull();
  const reminder = await alice.client
    .from('notification_reminders')
    .select('time_zone,local_scheduled_for,scheduled_for,status')
    .eq('id', created.data!)
    .single();
  expect(reminder.error).toBeNull();
  expect(reminder.data).toMatchObject({
    time_zone: 'UTC',
    status: 'scheduled',
  });
  expect(new Date(reminder.data!.scheduled_for).toISOString()).toBe(
    `${localTime}:00.000Z`,
  );

  const pastTime = new Date(Date.now() - 60 * 1000).toISOString().slice(0, 19);
  expect(
    (
      await admin
        .from('notification_reminders')
        .update({
          local_scheduled_for: pastTime,
          scheduled_for: `${pastTime}.000Z`,
        })
        .eq('id', created.data!)
    ).error,
  ).toBeNull();
  expect((await alice.client.rpc('process_my_notification_queue')).data).toBe(
    1,
  );
  const dueReminder = await alice.client
    .from('notification_reminders')
    .select('status')
    .eq('id', created.data!)
    .single();
  expect(dueReminder.data?.status).toBe('delivered');
  expect(
    (
      await alice.client
        .from('notifications')
        .select('event_type,related_id')
        .eq('event_type', 'reminder')
        .eq('related_id', created.data!)
    ).data,
  ).toHaveLength(1);

  const invalid = await alice.client.rpc('save_notification_preferences', {
    p_in_app_enabled: true,
    p_social_enabled: true,
    p_community_enabled: true,
    p_match_enabled: true,
    p_fantasy_enabled: true,
    p_time_zone: 'Invalid/Zone',
  });
  expect(invalid.error).not.toBeNull();
});
