import Link from 'next/link';
import { isAuthConfigured } from '@/lib/supabase/config';
import { serverClient } from '@/lib/supabase/server';
import { FantasyLeagueManager } from '@/features/fantasy/league-forms';
import {
  listFantasyCompetitions,
  listFantasyLeagues,
} from '@/features/fantasy/repository';

export const metadata = { title: 'Fantasy competitions' };

export default async function FantasyPage() {
  if (!isAuthConfigured())
    return (
      <main className="section-page fantasy-page">
        <p className="eyebrow">BUILD YOUR SQUAD</p>
        <h1>Fantasy competitions</h1>
        <p className="muted">
          Fantasy competitions need the ArenaPulse data service to be
          configured.
        </p>
      </main>
    );
  let competitions;
  let signedIn = false;
  let leagues: Awaited<ReturnType<typeof listFantasyLeagues>> = [];
  try {
    const client = await serverClient();
    competitions = await listFantasyCompetitions(client);
    const auth = await client.auth.getUser();
    signedIn = Boolean(auth.data.user);
    if (signedIn) leagues = await listFantasyLeagues(client);
  } catch {
    return (
      <main className="section-page fantasy-page">
        <p className="eyebrow">BUILD YOUR SQUAD</p>
        <h1>Fantasy competitions</h1>
        <p className="form-error" role="alert">
          Competitions are temporarily unavailable. Please try again later.
        </p>
      </main>
    );
  }
  return (
    <main className="section-page fantasy-page">
      <p className="eyebrow">FANTASY COMPETITIONS</p>
      <h1>Fantasy competitions</h1>
      <p className="muted fantasy-intro">
        Build a squad, join private leagues and follow your gameweek points.
        Picks lock at the listed deadline.
      </p>
      {!competitions.length ? (
        <p className="muted" role="status">
          No fantasy competitions are open right now.
        </p>
      ) : (
        <div className="fantasy-competition-grid">
          {competitions.map((competition) => (
            <article className="fantasy-competition-card" key={competition.id}>
              <p className="eyebrow">{competition.sportName}</p>
              <h2>{competition.name}</h2>
              <Link
                className="button secondary button-small"
                href={`/fantasy/${competition.id}`}
              >
                Build squad
              </Link>
            </article>
          ))}
        </div>
      )}
      {signedIn ? (
        <FantasyLeagueManager competitions={competitions} leagues={leagues} />
      ) : (
        <section className="fantasy-leagues">
          <h2>Private leagues</h2>
          <p className="muted">
            Sign in and save a squad to create or join a private league.
          </p>
          <Link className="button secondary button-small" href="/login">
            Sign in
          </Link>
        </section>
      )}
      <p className="muted fantasy-demo-note">
        Player prices, schedules and scoring rules are demo examples. There are
        no prizes or real-money features.
      </p>
    </main>
  );
}
