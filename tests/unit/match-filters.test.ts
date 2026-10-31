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
it('normalizes league selections to football and clears the catalog competition', () => {
  const filters = matchFiltersSchema.parse({
    footballLeague: 'premier-league',
    sportId: '890b07ac-6e1d-501d-82b2-800b6f2e8439',
    competitionId: '6b859309-c119-5773-8244-b62037f640e4',
    date: '2026-10-31',
  });
  expect(filters).toMatchObject({
    footballLeague: 'premier-league',
    sportId: '4d1c1748-a630-5b7e-9080-9c0cc99f60fa',
    date: '2026-10-31',
  });
  expect(filters.competitionId).toBeUndefined();
  expect(toMatchQuery(filters, now)).toMatchObject({
    footballLeague: 'premier-league',
    sportId: '4d1c1748-a630-5b7e-9080-9c0cc99f60fa',
    date: '2026-10-31',
  });
  expect(matchesHref(filters, 2)).toContain('footballLeague=premier-league');
  expect(matchesHref(filters, 2)).toContain('page=2');
});
it.each([
  { page: 0 },
  { page: 1001 },
  { view: 'wat' },
  { date: '2026-02-30' },
  { sportId: ['a', 'b'] },
  { footballLeague: 'serie-a' },
])('rejects malformed UI query %j', (input) => {
  expect(matchFiltersSchema.safeParse(input).success).toBe(false);
});
