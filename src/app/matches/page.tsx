import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.matches[0] };
export default function Page() {
  return (
    <EmptyState title={sections.matches[0]} description={sections.matches[1]} />
  );
}
