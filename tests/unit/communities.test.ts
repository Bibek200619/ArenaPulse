import { afterEach, expect, it, vi } from 'vitest';
import {
  communityMutationSchema,
  communityQuerySchema,
  memberQuerySchema,
} from '@/features/communities/validation';
import { changeCommunity } from '@/features/communities/actions';
const { rpc, requireUser, revalidatePath } = vi.hoisted(() => {
  const rpc = vi.fn();
  return {
    rpc,
    requireUser: vi.fn(async () => ({
      client: { rpc },
      user: { id: 'verified-user' },
    })),
    revalidatePath: vi.fn(),
  };
});
vi.mock('@/features/auth/session', () => ({ requireUser }));
vi.mock('next/cache', () => ({ revalidatePath }));
afterEach(() => vi.restoreAllMocks());
const id = '00000000-0000-4000-8000-000000000001';
function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
it('creates through the verified client and never forwards spoofed ownership', async () => {
  rpc.mockResolvedValue({ data: id, error: null });
  expect(
    (
      await changeCommunity(
        {},
        form({
          operation: 'create',
          name: ' Fans ',
          slug: ' FANS ',
          visibility: 'private',
          owner_id: 'attacker',
          role: 'owner',
        }),
      )
    ).id,
  ).toBe(id);
  expect(requireUser).toHaveBeenCalled();
  expect(rpc).toHaveBeenCalledWith('create_community', {
    p_name: 'Fans',
    p_slug: 'fans',
    p_description: '',
    p_rules: '',
    p_visibility: 'private',
  });
  expect(revalidatePath).toHaveBeenCalledWith('/communities', 'layout');
});
it('rejects malformed IDs, owner assignments, blank reasons and oversized values', async () => {
  for (const input of [
    { operation: 'join', id: 'bad' },
    { operation: 'role', id, targetId: id, role: 'owner' },
    { operation: 'ban', id, targetId: id, reason: ' ' },
    { operation: 'ban', id, targetId: id, reason: 'x'.repeat(501) },
    {
      operation: 'create',
      name: 'Fans',
      slug: '../fans',
      visibility: 'public',
    },
    {
      operation: 'create',
      name: 'x'.repeat(81),
      slug: 'fans',
      visibility: 'public',
    },
  ])
    expect(communityMutationSchema.safeParse(input).success).toBe(false);
  expect(
    (await changeCommunity({}, form({ operation: 'transfer', id }))).error,
  ).toBeDefined();
  expect(requireUser).not.toHaveBeenCalled();
});
it('forwards only permitted transition arguments and explains pending approval', async () => {
  rpc.mockResolvedValue({ data: 'requested', error: null });
  expect(
    (
      await changeCommunity(
        {},
        form({ operation: 'join', id, role: 'owner', targetId: id }),
      )
    ).success,
  ).toContain('moderator');
  expect(rpc).toHaveBeenCalledWith('community_transition', {
    p_id: id,
    p_action: 'join',
  });
});
it('handles conflicts, denied authority, rate limits and unknown failures without leaking internals', async () => {
  for (const code of ['23505', '23514', '23503', '42501', 'P0001']) {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code, message: 'secret SQL text' },
    });
    const result = await changeCommunity({}, form({ operation: 'join', id }));
    expect(result.error).toBeDefined();
    expect(result.error).not.toContain('secret');
    expect(result.success).toBeUndefined();
  }
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  rpc.mockRejectedValueOnce(new Error('secret credentials'));
  expect(
    (await changeCommunity({}, form({ operation: 'leave', id }))).error,
  ).toContain('Unable');
  expect(log).toHaveBeenCalledWith(
    JSON.stringify({ event: 'community_write_failed', operation: 'leave' }),
  );
});
it('bounds community search, pagination and member tabs', () => {
  expect(communityQuerySchema.parse({})).toEqual({
    page: 1,
    q: '',
    view: 'discover',
  });
  for (const input of [
    { q: '%' },
    { q: 'a,b)' },
    { page: -1 },
    { page: 1001 },
    { page: ['1', '2'] },
    { view: 'private' },
  ])
    expect(communityQuerySchema.safeParse(input).success).toBe(false);
  expect(memberQuerySchema.safeParse({ tab: 'secrets' }).success).toBe(false);
});
