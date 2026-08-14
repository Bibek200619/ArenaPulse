export default function LoadingMatches() {
  return (
    <section
      className="section sports-page"
      aria-live="polite"
      aria-busy="true"
    >
      <h1>Loading matches…</h1>
      <p className="muted">Getting the latest available sports data.</p>
    </section>
  );
}
