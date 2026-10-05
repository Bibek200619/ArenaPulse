import Link from 'next/link';
import type { ReactNode } from 'react';
import { CommunityControl } from './forms';
export function CommunityShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section social-page">
      <header className="social-heading">
        <p className="eyebrow accent">FIND YOUR PEOPLE</p>
        <h1>{title}</h1>
        <p className="muted">A home for every fan. A place for every sport.</p>
        <nav aria-label="Communities">
          <Link href="/communities">Discover</Link>
          <Link href="/communities?view=mine">Your communities</Link>
          <Link href="/communities/new">Create community</Link>
        </nav>
      </header>
      {children}
    </section>
  );
}
export function CommunityUnavailable() {
  return (
    <p className="data-notice">
      Communities are unavailable until accounts are configured. Please try
      again later.
    </p>
  );
}
export function MembershipControl({
  id,
  signedIn,
  hasProfile,
  role,
  request,
  ban,
}: {
  id: string;
  signedIn: boolean;
  hasProfile: boolean;
  role?: string;
  request?: string;
  ban?: string;
}) {
  if (!signedIn)
    return (
      <p className="data-notice">
        <Link className="text-link" href="/login">
          Sign in to join a community →
        </Link>
      </p>
    );
  if (!hasProfile)
    return (
      <p className="data-notice">
        <Link className="text-link" href="/onboarding">
          Complete your profile to join →
        </Link>
      </p>
    );
  if (ban)
    return (
      <p role="status" className="data-notice">
        Participation is unavailable. Reason: {ban}
      </p>
    );
  if (role === 'owner')
    return (
      <p className="data-notice">
        You own this community. Transfer ownership to another member before
        leaving.
      </p>
    );
  if (role)
    return (
      <CommunityControl
        id={id}
        operation="leave"
        label="Leave community"
        confirm="Leave this community? Private access will require approval again."
      />
    );
  if (request === 'pending')
    return (
      <div>
        <p role="status">Your access request is pending.</p>
        <CommunityControl
          id={id}
          operation="cancel-request"
          label="Cancel access request"
        />
      </div>
    );
  return (
    <CommunityControl id={id} operation="join" label="Join or request access" />
  );
}
