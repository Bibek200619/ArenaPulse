import { z } from 'zod';

export const createFantasyLeagueSchema = z.object({
  competitionId: z.uuid(),
  name: z.string().trim().min(3).max(60),
});

export const joinFantasyLeagueSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{32}$/),
});
