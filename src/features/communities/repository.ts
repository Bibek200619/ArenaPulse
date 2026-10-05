import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { COMMUNITY_PAGE_SIZE } from './validation';
type Client = SupabaseClient<Database>;
export async function readCommunities(
  client: Client,
  page: number,
  q: string,
  userId?: string,
) {
  const start = (page - 1) * COMMUNITY_PAGE_SIZE;
  const fields = 'id,name,slug,description,visibility' as const;
  // Filter membership in PostgreSQL, rather than truncating an intermediate list of IDs.
  if (userId) {
    const { data, error } = await client
      .from('communities')
      .select(
        'id,name,slug,description,visibility,community_members!inner(user_id)',
      )
      .eq('community_members.user_id', userId)
      .ilike('name', `${q}%`)
      .order('name')
      .order('id')
      .range(start, start + COMMUNITY_PAGE_SIZE);
    if (error) throw new Error('Communities are unavailable');
    return data;
  }
  const { data, error } = await client
    .from('communities')
    .select(fields)
    .eq('visibility', 'public')
    .ilike('name', `${q}%`)
    .order('name')
    .order('id')
    .range(start, start + COMMUNITY_PAGE_SIZE);
  if (error) throw new Error('Communities are unavailable');
  return data;
}
export async function readCommunity(client: Client, id: string) {
  const { data, error } = await client
    .from('communities')
    .select('id,name,slug,description,rules,visibility,owner_id,sport_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Community is unavailable');
  return data;
}
export async function readMembership(
  client: Client,
  id: string,
  userId: string,
) {
  const results = await Promise.all([
    client
      .from('community_members')
      .select('role')
      .eq('community_id', id)
      .eq('user_id', userId)
      .maybeSingle(),
    client
      .from('community_join_requests')
      .select('status')
      .eq('community_id', id)
      .eq('user_id', userId)
      .maybeSingle(),
    client
      .from('community_bans')
      .select('reason')
      .eq('community_id', id)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (results.some((result) => result.error))
    throw new Error('Membership is unavailable');
  return {
    role: results[0].data?.role,
    request: results[1].data?.status,
    ban: results[2].data?.reason,
  };
}
export async function readCommunityRoster(
  client: Client,
  id: string,
  tab: 'members' | 'requests' | 'bans' | 'audit',
  page: number,
) {
  const start = (page - 1) * COMMUNITY_PAGE_SIZE,
    end = start + COMMUNITY_PAGE_SIZE;
  if (tab === 'audit') {
    const { data, error } = await client
      .from('community_audit')
      .select('id,action,actor_id,target_id,detail,created_at')
      .eq('community_id', id)
      .order('created_at', { ascending: false })
      .order('id')
      .range(start, end);
    if (error) throw new Error('Audit is unavailable');
    return { audit: data, people: [] };
  }
  const result =
    tab === 'members'
      ? await client
          .from('community_members')
          .select(
            'user_id,role,profile:profiles!community_members_user_id_fkey(username,display_name)',
          )
          .eq('community_id', id)
          .order('joined_at')
          .order('user_id')
          .range(start, end)
      : tab === 'requests'
        ? await client
            .from('community_join_requests')
            .select(
              'user_id,status,profile:profiles!community_join_requests_user_id_fkey(username,display_name)',
            )
            .eq('community_id', id)
            .eq('status', 'pending')
            .order('requested_at')
            .order('user_id')
            .range(start, end)
        : await client
            .from('community_bans')
            .select(
              'user_id,reason,issuer_rank,profile:profiles!community_bans_user_id_fkey(username,display_name)',
            )
            .eq('community_id', id)
            .order('created_at')
            .order('user_id')
            .range(start, end);
  if (result.error) throw new Error('Community members are unavailable');
  return { audit: [], people: result.data };
}
