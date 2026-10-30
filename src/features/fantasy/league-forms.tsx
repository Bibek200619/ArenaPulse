'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createFantasyLeague,
  joinFantasyLeague,
  type FantasyLeagueActionState,
} from './league-actions';
import type {
  FantasyCompetitionSummary,
  FantasyLeagueSummary,
} from './repository';

export function FantasyLeagueManager({
  competitions,
  leagues,
}: {
  competitions: FantasyCompetitionSummary[];
  leagues: FantasyLeagueSummary[];
}) {
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState<
    FantasyLeagueActionState,
    FormData
  >(createFantasyLeague, {});
  const [joinState, joinAction, joinPending] = useActionState<
    FantasyLeagueActionState,
    FormData
  >(joinFantasyLeague, {});

  useEffect(() => {
    if (joinState.leagueId)
      router.push(`/fantasy/leagues/${joinState.leagueId}`);
  }, [joinState.leagueId, router]);

  return (
    <section
      className="fantasy-leagues"
      aria-labelledby="fantasy-leagues-title"
    >
      <div>
        <p className="eyebrow">PRIVATE GROUPS</p>
        <h2 id="fantasy-leagues-title">Your fantasy leagues</h2>
        <p className="muted">
          Create a private league or join one with an invitation code. Save a
          squad in that competition first.
        </p>
      </div>
      {leagues.length ? (
        <ul className="fantasy-league-list">
          {leagues.map((league) => (
            <li key={league.id}>
              <Link href={`/fantasy/leagues/${league.id}`}>
                <strong>{league.name}</strong>
                <span className="muted">{league.competitionName}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" role="status">
          You have not joined a private league yet.
        </p>
      )}
      <div className="fantasy-league-forms">
        <form action={createAction} className="fantasy-league-form">
          <h3>Create a private league</h3>
          <label>
            Competition
            <select name="competitionId" required defaultValue="">
              <option value="" disabled>
                Choose a competition
              </option>
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} · {competition.sportName}
                </option>
              ))}
            </select>
          </label>
          <label>
            League name
            <input name="name" minLength={3} maxLength={60} required />
          </label>
          {createState.error && (
            <p className="form-error" role="alert">
              {createState.error}
            </p>
          )}
          {createState.success && createState.inviteCode && (
            <div className="form-success" role="status">
              <p>{createState.success}</p>
              <code className="fantasy-invite-code">
                {createState.inviteCode}
              </code>
              {createState.leagueId && (
                <Link href={`/fantasy/leagues/${createState.leagueId}`}>
                  Open leaderboard
                </Link>
              )}
            </div>
          )}
          <button className="button" disabled={createPending}>
            {createPending ? 'Creating…' : 'Create private league'}
          </button>
        </form>
        <form action={joinAction} className="fantasy-league-form">
          <h3>Join a private league</h3>
          <label>
            Invitation code
            <input
              name="inviteCode"
              autoComplete="off"
              minLength={32}
              maxLength={32}
              required
            />
          </label>
          {joinState.error && (
            <p className="form-error" role="alert">
              {joinState.error}
            </p>
          )}
          <button className="button secondary" disabled={joinPending}>
            {joinPending ? 'Joining…' : 'Join league'}
          </button>
        </form>
      </div>
    </section>
  );
}
