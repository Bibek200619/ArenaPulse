import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.teams[0] };
export default function Page() {
  return (
    <EmptyState title={sections.teams[0]} description={sections.teams[1]} />
  );
}
