'use client';
export default function MatchError({ retry }: { retry: () => void }) {
  return (
    <section className="empty-state">
      <h1>Matches unavailable</h1>
      <p role="alert">
        Sports data could not be loaded. Please try again shortly.
      </p>
      <button className="button" onClick={retry}>
        Try again
      </button>
    </section>
  );
}
