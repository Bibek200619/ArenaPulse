'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/features/auth/session';
import { sportsService } from '@/services/sports/service';

const preferenceSchema = z.object({
  inApp: z.boolean(),
  social: z.boolean(),
  community: z.boolean(),
  match: z.boolean(),
  fantasy: z.boolean(),
  timeZone: z.string().trim().min(1).max(80),
});

export type NotificationActionState = { error?: string; success?: string };

export async function saveNotificationPreferences(
  _previous: NotificationActionState,
  form: FormData,
): Promise<NotificationActionState> {
  const parsed = preferenceSchema.safeParse({
    inApp: form.get('inApp') === 'on',
    social: form.get('social') === 'on',
    community: form.get('community') === 'on',
    match: form.get('match') === 'on',
    fantasy: form.get('fantasy') === 'on',
    timeZone: form.get('timeZone'),
  });
  if (!parsed.success) return { error: 'Enter a valid IANA time zone.' };

  const { client } = await requireUser();
  const { error } = await client.rpc('save_notification_preferences', {
    p_in_app_enabled: parsed.data.inApp,
    p_social_enabled: parsed.data.social,
    p_community_enabled: parsed.data.community,
    p_match_enabled: parsed.data.match,
    p_fantasy_enabled: parsed.data.fantasy,
    p_time_zone: parsed.data.timeZone,
  });
  if (error) return { error: 'Unable to save notification preferences.' };
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: 'Notification preferences saved.' };
}

const reminderSchema = z.object({
  label: z.string().trim().min(1).max(120),
  targetType: z.enum(['match', 'fantasy_gameweek']),
  targetId: z.string().uuid(),
  localScheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  timeZone: z.string().trim().min(1).max(80),
});

export async function scheduleNotificationReminder(
  _previous: NotificationActionState,
  form: FormData,
): Promise<NotificationActionState> {
  const parsed = reminderSchema.safeParse({
    label: form.get('label'),
    targetType: form.get('targetType'),
    targetId: form.get('targetId'),
    localScheduledFor: form.get('localScheduledFor'),
    timeZone: form.get('timeZone'),
  });
  if (!parsed.success)
    return {
      error: 'Check the reminder title, target ID, date and time zone.',
    };

  const { client } = await requireUser();
  try {
    if (parsed.data.targetType === 'match') {
      await sportsService.getMatch(parsed.data.targetId);
    } else {
      const { data, error } = await client
        .from('fantasy_gameweeks')
        .select('id')
        .eq('id', parsed.data.targetId)
        .maybeSingle();
      if (error || !data) return { error: 'That gameweek is unavailable.' };
    }
    const { error } = await client.rpc('schedule_notification_reminder', {
      p_label: parsed.data.label,
      p_target_type: parsed.data.targetType,
      p_target_id: parsed.data.targetId,
      p_local_scheduled_for: `${parsed.data.localScheduledFor}:00`,
      p_time_zone: parsed.data.timeZone,
    });
    if (error) return { error: 'Unable to schedule this reminder.' };
  } catch {
    return { error: 'That match is unavailable. Check the ID and try again.' };
  }
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: 'Reminder scheduled.' };
}

export async function cancelNotificationReminder(form: FormData) {
  const id = z.string().uuid().safeParse(form.get('id'));
  if (!id.success) return;
  const { client } = await requireUser();
  await client.rpc('cancel_notification_reminder', { p_id: id.data });
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
}

export async function markNotificationRead(form: FormData) {
  const id = z.string().uuid().safeParse(form.get('id'));
  if (!id.success) return;
  const { client } = await requireUser();
  await client.rpc('mark_notification_read', { p_id: id.data });
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
}
