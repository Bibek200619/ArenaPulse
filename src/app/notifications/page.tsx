import Link from 'next/link';
import { requireUser } from '@/features/auth/session';
import {
  NotificationControls,
  NotificationPreferencesForm,
  ReminderForm,
} from '@/features/notifications/forms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notifications' };

const messages: Record<string, string> = {
  social_comment: 'commented on your post',
  social_reply: 'replied to your comment',
  social_like: 'liked your post',
  social_follow: 'started following you',
  community_request: 'requested to join your community',
  community_join: 'joined your community',
  community_approved: 'approved your community access',
  match_reply: 'replied to your match discussion',
  match_like: 'liked your match discussion message',
  fantasy_join: 'joined your fantasy league',
  reminder: 'Your scheduled reminder is due',
};

function targetHref(type: string, id: string) {
  switch (type) {
    case 'post':
      return `/posts/${id}`;
    case 'community':
      return `/communities/${id}`;
    case 'match':
      return `/matches/${id}`;
    case 'fantasy_league':
      return `/fantasy/leagues/${id}`;
    case 'fantasy_gameweek':
      return '/fantasy';
    case 'profile':
      return '/profile';
    default:
      return '/notifications';
  }
}

export default async function NotificationsPage() {
  const { client } = await requireUser();
  const { error: processingError } = await client.rpc(
    'process_my_notification_queue',
  );
  if (processingError) {
    console.error(
      JSON.stringify({ event: 'notification_queue_processing_failed' }),
    );
  }
  const [notificationResult, preferenceResult, reminderResult, queuedResult] =
    await Promise.all([
      client
        .from('notifications')
        .select(
          'id,event_type,target_type,target_id,created_at,read_at,actor:profiles!notifications_actor_id_fkey(username,display_name)',
        )
        .order('created_at', { ascending: false })
        .limit(50),
      client.from('notification_preferences').select('*').maybeSingle(),
      client
        .from('notification_reminders')
        .select('id,label,target_type,target_id,scheduled_for,time_zone,status')
        .in('status', ['scheduled', 'queued'])
        .order('scheduled_for', { ascending: true })
        .limit(50),
      client
        .from('notification_outbox')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'queued'),
    ]);

  const preferences = preferenceResult.data ?? {
    user_id: '',
    in_app_enabled: true,
    social_enabled: true,
    community_enabled: true,
    match_enabled: true,
    fantasy_enabled: true,
    time_zone: 'UTC',
    updated_at: '',
  };
  return (
    <div className="section notification-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR ARENAPULSE INBOX</p>
          <h1>Notifications</h1>
          <p>Account activity stays in your private inbox.</p>
        </div>
        <Link className="text-link" href="/dashboard">
          Open your dashboard →
        </Link>
      </div>

      {queuedResult.count ? (
        <p className="notice" role="status">
          {queuedResult.count}{' '}
          {queuedResult.count === 1 ? 'event is' : 'events are'} still queued.
          Queued events are not marked as delivered.
        </p>
      ) : null}

      <section className="notification-panel" aria-labelledby="inbox-heading">
        <h2 id="inbox-heading">Recent activity</h2>
        {notificationResult.error ? (
          <p role="alert">Your notifications are temporarily unavailable.</p>
        ) : notificationResult.data?.length ? (
          <ul className="notification-list">
            {notificationResult.data.map((item) => {
              const actor = Array.isArray(item.actor)
                ? item.actor[0]
                : item.actor;
              const actorName = actor?.display_name || 'Another fan';
              const message =
                messages[item.event_type] ?? 'interacted with you';
              return (
                <li
                  className={
                    item.read_at
                      ? 'notification-item is-read'
                      : 'notification-item'
                  }
                  key={item.id}
                >
                  <div>
                    <p>
                      <strong>{actorName}</strong> {message}
                    </p>
                    <p className="muted">
                      {new Date(item.created_at).toLocaleString()}
                      {item.read_at ? ' · Read' : ' · Unread'}
                    </p>
                  </div>
                  <div className="notification-actions">
                    <Link
                      className="text-link"
                      href={targetHref(item.target_type, item.target_id)}
                    >
                      View
                    </Link>
                    {!item.read_at && (
                      <NotificationControls notificationId={item.id} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">
            No delivered notifications yet. New activity will appear here.
          </p>
        )}
      </section>

      <div className="notification-columns">
        <section
          className="notification-panel"
          aria-labelledby="preferences-heading"
        >
          <h2 id="preferences-heading">Preferences</h2>
          <p className="muted">
            Email and push delivery are disabled until a provider is configured.
          </p>
          <NotificationPreferencesForm values={preferences} />
        </section>

        <section
          className="notification-panel"
          aria-labelledby="reminders-heading"
        >
          <h2 id="reminders-heading">Reminders</h2>
          <p className="muted">
            Reminder times use the selected IANA time zone and are stored as UTC
            instants.
          </p>
          <ReminderForm timeZone={preferences.time_zone} />
          {reminderResult.data?.length ? (
            <ul className="notification-list reminder-list">
              {reminderResult.data.map((reminder) => (
                <li className="notification-item" key={reminder.id}>
                  <div>
                    <strong>{reminder.label}</strong>
                    <p className="muted">
                      {new Date(reminder.scheduled_for).toLocaleString('en', {
                        timeZone: reminder.time_zone,
                      })}{' '}
                      · {reminder.time_zone} · {reminder.status}
                    </p>
                  </div>
                  {reminder.status === 'scheduled' && (
                    <NotificationControls reminderId={reminder.id} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No upcoming reminders.</p>
          )}
        </section>
      </div>
    </div>
  );
}
