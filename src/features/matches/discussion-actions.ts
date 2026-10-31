'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/features/auth/session';
import { sportsService } from '@/services/sports/service';

const schema = z.object({
  operation: z.enum([
    'message',
    'reply',
    'react',
    'delete',
    'report',
    'moderate',
  ]),
  matchId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  body: z.string().trim().min(1).max(1000).optional(),
  active: z.enum(['true', 'false']).optional(),
});

export async function changeMatchDiscussion(form: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Check your message and try again.' };
  const input = parsed.data;
  const { client } = await requireUser();
  try {
    await sportsService.getMatch(input.matchId);
    if (input.operation === 'message' || input.operation === 'reply') {
      const { error } = await client.rpc('create_match_discussion_message', {
        p_match_id: input.matchId,
        p_body: input.body ?? '',
        p_parent_id: input.parentId ?? undefined,
      });
      if (error) throw error;
    } else if (input.operation === 'react' && input.messageId) {
      const { error } = await client.rpc('set_match_discussion_reaction', {
        p_match_id: input.matchId,
        p_message_id: input.messageId,
        p_active: input.active === 'true',
      });
      if (error) throw error;
    } else if (input.operation === 'delete' && input.messageId) {
      const { data, error } = await client.rpc(
        'delete_match_discussion_message',
        {
          p_match_id: input.matchId,
          p_message_id: input.messageId,
        },
      );
      if (error || !data) throw error ?? new Error('Message unavailable');
    } else if (input.operation === 'moderate' && input.messageId) {
      const { error } = await client.rpc('moderate_match_discussion_message', {
        p_match_id: input.matchId,
        p_message_id: input.messageId,
      });
      if (error) throw error;
    } else if (input.operation === 'report' && input.messageId && input.body) {
      const { error } = await client.rpc('report_match_discussion_message', {
        p_match_id: input.matchId,
        p_message_id: input.messageId,
        p_reason: input.body ?? '',
      });
      if (error) throw error;
    } else {
      return { error: 'This action is unavailable.' };
    }
  } catch {
    return { error: 'Unable to save your change. Please try again.' };
  }
  revalidatePath(`/matches/${input.matchId}`);
  return { success: 'Saved.' };
}
