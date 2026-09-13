import Link from 'next/link';
import { sportsService } from '@/services/sports/service';
import { entityNotFound } from '@/features/sports/not-found';
import { FollowControl } from '@/features/follows/controls';
import { EntityMatches } from '@/components/sports/entity-matches';
import { MatchStandings } from '@/components/matches/match-detail';
export const metadata = { title: 'Team profile' };
export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await sportsService.getTeam(id).catch(entityNotFound);
  const [catalog, matches] = await Promise.all([
    sportsService.getCatalog(),
    sportsService.getFixtures({ teamId: id, offset: 0, limit: 20 }),
  ]);
  const competitions = catalog.data.competitions.filter((c) =>
    matches.data.items.some((m) => m.competitionId === c.id),
  );
  const standings = await Promise.all(
    competitions.map((c) => sportsService.getStandings(c.id)),
  );
  const players = catalog.data.players.filter((p) => p.teamId === id);
  return (
    <article className="section sports-page entity-detail">
      <Link className="text-link" href="/teams">
        ← All teams
      </Link>
      <div className="entity-heading">
        <span
          className="entity-badge large"
          style={{ borderColor: team.data.color }}
          aria-hidden="true"
        >
          {team.data.shortName}
        </span>
        <div>
          <p className="eyebrow accent">{team.data.country}</p>
          <h1>{team.data.name}</h1>
        </div>
      </div>
      <FollowControl kind="team" id={id} name={team.data.name} />
      <p className="data-notice">{team.provenance.label}</p>
      <section className="match-section">
        <h2>Competitions</h2>
        {competitions.map((c) => (
          <p key={c.id}>
            <Link className="text-link" href={`/competitions/${c.id}`}>
              {c.name} →
            </Link>
          </p>
        ))}
      </section>
      <EntityMatches
        matches={matches.data.items.filter((m) => m.state === 'scheduled')}
        competitions={catalog.data.competitions}
        isDemo={matches.provenance.isDemo}
        title="Upcoming fixtures"
      />
      <EntityMatches
        matches={matches.data.items.filter((m) => m.state !== 'scheduled')}
        competitions={catalog.data.competitions}
        isDemo={matches.provenance.isDemo}
        title="Recent results and in-progress matches"
      />
      <section className="match-section">
        <h2>Available squad</h2>
        <p className="muted">The demo squad is a sample, not a full roster.</p>
        <ul className="entity-links">
          {players.map((p) => (
            <li key={p.id}>
              <Link href={`/players/${p.id}`}>
                {p.name}
                <span className="muted">{p.position}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {standings.map((s, i) => (
        <MatchStandings
          key={competitions[i].id}
          standings={s.data}
          teams={catalog.data.teams}
        />
      ))}
      <section className="match-section">
        <h2>Fan community</h2>
        <p className="muted">
          Related communities will appear when the community experience is
          available.
        </p>
      </section>
    </article>
  );
}
