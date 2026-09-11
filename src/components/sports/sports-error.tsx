'use client';
export function SportsError({ retry }: { retry: () => void }) {
  return (
    <section className="empty-state">
      <h1>Sports data unavailable</h1>
      <p role="alert">
        This page could not be loaded. Please try again shortly.
      </p>
      <button className="button" onClick={retry}>
        Try again
      </button>
    </section>
  );
}
