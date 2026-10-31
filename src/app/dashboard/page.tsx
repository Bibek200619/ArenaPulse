import Link from 'next/link';
import { requireUser } from '@/features/auth/session';
import { readPosts } from '@/features/social/repository';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your dashboard' };

export default async function DashboardPage() {
  const { client, user } = await requireUser();
  const [profileResult, preferenceResult, communityResult, leagueResult] =
    await Promise.all([
      client
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle(),
      client
        .from('profile_preferences')
        .select('favorite_sports')
        .eq('user_id', user.id)
        .maybeSingle(),
      client
        .from('community_members')
        .select(
          'community:communities!community_members_community_id_fkey(id,name,slug)',
        )
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(6),
      client
        .from('fantasy_league_members')
        .select('league:fantasy_leagues(id,name)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(6),
    ]);
  let feed: Awaited<ReturnType<typeof readPosts>> = [];
  try {
    feed = await readPosts(client, 1, { following: user.id });
  } catch {
    // An empty state is safe when the follow feed cannot be loaded.
  }
  const communities = (communityResult.data ?? [])
    .map((row) =>
      Array.isArray(row.community) ? row.community[0] : row.community,
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const leagues = (leagueResult.data ?? [])
    .map((row) => (Array.isArray(row.league) ? row.league[0] : row.league))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const name = profileResult.data?.display_name ?? 'Fan';
  const sports = preferenceResult.data?.favorite_sports ?? [];

  return (
    <div className="section dashboard-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL MATCHDAY</p>
          <h1>Welcome back, {name}</h1>
          <p>
            Your feed and communities are based on your follows and memberships.
          </p>
        </div>
        <Link className="button" href="/notifications">
          Open notifications
        </Link>
      </div>
      <section className="dashboard-summary" aria-label="Your interests">
        <div>
          <span className="eyebrow">SPORTS YOU FOLLOW</span>
          <strong>
            {sports.length ? sports.join(' · ') : 'Choose your sports'}
          </strong>
          <Link href="/settings/sports">Edit sports →</Link>
        </div>
        <div>
          <span className="eyebrow">YOUR COMMUNITIES</span>
          <strong>{communities.length}</strong>
          <Link href="/communities?view=mine">View communities →</Link>
        </div>
        <div>
          <span className="eyebrow">PRIVATE LEAGUES</span>
          <strong>{leagues.length}</strong>
          <Link href="/fantasy">View fantasy →</Link>
        </div>
      </section>
      <section className="dashboard-columns">
        <div className="notification-panel">
          <div className="section-heading compact-heading">
            <h2>From people you follow</h2>
            <Link href="/feed">Open feed →</Link>
          </div>
          {feed.length ? (
            <ul className="dashboard-feed">
              {feed.slice(0, 6).map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`}>
                    <strong>{post.author?.display_name ?? 'A fan'}</strong>
                    <span>{post.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Follow fans to see their latest public posts here.
            </p>
          )}
        </div>
        <div className="notification-panel">
          <div className="section-heading compact-heading">
            <h2>Your communities</h2>
            <Link href="/communities?view=mine">Browse →</Link>
          </div>
          {communities.length ? (
            <ul className="dashboard-links">
              {communities.map((community) => (
                <li key={community.id}>
                  <Link href={`/communities/${community.id}`}>
                    {community.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Join a community to bring its discussions into your matchday.
            </p>
          )}
        </div>
      </section>
      {leagues.length > 0 && (
        <section className="notification-panel">
          <h2>Your fantasy leagues</h2>
          <ul className="dashboard-links">
            {leagues.map((league) => (
              <li key={league.id}>
                <Link href={`/fantasy/leagues/${league.id}`}>
                  {league.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
