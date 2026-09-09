import { expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';
it('health route returns a non-cacheable public response without environment secrets', async () => {
  const response = GET();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(await response.json()).toEqual({
    status: 'ok',
    application: 'ArenaPulse',
  });
});
