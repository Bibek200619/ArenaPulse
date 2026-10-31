'use client';

import { useActionState } from 'react';
import {
  cancelNotificationReminder,
  markNotificationRead,
  saveNotificationPreferences,
  scheduleNotificationReminder,
  type NotificationActionState,
} from './actions';

const initial: NotificationActionState = {};

export function NotificationPreferencesForm({
  values,
}: {
  values: {
    in_app_enabled: boolean;
    social_enabled: boolean;
    community_enabled: boolean;
    match_enabled: boolean;
    fantasy_enabled: boolean;
    time_zone: string;
  };
}) {
  const [state, action, pending] = useActionState(
    saveNotificationPreferences,
    initial,
  );
  return (
    <form action={action} className="notification-settings-form">
      <fieldset>
        <legend>In-app notification preferences</legend>
        {[
          ['inApp', 'In-app inbox', values.in_app_enabled],
          ['social', 'Follows, posts and replies', values.social_enabled],
          ['community', 'Community activity', values.community_enabled],
          ['match', 'Match discussion replies', values.match_enabled],
          ['fantasy', 'Fantasy league activity', values.fantasy_enabled],
        ].map(([name, label, checked]) => (
          <label className="checkbox-row" key={String(name)}>
            <input
              type="checkbox"
              name={String(name)}
              defaultChecked={Boolean(checked)}
            />
            <span>{String(label)}</span>
          </label>
        ))}
      </fieldset>
      <label>
        Reminder time zone (IANA)
        <input
          name="timeZone"
          defaultValue={values.time_zone}
          placeholder="Asia/Kolkata"
          autoComplete="off"
          required
        />
      </label>
      <button className="button" disabled={pending}>
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}

export function ReminderForm({ timeZone }: { timeZone: string }) {
  const [state, action, pending] = useActionState(
    scheduleNotificationReminder,
    initial,
  );
  return (
    <form action={action} className="notification-settings-form">
      <label>
        Reminder title
        <input name="label" maxLength={120} required />
      </label>
      <label>
        Event type
        <select name="targetType" defaultValue="match">
          <option value="match">Match</option>
          <option value="fantasy_gameweek">Fantasy gameweek</option>
        </select>
      </label>
      <label>
        Event ID
        <input name="targetId" inputMode="text" required />
      </label>
      <label>
        Local date and time
        <input name="localScheduledFor" type="datetime-local" required />
      </label>
      <label>
        Time zone
        <input name="timeZone" defaultValue={timeZone} required />
      </label>
      <button className="button" disabled={pending}>
        {pending ? 'Scheduling…' : 'Schedule reminder'}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}

export function NotificationControls({
  notificationId,
  reminderId,
}: {
  notificationId?: string;
  reminderId?: string;
}) {
  const action = notificationId
    ? markNotificationRead
    : cancelNotificationReminder;
  const id = notificationId ?? reminderId;
  if (!id) return null;
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="text-link" type="submit">
        {notificationId ? 'Mark as read' : 'Cancel reminder'}
      </button>
    </form>
  );
}
