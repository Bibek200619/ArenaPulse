import { z } from 'zod';

export const fantasyCompetitionIdSchema = z.uuid();
export const saveFantasySquadSchema = z
  .object({
    competitionId: z.uuid(),
    gameweekId: z.uuid(),
    ruleVersion: z.number().int().positive(),
    playerIds: z.array(z.uuid()).min(2).max(40),
    captainPlayerId: z.uuid(),
    viceCaptainPlayerId: z.uuid(),
  })
  .refine((value) => new Set(value.playerIds).size === value.playerIds.length, {
    path: ['playerIds'],
    message: 'Choose each player once.',
  })
  .refine(
    (value) =>
      value.captainPlayerId !== value.viceCaptainPlayerId &&
      value.playerIds.includes(value.captainPlayerId) &&
      value.playerIds.includes(value.viceCaptainPlayerId),
    { path: ['captainPlayerId'], message: 'Choose two different players.' },
  );
export type SaveFantasySquad = z.infer<typeof saveFantasySquadSchema>;
