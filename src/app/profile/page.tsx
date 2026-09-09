import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.profile[0] };
export default function Page() {
  return (
    <EmptyState title={sections.profile[0]} description={sections.profile[1]} />
  );
}
