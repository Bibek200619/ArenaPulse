'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/session';
import { followSchema, entityPaths } from './validation';
import { writeFollow } from './repository';
export type FollowState = { error?: string; following?: boolean };
export async function changeFollow(
  _state: FollowState,
  form: FormData,
): Promise<FollowState> {
  const parsed = followSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Choose a valid sports entity and follow action.' };
  const { client, user } = await requireUser();
  const { kind, id, operation } = parsed.data;
  const following = operation === 'follow';
  try {
    const { error } = await writeFollow(client, user.id, kind, id, following);
    if (error && !(following && error.code === '23505'))
      return {
        error:
          error.code === '23503'
            ? 'Complete your profile and check that the sports catalog is available.'
            : 'Unable to update this follow. Please try again.',
      };
  } catch {
    return { error: 'Unable to update this follow. Please try again.' };
  }
  revalidatePath(`${entityPaths[kind]}/${id}`);
  revalidatePath('/settings/sports');
  revalidatePath('/onboarding/sports');
  revalidatePath('/profile');
  return { following };
}
