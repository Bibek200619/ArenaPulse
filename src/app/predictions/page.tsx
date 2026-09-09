import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.predictions[0] };
export default function Page() {
  return (
    <EmptyState
      title={sections.predictions[0]}
      description={sections.predictions[1]}
    />
  );
}
