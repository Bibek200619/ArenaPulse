import 'server-only';
import { cache } from 'react';
import { serverClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/supabase/config';
export const socialContext = cache(async () => {
  if (!isAuthConfigured()) return null;
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const profile = user
    ? await client
        .from('profiles')
        .select('username,is_private')
        .eq('id', user.id)
        .maybeSingle()
    : null;
  if (profile?.error) throw new Error('Your social profile is unavailable');
  return { client, user, profile: profile?.data ?? null };
});
