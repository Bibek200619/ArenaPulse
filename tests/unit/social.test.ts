import { expect, it, vi, afterEach } from 'vitest';
import {
  socialMutationSchema,
  socialQuerySchema,
  peopleQuerySchema,
} from '@/features/social/validation';
import { changeSocial } from '@/features/social/actions';
import { socialWriteError } from '@/features/social/mutations';
const { writeSocial, requireUser, revalidatePath, client } = vi.hoisted(() => {
  const client = { verified: true };
  return {
    client,
    writeSocial: vi.fn(),
    requireUser: vi.fn(async () => ({
      client,
      user: { id: 'verified-actor' },
    })),
    revalidatePath: vi.fn(),
  };
});
vi.mock('@/features/auth/session', () => ({ requireUser }));
vi.mock('@/features/social/mutations', async (original) => ({
  ...(await original<typeof import('@/features/social/mutations')>()),
  writeSocial,
}));
vi.mock('next/cache', () => ({ revalidatePath }));
afterEach(() => vi.restoreAllMocks());
const id = '00000000-0000-4000-8000-000000000001';
function form(values: Record<string, string>) {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
}
it('derives authorship from the verified user and strips browser-supplied ownership', async () => {
  writeSocial.mockResolvedValue({ data: { id }, error: null });
  const result = await changeSocial(
    {},
    form({ operation: 'post', body: '  Match night  ', author_id: 'attacker' }),
  );
  expect(result.postId).toBe(id);
  expect(writeSocial).toHaveBeenCalledWith(client, 'verified-actor', {
    operation: 'post',
    body: 'Match night',
  });
});
it('rejects invalid operations, oversized content and reply identifiers before auth', async () => {
  for (const value of [
    { operation: 'post', body: ' ' },
    { operation: 'post', body: 'a'.repeat(2001) },
    { operation: 'comment', postId: id, body: 'fine', parentId: 'wrong' },
    { operation: 'moderate', postId: id },
  ])
    expect(socialMutationSchema.safeParse(value).success).toBe(false);
  expect(
    (await changeSocial({}, form({ operation: 'post', body: ' ' }))).error,
  ).toBeDefined();
  expect(requireUser).not.toHaveBeenCalled();
  expect(writeSocial).not.toHaveBeenCalled();
});
it('returns safe errors, including database rate limits, without internal details', async () => {
  writeSocial.mockResolvedValueOnce({
    error: { code: 'P0001', message: 'internal SQL' },
  });
  expect(
    (await changeSocial({}, form({ operation: 'post', body: 'valid' }))).error,
  ).toBe(socialWriteError('P0001'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  writeSocial.mockRejectedValueOnce(new Error('secret connection string'));
  expect(
    (await changeSocial({}, form({ operation: 'post', body: 'valid' }))).error,
  ).toBe('Unable to save your change. Please try again.');
});
it('does not report deleting another user’s missing or inaccessible post as success', async () => {
  writeSocial.mockResolvedValueOnce({ error: null, data: null });
  const result = await changeSocial(
    {},
    form({ operation: 'delete-post', postId: id }),
  );
  expect(result.error).toBeDefined();
  expect(result.deleted).toBeUndefined();
});
it('accepts duplicate likes idempotently but does not swallow other conflicts', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  writeSocial.mockResolvedValue({ error: { code: '23505' }, data: null });
  expect(
    (await changeSocial({}, form({ operation: 'like', postId: id }))).active,
  ).toBe(true);
  expect(
    (await changeSocial({}, form({ operation: 'post', body: 'valid' }))).error,
  ).toBeDefined();
});
it('bounds pagination and rejects filters or search metacharacters', () => {
  expect(socialQuerySchema.parse({})).toEqual({ page: 1, view: 'all' });
  for (const page of [0, -1, 1001, 1.5, 'NaN', ['1', '2']])
    expect(socialQuerySchema.safeParse({ page }).success).toBe(false);
  expect(peopleQuerySchema.safeParse({ q: '%),id.gt.0' }).success).toBe(false);
  expect(peopleQuerySchema.parse({ q: ' Fan_ ' }).q).toBe('fan_');
});
