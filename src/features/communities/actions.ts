'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/session';
import { communityMutationSchema } from './validation';
export type CommunityState = { error?: string; success?: string; id?: string };
export async function changeCommunity(
  _state: CommunityState,
  form: FormData,
): Promise<CommunityState> {
  const parsed = communityMutationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        'Check your entries. Names need 3–80 characters; slugs use lowercase letters, numbers and single hyphens.',
    };
  const { client } = await requireUser();
  const input = parsed.data;
  try {
    const result =
      input.operation === 'create'
        ? await client.rpc('create_community', {
            p_name: input.name,
            p_slug: input.slug,
            p_description: input.description,
            p_rules: input.rules,
            p_visibility: input.visibility,
            ...(input.sportId ? { p_sport_id: input.sportId } : {}),
          })
        : await client.rpc('community_transition', {
            p_id: input.id,
            p_action: input.operation,
            ...('targetId' in input ? { p_target: input.targetId } : {}),
            ...('role' in input ? { p_role: input.role } : {}),
            ...('reason' in input ? { p_reason: input.reason } : {}),
          });
    if (result.error) {
      const messages: Record<string, string> = {
        '23505': 'That community slug is already in use. Choose another.',
        '23514':
          'This change is no longer valid. Refresh the page; owners must transfer ownership before leaving.',
        '23503': 'Complete your profile and check the selected sport.',
        '42501':
          'This action is unavailable. Check your membership and permissions.',
        P0001:
          'You are making changes too quickly. Wait a minute and try again.',
      };
      if (!messages[result.error.code])
        console.error(
          JSON.stringify({
            event: 'community_write_failed',
            operation: input.operation,
          }),
        );
      return {
        error:
          messages[result.error.code] ??
          'Unable to save this change. Please try again.',
      };
    }
    revalidatePath('/communities', 'layout');
    return {
      success:
        input.operation === 'join' && result.data === 'requested'
          ? 'Access requested. A community moderator must approve it.'
          : 'Saved.',
      ...(input.operation === 'create' && result.data
        ? { id: result.data }
        : {}),
    };
  } catch {
    console.error(
      JSON.stringify({
        event: 'community_write_failed',
        operation: input.operation,
      }),
    );
    return { error: 'Unable to save this change. Please try again.' };
  }
}
