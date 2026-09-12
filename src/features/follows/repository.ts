import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { FollowKind } from './validation';
type Client = SupabaseClient<Database>;
export function readFollows(client: Client, userId: string, kind: FollowKind) {
  switch (kind) {
    case 'team':
      return client
        .from('team_follows')
        .select('team_id')
        .eq('user_id', userId)
        .limit(100);
    case 'player':
      return client
        .from('player_follows')
        .select('player_id')
        .eq('user_id', userId)
        .limit(100);
    case 'competition':
      return client
        .from('competition_follows')
        .select('competition_id')
        .eq('user_id', userId)
        .limit(100);
  }
}
export async function writeFollow(
  client: Client,
  userId: string,
  kind: FollowKind,
  id: string,
  following: boolean,
) {
  switch (kind) {
    case 'team':
      return following
        ? client.from('team_follows').insert({ user_id: userId, team_id: id })
        : client
            .from('team_follows')
            .delete()
            .eq('user_id', userId)
            .eq('team_id', id);
    case 'player':
      return following
        ? client
            .from('player_follows')
            .insert({ user_id: userId, player_id: id })
        : client
            .from('player_follows')
            .delete()
            .eq('user_id', userId)
            .eq('player_id', id);
    case 'competition':
      return following
        ? client
            .from('competition_follows')
            .insert({ user_id: userId, competition_id: id })
        : client
            .from('competition_follows')
            .delete()
            .eq('user_id', userId)
            .eq('competition_id', id);
  }
}
