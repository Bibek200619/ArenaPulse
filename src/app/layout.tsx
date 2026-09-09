import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation/navigation';
import './globals.css';
export const metadata: Metadata = {
  title: {
    default: 'ArenaPulse — Feel every moment',
    template: '%s | ArenaPulse',
  },
  description:
    'Follow the game. Build your squad. Join the crowd. Predict what comes next.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <span>ArenaPulse · Made for the love of the game.</span>
          <span>Foundation preview · No live sports data connected</span>
        </footer>
      </body>
    </html>
  );
}
