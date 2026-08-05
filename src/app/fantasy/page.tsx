import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.fantasy[0] };
export default function Page() {
  return (
    <EmptyState title={sections.fantasy[0]} description={sections.fantasy[1]} />
  );
}
