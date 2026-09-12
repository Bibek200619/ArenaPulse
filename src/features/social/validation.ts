import { z } from 'zod';
const id = z.uuid();
const postId = { postId: id };
export const socialMutationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('post'),
    body: z.string().trim().min(1).max(2000),
  }),
  z.object({ operation: z.literal('delete-post'), ...postId }),
  z.object({
    operation: z.literal('comment'),
    ...postId,
    body: z.string().trim().min(1).max(1000),
    parentId: z.union([id, z.literal('')]).optional(),
  }),
  z.object({
    operation: z.literal('delete-comment'),
    ...postId,
    commentId: id,
  }),
  z.object({ operation: z.literal('like'), ...postId }),
  z.object({ operation: z.literal('unlike'), ...postId }),
  z.object({ operation: z.literal('follow'), userId: id }),
  z.object({ operation: z.literal('unfollow'), userId: id }),
]);
export type SocialMutation = z.infer<typeof socialMutationSchema>;
export const socialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  view: z.enum(['all', 'following']).default('all'),
});
export const usernameSchema = z.string().regex(/^[a-z0-9_]{3,24}$/);
export const peopleQuerySchema = z.object({
  page: socialQuerySchema.shape.page,
  q: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{0,24}$/)
    .default(''),
});
export const SOCIAL_PAGE_SIZE = 20;
