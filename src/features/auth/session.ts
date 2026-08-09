import 'server-only';
import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/supabase/config';
export async function requireUser() {
  if (!isAuthConfigured()) redirect('/login');
  const client = await serverClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect('/login');
  return { client, user };
}
