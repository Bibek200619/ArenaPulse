import Link from 'next/link';
import { sportsService } from '@/services/sports/service';
import { entityNotFound } from '@/features/sports/not-found';
import { FollowControl } from '@/features/follows/controls';
import { EntityMatches } from '@/components/sports/entity-matches';
export const metadata = { title: 'Player profile' };
export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await sportsService.getPlayer(id).catch(entityNotFound);
  const [catalog, matches] = await Promise.all([
    sportsService.getCatalog(),
    sportsService.getFixtures({ playerId: id, offset: 0, limit: 20 }),
  ]);
  const team = catalog.data.teams.find((t) => t.id === player.data.teamId);
  return (
    <article className="section sports-page entity-detail">
      <Link className="text-link" href="/players">
        ← All players
      </Link>
      <div className="entity-heading">
        <span className="entity-badge large" aria-hidden="true">
          {player.data.name
            .split(' ')
            .map((word) => word[0])
            .join('')}
        </span>
        <div>
          <p className="eyebrow accent">
            {
              catalog.data.sports.find((s) => s.id === player.data.sportId)
                ?.name
            }
          </p>
          <h1>{player.data.name}</h1>
        </div>
      </div>
      <FollowControl kind="player" id={id} name={player.data.name} />
      <p className="data-notice">{player.provenance.label}</p>
      <dl className="match-facts">
        <div>
          <dt>Position</dt>
          <dd>{player.data.position}</dd>
        </div>
        <div>
          <dt>Nationality</dt>
          <dd>{player.data.nationality}</dd>
        </div>
        <div>
          <dt>Team</dt>
          <dd>
            {team ? (
              <Link className="text-link" href={`/teams/${team.id}`}>
                {team.name} →
              </Link>
            ) : (
              'Individual competitor'
            )}
          </dd>
        </div>
      </dl>
      <section className="match-section">
        <h2>Season performance</h2>
        <p className="muted">
          Complete individual season statistics are not available in this
          dataset. Sample appearances below link to the available match records.
        </p>
      </section>
      <EntityMatches
        matches={matches.data.items}
        competitions={catalog.data.competitions}
        isDemo={matches.provenance.isDemo}
        title="Available match history"
      />
    </article>
  );
}
