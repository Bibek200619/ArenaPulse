import { expect, it } from 'vitest';
import { AppError, errorResponse } from '@/lib/errors';
it('redacts unexpected internal errors', async () => {
  const response = errorResponse(new Error('private-db-password'));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('private-db-password');
});
it('returns a stable public error contract', async () => {
  const response = errorResponse(
    new AppError('FORBIDDEN', 'You cannot perform this action.'),
  );
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    error: { code: 'FORBIDDEN', message: 'You cannot perform this action.' },
  });
});
