import { z } from 'zod';
export const states = [
  'scheduled',
  'live',
  'paused',
  'finished',
  'postponed',
  'cancelled',
  'abandoned',
] as const;
export const matchQuerySchema = z
  .object({
    sportId: z.uuid().optional(),
    competitionId: z.uuid().optional(),
    state: z.enum(states).optional(),
    date: z.iso.date().optional(),
    startsAfter: z.iso.datetime().optional(),
    teamId: z.uuid().optional(),
    playerId: z.uuid().optional(),
    offset: z.coerce.number().int().min(0).max(10_000).default(0),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export const entityIdSchema = z.uuid();
