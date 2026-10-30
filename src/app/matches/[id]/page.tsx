import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppError } from '@/lib/errors';
import { sportsService } from '@/services/sports/service';
import { formatMatchTime } from '@/features/matches/filters';
import {
  MatchTimeline,
  MatchStatistics,
  MatchLineups,
  MatchStandings,
} from '@/components/matches/match-detail';
import { LiveRefresh } from '@/components/matches/live-refresh';
import { serverClient } from '@/lib/supabase/server';
import { getMatchDiscussion } from '@/features/matches/discussion';
import { MatchDiscussion } from '@/features/matches/match-discussion';
import { isAuthConfigured } from '@/lib/supabase/config';
import { SportScoreAttribution } from '@/components/matches/sportscore-attribution';
export const metadata = { title: 'Match centre' };
export const dynamic = 'force-dynamic';
export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ discussionPage?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const result = await sportsService.getMatch(id).catch((error: unknown) => {
    if (
      error instanceof AppError &&
      ['NOT_FOUND', 'VALIDATION_ERROR'].includes(error.code)
    )
      notFound();
    throw error;
  });
  const match = result.data;
  const page = Math.max(
    0,
    Math.min(1000, Number.parseInt(query.discussionPage ?? '0', 10) || 0),
  );
  const client = isAuthConfigured() ? await serverClient() : null;
  const {
    data: { user },
  } = client ? await client.auth.getUser() : { data: { user: null } };
  const discussion = await getMatchDiscussion(id, page);
  const [catalog, venue, standings] = await Promise.all([
  const [catalog, venue] = await Promise.all([
    sportsService.getCatalog(),
    match.venueId ? sportsService.getVenue(match.venueId) : null,
  ]);
  const standings = match.competitionName
    ? null
    : await sportsService.getStandings(match.competitionId);
  const competition = catalog.data.competitions.find(
    (c) => c.id === match.competitionId,
  );
  return (
    <article className="section sports-page match-detail">
      <Link className="text-link" href="/matches">
        ← All matches
      </Link>
      <p className="eyebrow accent match-competition">
        {match.competitionName ??
          competition?.name ??
          'Competition unavailable'}
      </p>
      <h1>
        {match.participants.map((participant) => participant.name).join(' vs ')}
      </h1>
      <p className="data-notice">{result.provenance.label}</p>
      {result.provenance.source === 'sportscore-football-v1' && (
        <SportScoreAttribution />
      )}
      <section className="match-scoreboard" aria-label="Scoreboard">
        {match.participants.map((participant) => (
          <div key={participant.id}>
            <h2>{participant.name}</h2>
            <strong>{participant.score ?? '—'}</strong>
            {participant.winner && <span className="accent">Winner</span>}
          </div>
        ))}
      </section>
      <div className="match-summary">
        <p className="fixture-state">
          {match.state === 'live'
            ? `In progress${result.provenance.isDemo ? ' · Demo' : ''}`
            : match.state}{' '}
          {match.clock}
        </p>
        <LiveRefresh
          enabled={match.state === 'live' && !result.provenance.isDemo}
        />
      </div>
      <dl className="match-facts">
        <div>
          <dt>Start time</dt>
          <dd>
            <time dateTime={match.startsAt}>
              {formatMatchTime(match.startsAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt>Venue</dt>
          <dd>
            {venue
              ? `${venue.data.name}, ${venue.data.city}`
              : 'Venue not available'}
          </dd>
        </div>
        <div>
          <dt>Season</dt>
          <dd>
            {match.competitionName
              ? 'Not provided by SportScore'
              : (catalog.data.seasons.find(
                  (season) => season.id === match.seasonId,
                )?.name ?? 'Season unavailable')}
          </dd>
        </div>
      </dl>
      {result.provenance.isDemo && (
        <p className="muted detail-note">
          Demo events, statistics and lineups are illustrative subsets, not
          complete match records.
        </p>
      )}
      <MatchTimeline match={match} />
      <MatchStatistics match={match} />
      <MatchLineups match={match} players={catalog.data.players} />
      <MatchStandings standings={standings.data} teams={catalog.data.teams} />
      <MatchDiscussion
        matchId={id}
        userId={user?.id ?? null}
        realtimeEnabled={isAuthConfigured()}
        isModerator={['moderator', 'admin'].includes(
          String(user?.app_metadata.role ?? ''),
        )}
        {...discussion}
        page={page}
      />
      {standings && (
        <MatchStandings standings={standings.data} teams={catalog.data.teams} />
      )}
      <section className="match-section">
        <h2>Fan discussion</h2>
        <p className="muted">
          Match discussions are coming in a later milestone.
        </p>
      </section>
      <section className="match-section">
        <h2>Fantasy relevance</h2>
        <p className="muted">
          No fantasy competition is linked to this match yet.
        </p>
      </section>
    </article>
  );
}
