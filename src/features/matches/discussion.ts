import 'server-only';
import { serverClient } from '@/lib/supabase/server';

export const DISCUSSION_PAGE_SIZE = 20;

export async function getMatchDiscussion(matchId: string, page: number) {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { messages: [], hasMore: false };
  const start = page * DISCUSSION_PAGE_SIZE;
  const { data, error } = await client
    .from('match_discussion_messages')
    .select(
      'id,match_id,author_id,parent_id,body,created_at,is_removed,removal_reason',
    )
    .eq('match_id', matchId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range(start, start + DISCUSSION_PAGE_SIZE - 1);
  if (error) return { messages: [], hasMore: false };
  const roots = data ?? [];
  const ids = roots.map((row) => row.id);
  const { data: replies } = ids.length
    ? await client
        .from('match_discussion_messages')
        .select(
          'id,match_id,author_id,parent_id,body,created_at,is_removed,removal_reason',
        )
        .eq('match_id', matchId)
        .in('parent_id', ids)
        .order('created_at', { ascending: true })
        .limit(100)
    : {
        data: [] as {
          id: string;
          match_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          created_at: string;
          is_removed: boolean;
          removal_reason: string | null;
        }[],
      };
  const all = [...roots, ...(replies ?? [])];
  const authors = [...new Set(all.map((row) => row.author_id))];
  const { data: profiles } = authors.length
    ? await client
        .from('profiles')
        .select('id,username,display_name')
        .in('id', authors)
    : { data: [] };
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const { data: reactions } = ids.length
    ? await client
        .from('match_discussion_reactions')
        .select('message_id,user_id')
        .eq('match_id', matchId)
        .in(
          'message_id',
          all.map((row) => row.id),
        )
    : { data: [] as { message_id: string; user_id: string }[] };
  return {
    messages: roots.map((root) => ({
      ...root,
      profile: profileMap.get(root.author_id),
      reactionCount: (reactions ?? []).filter((r) => r.message_id === root.id)
        .length,
      reacted: (reactions ?? []).some(
        (r) => r.message_id === root.id && r.user_id === user?.id,
      ),
      replies: (replies ?? [])
        .filter((reply) => reply.parent_id === root.id)
        .map((reply) => ({
          ...reply,
          profile: profileMap.get(reply.author_id),
          reactionCount: (reactions ?? []).filter(
            (reaction) => reaction.message_id === reply.id,
          ).length,
          reacted: (reactions ?? []).some(
            (reaction) =>
              reaction.message_id === reply.id && reaction.user_id === user?.id,
          ),
          replies: [],
        })),
    })),
    hasMore: roots.length === DISCUSSION_PAGE_SIZE,
  };
}
