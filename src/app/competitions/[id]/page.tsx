import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sportsService } from '@/services/sports/service';
import { FollowControl } from '@/features/follows/controls';
import { EntityMatches } from '@/components/sports/entity-matches';
import { MatchStandings } from '@/components/matches/match-detail';
export const metadata = { title: 'Competition profile' };
export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalog = await sportsService.getCatalog();
  const competition = catalog.data.competitions.find((c) => c.id === id);
  if (!competition) notFound();
  const [matches, standings] = await Promise.all([
    sportsService.getFixtures({ competitionId: id, offset: 0, limit: 20 }),
    sportsService.getStandings(id),
  ]);
  const teams = catalog.data.teams.filter((t) =>
    matches.data.items.some((m) =>
      m.participants.some((p) => p.kind === 'team' && p.entityId === t.id),
    ),
  );
  return (
    <article className="section sports-page entity-detail">
      <Link className="text-link" href="/competitions">
        ← All competitions
      </Link>
      <div className="entity-heading">
        <div>
          <p className="eyebrow accent">{competition.country}</p>
          <h1>{competition.name}</h1>
        </div>
      </div>
      <FollowControl kind="competition" id={id} name={competition.name} />
      <p className="data-notice">{catalog.provenance.label}</p>
      <p className="entity-season">
        {catalog.data.seasons.find((s) => s.id === competition.seasonId)
          ?.name ?? 'Season unavailable'}
      </p>
      <EntityMatches
        matches={matches.data.items}
        competitions={catalog.data.competitions}
        isDemo={matches.provenance.isDemo}
      />
      <MatchStandings standings={standings.data} teams={catalog.data.teams} />
      {teams.length > 0 && (
        <section className="match-section">
          <h2>Participating teams</h2>
          <ul className="entity-links">
            {teams.map((t) => (
              <li key={t.id}>
                <Link href={`/teams/${t.id}`}>
                  {t.name}
                  <span>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="match-section">
        <h2>Top performers</h2>
        <p className="muted">
          Individual competition statistics are not available yet.
        </p>
      </section>
      <section className="match-section">
        <h2>Fantasy competitions</h2>
        <p className="muted">No fantasy competition is linked yet.</p>
      </section>
    </article>
  );
}
