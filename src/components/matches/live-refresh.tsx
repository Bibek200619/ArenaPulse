'use client';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
export function LiveRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible')
        startTransition(() => router.refresh());
    }, 30_000);
    return () => clearInterval(timer);
  }, [enabled, router]);
  return (
    <button
      className="button secondary button-small"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? 'Refreshing…' : 'Refresh matches'}
    </button>
  );
}
