export function SportsLoading() {
  return (
    <section
      className="section sports-page"
      aria-live="polite"
      aria-busy="true"
    >
      <h1>Loading sports…</h1>
      <p className="muted">Getting the available sports records.</p>
    </section>
  );
}
