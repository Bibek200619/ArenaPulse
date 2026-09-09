import { sportsService } from '@/services/sports/service';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Matches' };
export const revalidate = 30;
export default async function MatchesPage() {
  const result = await Promise.all([
    sportsService.getCatalog(),
    sportsService.getFixtures({ offset: 0, limit: 20 }),
  ]).catch(() => null);
  if (!result)
    return (
      <EmptyState
        title="Matches unavailable"
        description="Sports data could not be loaded. Please try again shortly."
      />
    );
  const [catalog, fixtures] = result;
  return (
    <section className="section sports-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow accent">THE MATCHDAY DESK</p>
          <h1>Matches</h1>
        </div>
        <p>Every sport. One place to start.</p>
      </div>
      <p className="data-notice">{fixtures.provenance.label}</p>
      {catalog.data.sports.map((sport) => {
        const matches = fixtures.data.items.filter(
          (match) => match.sportId === sport.id,
        );
        return (
          <section
            className="sport-group"
            key={sport.id}
            aria-labelledby={`sport-${sport.slug}`}
          >
            <h2 id={`sport-${sport.slug}`}>{sport.name}</h2>
            <ul className="fixture-list">
              {matches.map((match) => (
                <li key={match.id} className="fixture-row">
                  <div className="fixture-context">
                    <span>
                      {
                        catalog.data.competitions.find(
                          (competition) =>
                            competition.id === match.competitionId,
                        )?.name
                      }
                    </span>
                    <time dateTime={match.startsAt}>
                      {new Intl.DateTimeFormat('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      }).format(new Date(match.startsAt))}{' '}
                      UTC
                    </time>
                  </div>
                  <div className="fixture-participants">
                    {match.participants.map((participant) => (
                      <div key={participant.id}>
                        <span>{participant.name}</span>
                        <strong>{participant.score ?? '—'}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="fixture-state">
                    {match.state === 'live'
                      ? 'In progress · Demo'
                      : match.state}
                    <span>{match.clock}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {fixtures.data.total === 0 && <p>No fixtures are available.</p>}
    </section>
  );
}
