import { EmptyState } from '@/components/ui/empty-state';
import { sections } from '@/lib/sections';
export const metadata = { title: sections.register[0] };
export default function Page() {
  return (
    <EmptyState
      title={sections.register[0]}
      description={sections.register[1]}
    />
  );
}
