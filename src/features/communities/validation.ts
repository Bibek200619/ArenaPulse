import { z } from 'zod';
export const COMMUNITY_PAGE_SIZE = 20;
export const communityId = z.uuid();
const optionalId = z.union([communityId, z.literal('')]).optional();
export const createCommunitySchema = z.object({
  operation: z.literal('create'),
  name: z.string().trim().min(3).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  description: z.string().trim().max(1500).default(''),
  rules: z.string().trim().max(3000).default(''),
  visibility: z.enum(['public', 'private']),
  sportId: optionalId,
});
const target = { id: communityId, targetId: communityId };
export const communityMutationSchema = z.discriminatedUnion('operation', [
  createCommunitySchema,
  z.object({ operation: z.literal('join'), id: communityId }),
  z.object({ operation: z.literal('leave'), id: communityId }),
  z.object({ operation: z.literal('cancel-request'), id: communityId }),
  z.object({ operation: z.literal('approve'), ...target }),
  z.object({ operation: z.literal('reject'), ...target }),
  z.object({ operation: z.literal('transfer'), ...target }),
  z.object({ operation: z.literal('unban'), ...target }),
  z.object({
    operation: z.literal('role'),
    ...target,
    role: z.enum(['admin', 'moderator', 'member']),
  }),
  z.object({
    operation: z.literal('ban'),
    ...target,
    reason: z.string().trim().min(1).max(500),
  }),
]);
export type CommunityMutation = z.infer<typeof communityMutationSchema>;
export const communityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  q: z
    .string()
    .trim()
    .max(80)
    .regex(/^[\p{L}\p{N} '\-]*$/u)
    .default(''),
  view: z.enum(['discover', 'mine']).default('discover'),
});
export const memberQuerySchema = z.object({
  page: communityQuerySchema.shape.page,
  tab: z.enum(['members', 'requests', 'bans', 'audit']).default('members'),
});
export function roleRank(role: string | null | undefined) {
  return (
    ({ owner: 4, admin: 3, moderator: 2, member: 1 } as Record<string, number>)[
      role ?? ''
    ] ?? 0
  );
}
