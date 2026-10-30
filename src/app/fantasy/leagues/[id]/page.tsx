import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFantasyLeague } from '@/features/fantasy/repository';
import { isAuthConfigured } from '@/lib/supabase/config';
import { serverClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Private fantasy league',
  robots: { index: false, follow: false },
};

export default async function FantasyLeaguePage({
  params,
}: PageProps<'/fantasy/leagues/[id]'>) {
  if (!isAuthConfigured()) notFound();
  const { id } = await params;
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) notFound();

  let league;
  try {
    league = await getFantasyLeague(client, id, user.id);
  } catch {
    return (
      <main className="section-page fantasy-page">
        <p className="eyebrow">PRIVATE FANTASY LEAGUE</p>
        <h1>League unavailable</h1>
        <p className="form-error" role="alert">
          We could not load this league. Refresh the page and try again.
        </p>
      </main>
    );
  }
  if (!league) notFound();

  return (
    <main className="section-page fantasy-page">
      <Link className="text-link" href="/fantasy">
        ← Fantasy competitions
      </Link>
      <p className="eyebrow fantasy-kicker">
        PRIVATE LEAGUE · {league.competitionName}
      </p>
      <h1>{league.name}</h1>
      <p className="muted fantasy-intro">
        This league and its leaderboard are visible only to members.
        {league.isOwner
          ? ' Share the invitation code you received when creating the league.'
          : ''}
      </p>
      <section
        className="fantasy-leaderboard"
        aria-labelledby="leaderboard-title"
      >
        <h2 id="leaderboard-title">Leaderboard</h2>
        {league.leaderboard.length ? (
          <div className="table-scroll">
            <table>
              <caption>Gameweek {league.leaderboard[0].gameweekNumber}</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Fan</th>
                  <th scope="col">Squad</th>
                  <th scope="col">Points</th>
                </tr>
              </thead>
              <tbody>
                {league.leaderboard.map((row, index) => (
                  <tr key={`${row.rank}-${row.displayName}-${index}`}>
                    <td>{row.rank}</td>
                    <td>{row.displayName}</td>
                    <td>{row.teamName}</td>
                    <td>{row.totalPoints.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted" role="status">
            The leaderboard will appear after the first gameweek is scored.
          </p>
        )}
      </section>
    </main>
  );
}
