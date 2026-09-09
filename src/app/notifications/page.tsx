import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.notifications[0] };
export default function Page() {
  return (
    <EmptyState
      title={sections.notifications[0]}
      description={sections.notifications[1]}
    />
  );
}
