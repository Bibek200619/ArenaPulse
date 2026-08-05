import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.communities[0] };
export default function Page() {
  return (
    <EmptyState
      title={sections.communities[0]}
      description={sections.communities[1]}
    />
  );
}
