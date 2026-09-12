import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { SOCIAL_PAGE_SIZE } from './validation';
type Client = SupabaseClient<Database>;
const postFields =
  'id,body,author_id,created_at,author:profiles!posts_author_id_fkey!inner(username,display_name),comments(count),reactions(count)' as const;
export type SocialPost = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  author: { username: string; display_name: string };
  comments: { count: number }[];
  reactions: { count: number }[];
};
export async function readPosts(
  client: Client,
  page: number,
  options: { following?: string; author?: string } = {},
): Promise<SocialPost[]> {
  const start = (page - 1) * SOCIAL_PAGE_SIZE;
  if (options.following) {
    const { data, error } = await client
      .from('posts')
      .select(
        'id,body,author_id,created_at,author:profiles!posts_author_id_fkey!inner(username,display_name,user_follows!user_follows_followed_id_fkey!inner(follower_id)),comments(count),reactions(count)',
      )
      .eq('author.user_follows.follower_id', options.following)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(start, start + SOCIAL_PAGE_SIZE);
    if (error) throw new Error('Social feed is unavailable');
    return data;
  }
  let query = client
    .from('posts')
    .select(postFields)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + SOCIAL_PAGE_SIZE);
  if (options.author) query = query.eq('author_id', options.author);
  const { data, error } = await query;
  if (error) throw new Error('Social feed is unavailable');
  return data;
}
export async function readPost(client: Client, id: string) {
  const { data, error } = await client
    .from('posts')
    .select(postFields)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Post is unavailable');
  return data;
}
export async function readComments(client: Client, id: string, page: number) {
  const start = (page - 1) * SOCIAL_PAGE_SIZE;
  const { data, error } = await client
    .from('comments')
    .select(
      'id,body,author_id,parent_id,created_at,author:profiles!comments_author_id_fkey!inner(username,display_name)',
    )
    .eq('post_id', id)
    .order('created_at')
    .order('id')
    .range(start, start + SOCIAL_PAGE_SIZE);
  if (error) throw new Error('Comments are unavailable');
  return data;
}
