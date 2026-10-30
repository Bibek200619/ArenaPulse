'use client';
import { startTransition, useEffect, useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { saveFantasySquad, type FantasyActionState } from './actions';
import type { FantasyCompetitionDetail } from './repository';

export function FantasySquadBuilder({
  competition,
}: {
  competition: FantasyCompetitionDetail;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FantasyActionState, FormData>(
    saveFantasySquad,
    {},
  );
  const [selectedIds, setSelectedIds] = useState(competition.draft.playerIds);
  const [captainId, setCaptainId] = useState(competition.draft.captainPlayerId);
  const [viceCaptainId, setViceCaptainId] = useState(
    competition.draft.viceCaptainPlayerId,
  );
  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);
  const selectedPlayers = competition.players.filter((player) =>
    selectedIds.includes(player.id),
  );
  const total = selectedPlayers.reduce((sum, player) => sum + player.price, 0);
  const togglePlayer = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((playerId) => playerId !== id)
        : [...current, id],
    );
    if (id === captainId) setCaptainId('');
    if (id === viceCaptainId) setViceCaptainId('');
  };

  return (
    <form
      className="fantasy-builder"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
    >
      <input type="hidden" name="competitionId" value={competition.id} />
      <input type="hidden" name="gameweekId" value={competition.gameweek!.id} />
      <input type="hidden" name="ruleVersion" value={competition.ruleVersion} />
      <div className="fantasy-summary" aria-live="polite">
        <span>
          Players{' '}
          <strong>
            {selectedIds.length}/{competition.squadSize}
          </strong>
        </span>
        <span>
          Budget{' '}
          <strong>
            {total.toFixed(1)}/{competition.budget} credits
          </strong>
        </span>
        <span>Max {competition.teamCap} per club</span>
      </div>
      {Object.entries(competition.positionLimits).map(([position, bounds]) => {
        const players = competition.players.filter(
          (player) => player.position === position,
        );
        return (
          <fieldset className="fantasy-position" key={position}>
            <legend>
              {position}{' '}
              <span>
                {bounds.min === bounds.max
                  ? bounds.min
                  : `${bounds.min}–${bounds.max}`}{' '}
                required
              </span>
            </legend>
            <div className="fantasy-player-list">
              {players.map((player) => (
                <label className="fantasy-player" key={player.id}>
                  <input
                    type="checkbox"
                    name="playerId"
                    value={player.id}
                    checked={selectedIds.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                  />
                  <span>
                    <strong>{player.name}</strong>
                    <small>{player.teamName}</small>
                  </span>
                  <span>{player.price.toFixed(1)}</span>
                </label>
              ))}
              {!players.length && (
                <p className="muted">
                  No players are available in this position.
                </p>
              )}
            </div>
          </fieldset>
        );
      })}
      <div className="fantasy-captains">
        <label>
          Captain ({competition.captainMultiplier}× points)
          <select
            name="captainPlayerId"
            value={selectedIds.includes(captainId) ? captainId : ''}
            required
            onChange={(event) => setCaptainId(event.target.value)}
          >
            <option value="">Choose a selected player</option>
            {selectedPlayers.map((player) => (
              <option value={player.id} key={player.id}>
                {player.name} · {player.position}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vice-captain ({competition.viceCaptainMultiplier}× points)
          <select
            name="viceCaptainPlayerId"
            value={selectedIds.includes(viceCaptainId) ? viceCaptainId : ''}
            required
            onChange={(event) => setViceCaptainId(event.target.value)}
          >
            <option value="">Choose a different selected player</option>
            {selectedPlayers.map((player) => (
              <option
                value={player.id}
                key={player.id}
                disabled={player.id === captainId}
              >
                {player.name} · {player.position}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        You can make up to {competition.transfersPerGameweek} transfers from
        your latest saved gameweek. Player credits and fixtures are demo
        examples.
      </p>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? 'Saving squad…' : 'Save squad'}
      </button>
      <button
        type="button"
        className="button secondary button-small"
        disabled={pending}
        onClick={() => {
          setSelectedIds([]);
          setCaptainId('');
          setViceCaptainId('');
        }}
      >
        Clear picks
      </button>
    </form>
  );
}
