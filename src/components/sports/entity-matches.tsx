import type { Competition, Match } from '@/features/sports/types';
import { FixtureRow } from '@/components/matches/fixture-row';
export function EntityMatches({
  matches,
  competitions,
  isDemo,
  title = 'Available matches',
}: {
  matches: Match[];
  competitions: Competition[];
  isDemo: boolean;
  title?: string;
}) {
  const names = new Map(competitions.map((c) => [c.id, c.name]));
  return (
    <section className="match-section">
      <h2>{title}</h2>
      {matches.length ? (
        <ul className="fixture-list">
          {matches.map((match) => (
            <FixtureRow
              key={match.id}
              match={match}
              competition={
                names.get(match.competitionId) ?? 'Competition unavailable'
              }
              isDemo={isDemo}
            />
          ))}
        </ul>
      ) : (
        <p className="muted">No matching fixtures or results are available.</p>
      )}
    </section>
  );
}
