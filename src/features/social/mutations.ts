import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { SocialMutation } from './validation';
export async function writeSocial(
  client: SupabaseClient<Database>,
  actor: string,
  input: SocialMutation,
) {
  switch (input.operation) {
    case 'post':
      return client
        .from('posts')
        .insert({ author_id: actor, body: input.body })
        .select('id')
        .single();
    case 'delete-post':
      return client
        .from('posts')
        .delete()
        .eq('id', input.postId)
        .eq('author_id', actor)
        .select('id')
        .maybeSingle();
    case 'comment':
      return client
        .from('comments')
        .insert({
          author_id: actor,
          post_id: input.postId,
          body: input.body,
          parent_id: input.parentId || null,
        })
        .select('id')
        .single();
    case 'delete-comment':
      return client
        .from('comments')
        .delete()
        .eq('id', input.commentId)
        .eq('post_id', input.postId)
        .eq('author_id', actor)
        .select('id')
        .maybeSingle();
    case 'like':
      return client
        .from('reactions')
        .insert({ user_id: actor, post_id: input.postId });
    case 'unlike':
      return client
        .from('reactions')
        .delete()
        .eq('user_id', actor)
        .eq('post_id', input.postId);
    case 'follow':
      return client
        .from('user_follows')
        .insert({ follower_id: actor, followed_id: input.userId });
    case 'unfollow':
      return client
        .from('user_follows')
        .delete()
        .eq('follower_id', actor)
        .eq('followed_id', input.userId);
  }
}
export function socialWriteError(code?: string) {
  if (code === 'P0001')
    return 'You are making changes too quickly. Please wait a minute and try again.';
  if (code === '23503')
    return 'Complete your profile and check that this conversation is still available.';
  if (code === '42501')
    return 'This action is unavailable. The content may be private or no longer accessible.';
  return 'Unable to save your change. Please try again.';
}
