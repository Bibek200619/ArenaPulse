export const dynamicParams = false;
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
const sections: Record<string, [string, string]> = {
  matches: [
    'Your matchday starts here.',
    'Match browsing is being built. No live data provider is connected yet.',
  ],
  competitions: [
    'Follow the competition.',
    'Competition profiles, fixtures and standings are on the way.',
  ],
  teams: [
    'Wear your colours.',
    'Team discovery and following are coming in the sports milestone.',
  ],
  players: [
    'The people behind the moments.',
    'Player profiles and available performance statistics are on the way.',
  ],
  fantasy: [
    'Your squad. Your call.',
    'Fantasy competitions and squad building are coming in a later milestone.',
  ],
  communities: [
    'Find your crowd.',
    'Fan communities and discussions are being built.',
  ],
  predictions: [
    'ArenaPulse Prediction Engine — Coming Soon',
    'A custom model will be connected after the product foundation is complete. No predictions are available.',
  ],
  notifications: [
    'Stay close to the action.',
    'Your notification center will be available with account features.',
  ],
  profile: [
    'A home for your fandom.',
    'Profiles and sports preferences are coming with authentication.',
  ],
  register: [
    'Join the crowd.',
    'Account registration is not available in this foundation preview.',
  ],
};
export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return { title: sections[section]?.[0] ?? 'Page not found' };
}
export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!Object.hasOwn(sections, section)) notFound();
  const [title, description] = sections[section];
  return <EmptyState title={title} description={description} />;
}
