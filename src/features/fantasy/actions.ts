'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/session';
import { saveFantasySquadSchema } from './validation';

export type FantasyActionState = { error?: string; success?: string };

function validationMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('budget')) return 'Your squad is over budget.';
  if (lower.includes('position'))
    return 'Your selected players do not fit the required positions.';
  if (lower.includes('per-team'))
    return 'Your squad exceeds the limit for players from one team.';
  if (lower.includes('transfer'))
    return 'Your squad changes exceed the transfer allowance.';
  if (lower.includes('deadline') || lower.includes('gameweek'))
    return 'This gameweek is locked. Refresh to check the next deadline.';
  if (lower.includes('captain'))
    return 'Choose two different captains from your selected squad.';
  if (lower.includes('unavailable'))
    return 'One or more players are unavailable for this rules version.';
  if (lower.includes('required number'))
    return 'Choose the required number of players.';
  return 'Check your squad against the competition rules and try again.';
}

export async function saveFantasySquad(
  _previous: FantasyActionState,
  form: FormData,
): Promise<FantasyActionState> {
  const rawVersion = form.get('ruleVersion');
  const parsed = saveFantasySquadSchema.safeParse({
    competitionId: form.get('competitionId'),
    gameweekId: form.get('gameweekId'),
    ruleVersion: typeof rawVersion === 'string' ? Number(rawVersion) : NaN,
    playerIds: form.getAll('playerId'),
    captainPlayerId: form.get('captainPlayerId'),
    viceCaptainPlayerId: form.get('viceCaptainPlayerId'),
  });
  if (!parsed.success)
    return {
      error: 'Choose a complete squad and two different captains from it.',
    };
  const { client } = await requireUser();
  try {
    const { error } = await client.rpc('save_fantasy_squad', {
      p_competition_id: parsed.data.competitionId,
      p_gameweek_id: parsed.data.gameweekId,
      p_rule_version: parsed.data.ruleVersion,
      p_player_ids: parsed.data.playerIds,
      p_captain_player_id: parsed.data.captainPlayerId,
      p_vice_captain_player_id: parsed.data.viceCaptainPlayerId,
    });
    if (error)
      return {
        error:
          error.code === '42501'
            ? 'Sign in to save your fantasy squad.'
            : error.code === '23514'
              ? validationMessage(error.message)
              : 'Unable to save your squad. Please try again.',
      };
    revalidatePath('/fantasy', 'page');
    revalidatePath(`/fantasy/${parsed.data.competitionId}`, 'page');
    return { success: 'Your squad is saved for this gameweek.' };
  } catch {
    return { error: 'Unable to save your squad. Please try again.' };
  }
}
