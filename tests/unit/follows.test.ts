import { expect, it, vi } from 'vitest';
import { followSchema } from '@/features/follows/validation';
import { changeFollow } from '@/features/follows/actions';
const { writeFollow, revalidatePath, requireUser, client } = vi.hoisted(() => {
  const client = { verified: true };
  return {
    client,
    writeFollow: vi.fn(),
    revalidatePath: vi.fn(),
    requireUser: vi.fn(async () => ({
      client,
      user: { id: 'verified-owner' },
    })),
  };
});
vi.mock('@/features/auth/session', () => ({ requireUser }));
vi.mock('@/features/follows/repository', () => ({ writeFollow }));
vi.mock('next/cache', () => ({ revalidatePath }));
const id = '00000000-0000-4000-8000-000000000001';
function form(operation = 'follow') {
  const data = new FormData();
  data.set('kind', 'team');
  data.set('id', id);
  data.set('operation', operation);
  data.set('user_id', 'attacker-supplied');
  return data;
}
it('takes follow ownership from verified identity, never browser input', async () => {
  writeFollow.mockResolvedValue({ error: null });
  expect(await changeFollow({}, form())).toEqual({ following: true });
  expect(writeFollow).toHaveBeenCalledWith(
    client,
    'verified-owner',
    'team',
    id,
    true,
  );
  expect(revalidatePath).toHaveBeenCalledWith(`/teams/${id}`);
});
it('treats duplicate follows as idempotent and safely reports failures', async () => {
  writeFollow.mockResolvedValueOnce({ error: { code: '23505' } });
  expect(await changeFollow({}, form())).toEqual({ following: true });
  writeFollow.mockRejectedValueOnce(new Error('secret internal details'));
  expect(await changeFollow({}, form('unfollow'))).toEqual({
    error: 'Unable to update this follow. Please try again.',
  });
});
it('rejects invalid input before authenticating or mutating', async () => {
  expect(
    followSchema.safeParse({ kind: 'owner', id, operation: 'follow' }).success,
  ).toBe(false);
  expect((await changeFollow({}, new FormData())).error).toBeDefined();
  expect(requireUser).not.toHaveBeenCalled();
  expect(writeFollow).not.toHaveBeenCalled();
});
