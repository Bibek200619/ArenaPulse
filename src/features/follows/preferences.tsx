import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/features/auth/session';
import { sportsService } from '@/services/sports/service';
import { readFollows } from './repository';
import { FollowButton } from './follow-button';
import { entityPaths } from './validation';
export async function SportsPreferences() {
  const { client, user } = await requireUser();
  const profile = await client
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (profile.error) throw new Error('Profile unavailable');
  if (!profile.data) redirect('/onboarding');
  const [catalog, teams, players, competitions] = await Promise.all([
    sportsService.getCatalog(),
    readFollows(client, user.id, 'team'),
    readFollows(client, user.id, 'player'),
    readFollows(client, user.id, 'competition'),
  ]);
  if (teams.error || players.error || competitions.error)
    throw new Error('Sports preferences unavailable');
  const groups = [
    {
      kind: 'team' as const,
      title: 'Favorite teams',
      items: catalog.data.teams,
      selected: new Set(
        (teams.data ?? []).flatMap((row) => Object.values(row)),
      ),
    },
    {
      kind: 'competition' as const,
      title: 'Favorite competitions',
      items: catalog.data.competitions,
      selected: new Set(
        (competitions.data ?? []).flatMap((row) => Object.values(row)),
      ),
    },
    {
      kind: 'player' as const,
      title: 'Favorite players (optional)',
      items: catalog.data.players,
      selected: new Set(
        (players.data ?? []).flatMap((row) => Object.values(row)),
      ),
    },
  ];
  return (
    <section className="section sports-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow accent">MAKE IT YOUR MATCHDAY</p>
          <h1>Your sports picks</h1>
        </div>
        <Link className="button" href="/profile">
          Continue to profile
        </Link>
      </div>
      <p className="muted">
        Pick a few favorites, or skip this step. Each change saves immediately.
        Your picks are private.
      </p>
      <p className="data-notice entity-season">{catalog.provenance.label}</p>
      {groups.map((group) => (
        <section key={group.kind} className="match-section">
          <h2>{group.title}</h2>
          <ul className="preference-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <Link href={`${entityPaths[group.kind]}/${item.id}`}>
                  {item.name}
                  <small className="preference-sport">
                    {
                      catalog.data.sports.find(
                        (sport) => sport.id === item.sportId,
                      )?.name
                    }
                  </small>
                </Link>
                <FollowButton
                  key={`${item.id}:${group.selected.has(item.id)}`}
                  kind={group.kind}
                  id={item.id}
                  name={
                    group.kind === 'player'
                      ? `${item.name} · ${catalog.data.sports.find((sport) => sport.id === item.sportId)?.name}`
                      : item.name
                  }
                  following={group.selected.has(item.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Link className="button" href="/profile">
        Finish sports picks
      </Link>
    </section>
  );
}
