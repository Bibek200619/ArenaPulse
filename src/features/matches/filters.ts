import { z } from 'zod';
import type { MatchQuery } from '@/features/sports/types';
const optionalFilter = (schema: z.ZodType<string>) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  );
export const matchFiltersSchema = z
  .object({
    view: z
      .enum(['all', 'live', 'today', 'upcoming', 'finished'])
      .default('all'),
    sportId: optionalFilter(z.uuid()),
    competitionId: optionalFilter(z.uuid()),
    date: optionalFilter(z.iso.date()),
    page: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .strict();
export type MatchFilters = z.infer<typeof matchFiltersSchema>;
export const PAGE_SIZE = 8;
export function toMatchQuery(filters: MatchFilters, now: Date): MatchQuery {
  const { sportId, competitionId, view } = filters;
  return {
    sportId,
    competitionId,
    date: view === 'today' ? now.toISOString().slice(0, 10) : filters.date,
    state:
      view === 'live'
        ? 'live'
        : view === 'finished'
          ? 'finished'
          : view === 'upcoming'
            ? 'scheduled'
            : undefined,
    startsAfter: view === 'upcoming' ? now.toISOString() : undefined,
    offset: (filters.page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  };
}
export function matchesHref(filters: MatchFilters, page = filters.page) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, page }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return `/matches?${params}`;
}
export function formatMatchTime(value: string) {
  return (
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(value)) + ' UTC'
  );
}
