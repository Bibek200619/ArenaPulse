import type { Match, Player, Standing, Team } from '@/features/sports/types';
export function MatchTimeline({ match }: { match: Match }) {
  return (
    <section className="match-section">
      <h2>Timeline</h2>
      {match.events.length ? (
        <ol className="match-timeline">
          {match.events
            .toSorted((a, b) => a.sequence - b.sequence)
            .map((event) => (
              <li key={event.id}>
                <strong>{event.clock}</strong>
                <div>
                  <p>{event.description}</p>
                  <small className="muted">
                    {event.period.replaceAll('_', ' ')}
                  </small>
                </div>
              </li>
            ))}
        </ol>
      ) : (
        <p className="muted">No event timeline is available for this match.</p>
      )}
    </section>
  );
}
export function MatchStatistics({ match }: { match: Match }) {
  return (
    <section className="match-section">
      <h2>Statistics</h2>
      {match.statistics.length ? (
        <div className="table-scroll">
          <table>
            <caption>Available participant statistics</caption>
            <thead>
              <tr>
                <th scope="col">Participant</th>
                <th scope="col">Statistic</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {match.statistics.map((stat) => (
                <tr key={`${stat.participantId}:${stat.code}`}>
                  <th scope="row">
                    {match.participants.find((p) => p.id === stat.participantId)
                      ?.name ?? 'Unknown participant'}
                  </th>
                  <td>{stat.label}</td>
                  <td>
                    {stat.value}
                    {stat.unit ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No statistics are available for this match.</p>
      )}
    </section>
  );
}
export function MatchLineups({
  match,
  players,
}: {
  match: Match;
  players: Player[];
}) {
  const names = new Map(players.map((p) => [p.id, p.name]));
  return (
    <section className="match-section">
      <h2>Lineups</h2>
      {match.lineups.length ? (
        <div className="lineup-grid">
          {match.participants.map((participant) => (
            <div key={participant.id}>
              <h3>{participant.name}</h3>
              <ul>
                {match.lineups
                  .filter((entry) => entry.participantId === participant.id)
                  .map((entry) => (
                    <li key={entry.playerId}>
                      <span>
                        {names.get(entry.playerId) ?? 'Player unavailable'}
                      </span>
                      <small className="muted">
                        {entry.position} ·{' '}
                        {entry.starter ? 'Starter' : 'Substitute'}
                      </small>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Lineups are not available for this match.</p>
      )}
    </section>
  );
}
export function MatchStandings({
  standings,
  teams,
}: {
  standings: Standing[];
  teams: Team[];
}) {
  const names = new Map(teams.map((team) => [team.id, team.name]));
  return (
    <section className="match-section">
      <h2>Competition standings</h2>
      {standings.length ? (
        <div className="table-scroll">
          <table>
            <caption>Available season standings</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Team</th>
                <th scope="col">Played</th>
                <th scope="col">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.teamId}>
                  <td>{row.rank}</td>
                  <th scope="row">
                    {names.get(row.teamId) ?? 'Team unavailable'}
                  </th>
                  <td>{row.played}</td>
                  <td>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">
          Standings are not available for this competition.
        </p>
      )}
    </section>
  );
}
