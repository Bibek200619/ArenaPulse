import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FantasySquadBuilder } from '@/features/fantasy/forms';
import { getFantasyCompetition } from '@/features/fantasy/repository';
import { isAuthConfigured } from '@/lib/supabase/config';
import { serverClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Build your fantasy squad',
  robots: { index: false, follow: false },
};

export default async function FantasyCompetitionPage({
  params,
}: PageProps<'/fantasy/[id]'>) {
  if (!isAuthConfigured())
    return (
      <main className="section-page fantasy-page">
        <h1>Fantasy squads are unavailable</h1>
        <p className="muted">
          The data service is not configured. Return when account services are
          available.
        </p>
      </main>
    );
  const { id } = await params;
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  let competition;
  try {
    competition = await getFantasyCompetition(client, id, user?.id ?? null);
  } catch {
    return (
      <main className="section-page fantasy-page">
        <p className="eyebrow">FANTASY</p>
        <h1>Squad unavailable</h1>
        <p role="alert" className="form-error">
          We could not load this competition. Refresh the page and try again.
        </p>
      </main>
    );
  }
  if (!competition) notFound();
  return (
    <main className="section-page fantasy-page">
      <Link className="text-link" href="/fantasy">
        ← All fantasy competitions
      </Link>
      <p className="eyebrow fantasy-kicker">
        {competition.sportName} · {competition.name}
      </p>
      <h1>Build your squad</h1>
      <p className="muted fantasy-intro">
        Rule version {competition.ruleVersion} · {competition.squadSize} players
        · {competition.budget} credits · max {competition.teamCap} per team
      </p>
      {competition.gameweek ? (
        <>
          <section
            className="fantasy-deadline"
            aria-labelledby="fantasy-gameweek"
          >
            <div>
              <p className="eyebrow">CURRENT PICK WINDOW</p>
              <h2 id="fantasy-gameweek">
                {competition.gameweek.name} · #{competition.gameweek.number}
              </h2>
            </div>
            <p>
              Deadline{' '}
              <time dateTime={competition.gameweek.deadlineAt}>
                {new Date(competition.gameweek.deadlineAt).toLocaleString(
                  'en',
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'UTC',
                    timeZoneName: 'short',
                  },
                )}
              </time>
            </p>
          </section>
          {user ? (
            <FantasySquadBuilder competition={competition} />
          ) : (
            <section className="fantasy-sign-in">
              <h2>Sign in to save your squad</h2>
              <p className="muted">
                You can review the rules and player pool, then sign in to save a
                private squad.
              </p>
              <Link className="button" href="/login">
                Sign in
              </Link>
            </section>
          )}
        </>
      ) : (
        <section className="fantasy-deadline" role="status">
          <h2>No open gameweek</h2>
          <p className="muted">
            Squad submissions are closed until the next gameweek opens.
          </p>
        </section>
      )}
      <p className="muted fantasy-demo-note">
        Fantasy prices, player pools and deadlines are demo examples. No live
        statistics or prizes are included in this phase.
      </p>
    </main>
  );
}
