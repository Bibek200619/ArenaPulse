import Link from 'next/link';
import { Activity, ArrowUpRight, Menu } from 'lucide-react';

export const navigation = [
  ['Home', '/'],
  ['Matches', '/matches'],
  ['Competitions', '/competitions'],
  ['Teams', '/teams'],
  ['Players', '/players'],
  ['Fantasy', '/fantasy'],
  ['Communities', '/communities'],
  ['Predictions', '/predictions'],
  ['Notifications', '/notifications'],
  ['Profile', '/profile'],
] as const;

export function Navigation() {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="ArenaPulse home">
          <Activity aria-hidden="true" />
          <span>
            Arena<span className="accent">Pulse</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          {navigation.slice(1, 8).map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button button-small header-account" href="/register">
          Join the crowd <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <Menu aria-hidden="true" />
          </summary>
          <nav aria-label="All pages">
            {navigation.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/register">Create account</Link>
          </nav>
        </details>
      </header>
      <nav className="bottom-nav" aria-label="Mobile primary">
        {navigation
          .filter(([label]) =>
            ['Home', 'Matches', 'Fantasy', 'Communities', 'Profile'].includes(
              label,
            ),
          )
          .map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
      </nav>
    </>
  );
}
