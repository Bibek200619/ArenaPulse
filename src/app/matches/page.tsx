import Link from 'next/link';
import { sportsService } from '@/services/sports/service';
import {
  matchFiltersSchema,
  matchesHref,
  toMatchQuery,
} from '@/features/matches/filters';
import { MatchFilters } from '@/components/matches/match-filters';
import { FixtureRow } from '@/components/matches/fixture-row';
import { LiveRefresh } from '@/components/matches/live-refresh';
export const metadata = { title: 'Matches' };
export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = matchFiltersSchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <section className="empty-state">
        <h1>Invalid match filters</h1>
        <p>Choose valid filters and a page number between 1 and 1000.</p>
        <Link className="button" href="/matches">
          Clear filters
        </Link>
      </section>
    );
  const filters = parsed.data;
  const [catalog, fixtures] = await Promise.all([
    sportsService.getCatalog(),
    sportsService.getFixtures(toMatchQuery(filters, new Date())),
  ]);
  const competitions = new Map(
    catalog.data.competitions.map((c) => [c.id, c.name]),
  );
  return (
    <section className="section sports-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow accent">THE MATCHDAY DESK</p>
          <h1>Matches</h1>
        </div>
        <LiveRefresh
          enabled={
            !fixtures.provenance.isDemo &&
            (filters.view === 'live' ||
              fixtures.data.items.some((m) => m.state === 'live'))
          }
        />
      </div>
      <p className="data-notice">{fixtures.provenance.label}</p>
      <MatchFilters
        key={matchesHref(filters)}
        filters={filters}
        sports={catalog.data.sports}
        competitions={catalog.data.competitions}
      />
      <p className="results-count">
        {fixtures.data.total} matches · Page {filters.page} · Times in UTC
      </p>
      {fixtures.data.items.length ? (
        catalog.data.sports.map((sport) => {
          const matches = fixtures.data.items.filter(
            (match) => match.sportId === sport.id,
          );
          return matches.length > 0 ? (
            <section
              className="sport-group"
              key={sport.id}
              aria-labelledby={`sport-${sport.slug}`}
            >
              <h2 id={`sport-${sport.slug}`}>{sport.name}</h2>
              <ul className="fixture-list">
                {matches.map((match) => (
                  <FixtureRow
                    key={match.id}
                    match={match}
                    competition={
                      competitions.get(match.competitionId) ??
                      'Competition unavailable'
                    }
                    isDemo={fixtures.provenance.isDemo}
                  />
                ))}
              </ul>
            </section>
          ) : null;
        })
      ) : (
        <div className="match-empty">
          <h2>No matches found</h2>
          <p>
            Try another date, sport or competition. Demo fixtures use fixed
            dates in September 2026.
          </p>
          <Link className="text-link" href="/matches">
            View all demo fixtures →
          </Link>
        </div>
      )}
      <nav aria-label="Match pagination" className="match-pagination">
        {filters.page > 1 && (
          <Link
            className="button secondary"
            href={matchesHref(filters, filters.page - 1)}
          >
            Previous page
          </Link>
        )}
        {fixtures.data.offset + fixtures.data.limit < fixtures.data.total && (
          <Link
            className="button secondary"
            href={matchesHref(filters, filters.page + 1)}
          >
            Next page
          </Link>
        )}
      </nav>
    </section>
  );
}
