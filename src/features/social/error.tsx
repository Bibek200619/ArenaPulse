'use client';
export function SocialError({ retry }: { retry: () => void }) {
  return (
    <section className="empty-state">
      <h1>The crowd is taking a break.</h1>
      <p role="alert">We could not load this page. Please try again.</p>
      <button className="button" onClick={retry}>
        Try again
      </button>
    </section>
  );
}
