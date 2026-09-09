import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="empty-state">
      <p className="eyebrow">THE NEXT CHAPTER</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/" className="button secondary">
        <ArrowLeft size={16} aria-hidden="true" /> Back to home
      </Link>
    </section>
  );
}
