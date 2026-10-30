import Link from 'next/link';
import { isAuthConfigured } from '@/lib/supabase/config';
import { serverClient } from '@/lib/supabase/server';
import { listFantasyCompetitions } from '@/features/fantasy/repository';

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
  try {
    competitions = await listFantasyCompetitions(await serverClient());
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
      <p className="eyebrow">PHASE 8 · RULES, GAMEWEEKS, SQUADS</p>
      <h1>Fantasy competitions</h1>
      <p className="muted fantasy-intro">
        Build a squad under each competition’s published rules. Picks lock at
        the listed gameweek deadline.
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
      <p className="muted fantasy-demo-note">
        Player prices and schedules are clearly labeled demo examples. This
        milestone does not include scoring or money prizes.
      </p>
    </main>
  );
}
