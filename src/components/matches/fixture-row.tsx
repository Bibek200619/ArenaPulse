import Link from 'next/link';
import type { Match } from '@/features/sports/types';
import { formatMatchTime } from '@/features/matches/filters';
export function FixtureRow({
  match,
  competition,
  isDemo,
}: {
  match: Match;
  competition: string;
  isDemo: boolean;
}) {
  return (
    <li>
      <Link
        className="fixture-row"
        href={`/matches/${match.id}`}
        aria-label={`${match.participants.map((p) => p.name).join(' vs ')} — ${match.state} — ${formatMatchTime(match.startsAt)}`}
      >
        <div className="fixture-context">
          <span>{competition}</span>
          <time dateTime={match.startsAt}>
            {formatMatchTime(match.startsAt)}
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
        <div className="fixture-state">
          {match.state === 'live'
            ? `In progress${isDemo ? ' · Demo' : ''}`
            : match.state}
          <span>{match.clock}</span>
          <span className="accent">Match details →</span>
        </div>
      </Link>
    </li>
  );
}
