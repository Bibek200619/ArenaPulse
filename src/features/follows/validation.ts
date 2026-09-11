import { z } from 'zod';
export const followSchema = z.object({
  kind: z.enum(['team', 'player', 'competition']),
  id: z.uuid(),
  operation: z.enum(['follow', 'unfollow']),
});
export type FollowKind = z.infer<typeof followSchema>['kind'];
export const entityPaths = {
  team: '/teams',
  player: '/players',
  competition: '/competitions',
} as const;
