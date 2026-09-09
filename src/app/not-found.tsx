import { EmptyState } from '@/components/ui/empty-state';
export default function NotFound() {
  return (
    <EmptyState
      title="This one is out of play."
      description="We couldn’t find that page. Head home and pick up the action."
    />
  );
}
