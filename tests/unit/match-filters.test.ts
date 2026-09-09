import { expect, it } from 'vitest';
import {
  matchFiltersSchema,
  matchesHref,
  toMatchQuery,
} from '@/features/matches/filters';
const now = new Date('2026-09-10T00:05:00Z');
it('uses actual UTC today and overrides a conflicting date', () => {
  const filters = matchFiltersSchema.parse({
    view: 'today',
    date: '2026-09-09',
  });
  expect(toMatchQuery(filters, now).date).toBe('2026-09-10');
});
it('upcoming excludes already started scheduled matches', () => {
  const query = toMatchQuery(
    matchFiltersSchema.parse({ view: 'upcoming' }),
    now,
  );
  expect(query).toMatchObject({
    state: 'scheduled',
    startsAfter: now.toISOString(),
  });
});
it('preserves filters across pagination and normalizes empty form fields', () => {
  const filters = matchFiltersSchema.parse({
    view: 'finished',
    sportId: '',
    date: '2026-09-08',
    page: '2',
  });
  expect(toMatchQuery(filters, now)).toMatchObject({
    state: 'finished',
    date: '2026-09-08',
    offset: 8,
    limit: 8,
  });
  expect(matchesHref(filters, 3)).toBe(
    '/matches?view=finished&date=2026-09-08&page=3',
  );
  expect(filters.sportId).toBeUndefined();
});
it.each([
  { page: 0 },
  { page: 1001 },
  { view: 'wat' },
  { date: '2026-02-30' },
  { sportId: ['a', 'b'] },
])('rejects malformed UI query %j', (input) => {
  expect(matchFiltersSchema.safeParse(input).success).toBe(false);
});
