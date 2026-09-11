import 'server-only';
import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/supabase/config';
import { FollowButton } from './follow-button';
import type { FollowKind } from './validation';
export async function FollowControl({
  kind,
  id,
  name,
}: {
  kind: FollowKind;
  id: string;
  name: string;
}) {
  if (!isAuthConfigured())
    return (
      <p className="muted">
        Following is unavailable until accounts are configured.
      </p>
    );
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return (
      <Link className="button secondary button-small" href="/login">
        Sign in to follow
      </Link>
    );
  const query =
    kind === 'team'
      ? client.from('team_follows').select('team_id').eq('team_id', id)
      : kind === 'player'
        ? client.from('player_follows').select('player_id').eq('player_id', id)
        : client
            .from('competition_follows')
            .select('competition_id')
            .eq('competition_id', id);
  const { data, error } = await query.eq('user_id', user.id).limit(1);
  if (error)
    return (
      <p className="form-error">
        Your follow status is temporarily unavailable.
      </p>
    );
  const following = (data ?? []).some((row) => Object.values(row).includes(id));
  return <FollowButton kind={kind} id={id} name={name} following={following} />;
}
