import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.players[0] };
export default function Page() {
  return (
    <EmptyState title={sections.players[0]} description={sections.players[1]} />
  );
}
