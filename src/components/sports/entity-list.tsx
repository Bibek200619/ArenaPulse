import Link from 'next/link';
export function EntityList({
  title,
  description,
  source,
  items,
}: {
  title: string;
  description: string;
  source: string;
  items: {
    id: string;
    name: string;
    description: string;
    href: string;
    badge: string;
  }[];
}) {
  return (
    <section className="section sports-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow accent">FIND YOUR SIDE</p>
          <h1>{title}</h1>
        </div>
        <p>{description}</p>
      </div>
      <p className="data-notice">{source}</p>
      <ul className="entity-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href}>
              <span className="entity-badge" aria-hidden="true">
                {item.badge}
              </span>
              <div>
                <h2>{item.name}</h2>
                <p className="muted">{item.description}</p>
              </div>
              <span className="accent" aria-hidden="true">
                ↗
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="match-empty">No records are available.</p>
      )}
    </section>
  );
}
