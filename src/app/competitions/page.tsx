import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.competitions[0] };
export default function Page() {
  return (
    <EmptyState
      title={sections.competitions[0]}
      description={sections.competitions[1]}
    />
  );
}
