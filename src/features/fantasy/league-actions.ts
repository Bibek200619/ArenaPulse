'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/session';
import {
  createFantasyLeagueSchema,
  joinFantasyLeagueSchema,
} from './league-validation';

export type FantasyLeagueActionState = {
  error?: string;
  success?: string;
  inviteCode?: string;
  leagueId?: string;
};

export async function createFantasyLeague(
  _previous: FantasyLeagueActionState,
  form: FormData,
): Promise<FantasyLeagueActionState> {
  const parsed = createFantasyLeagueSchema.safeParse({
    competitionId: form.get('competitionId'),
    name: form.get('name'),
  });
  if (!parsed.success)
    return { error: 'Choose a competition and a 3–60 character league name.' };

  const { client } = await requireUser();
  const inviteCode = randomBytes(24).toString('base64url');
  const { data: leagueId, error } = await client.rpc('create_fantasy_league', {
    p_competition_id: parsed.data.competitionId,
    p_name: parsed.data.name,
    p_invite_code: inviteCode,
  });
  if (error)
    return {
      error:
        error.code === '23514'
          ? 'Save a squad for this competition before creating a league.'
          : 'Unable to create the private league. Please try again.',
    };
  revalidatePath('/fantasy', 'page');
  return {
    success: 'Private league created. Copy this invitation code to share it.',
    inviteCode,
    leagueId,
  };
}

export async function joinFantasyLeague(
  _previous: FantasyLeagueActionState,
  form: FormData,
): Promise<FantasyLeagueActionState> {
  const parsed = joinFantasyLeagueSchema.safeParse({
    inviteCode: form.get('inviteCode'),
  });
  if (!parsed.success)
    return { error: 'Enter a valid 32 character invitation code.' };

  const { client } = await requireUser();
  const { data: leagueId, error } = await client.rpc('join_fantasy_league', {
    p_invite_code: parsed.data.inviteCode,
  });
  if (error)
    return {
      error:
        'This invitation code is invalid, or you need a saved squad in that competition.',
    };
  revalidatePath('/fantasy', 'page');
  return { success: 'You joined the private league.', leagueId };
}
