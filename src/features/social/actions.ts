'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/session';
import { socialMutationSchema } from './validation';
import { writeSocial, socialWriteError } from './mutations';
export type SocialState = {
  error?: string;
  success?: string;
  postId?: string;
  active?: boolean;
  deleted?: boolean;
};
export async function changeSocial(
  _state: SocialState,
  form: FormData,
): Promise<SocialState> {
  const parsed = socialMutationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        'Check your content and try again. Posts allow 2,000 characters; comments allow 1,000.',
    };
  const { client, user } = await requireUser();
  const input = parsed.data;
  let postId: string | undefined;
  try {
    const { error, data } = await writeSocial(client, user.id, input);
    const idempotent =
      input.operation === 'like' || input.operation === 'follow';
    if (error && !(idempotent && error.code === '23505')) {
      if (!['P0001', '23503', '42501'].includes(error.code))
        console.error(
          JSON.stringify({
            level: 'error',
            event: 'social_write_failed',
            operation: input.operation,
          }),
        );
      return { error: socialWriteError(error.code) };
    }
    if (
      (input.operation === 'delete-post' ||
        input.operation === 'delete-comment') &&
      !data
    )
      return {
        error: 'This content is unavailable or belongs to another user.',
      };
    if (input.operation === 'post' && data && 'id' in data) postId = data.id;
  } catch {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'social_write_failed',
        operation: input.operation,
      }),
    );
    return { error: socialWriteError() };
  }
  revalidatePath('/feed');
  revalidatePath('/people');
  revalidatePath('/users/[username]', 'page');
  revalidatePath('/profile');
  if ('postId' in input) revalidatePath(`/posts/${input.postId}`);
  return {
    success: 'Saved.',
    postId,
    active: ['like', 'follow'].includes(input.operation),
    deleted: input.operation === 'delete-post',
  };
}
