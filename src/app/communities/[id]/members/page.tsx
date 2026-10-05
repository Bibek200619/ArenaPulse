import Link from 'next/link';
import { notFound } from 'next/navigation';
import { socialContext } from '@/features/social/context';
import { SocialPagination } from '@/features/social/presentation';
import {
  CommunityShell,
  CommunityUnavailable,
} from '@/features/communities/presentation';
import { CommunityControl } from '@/features/communities/forms';
import {
  readCommunity,
  readMembership,
  readCommunityRoster,
} from '@/features/communities/repository';
import {
  communityId,
  memberQuerySchema,
  roleRank,
  COMMUNITY_PAGE_SIZE,
} from '@/features/communities/validation';
export const metadata = {
  title: 'Community members',
  robots: { index: false, follow: false },
};
export default async function CommunityMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!communityId.safeParse(id).success) notFound();
  const parsed = memberQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <CommunityShell title="Community members">
        <p role="alert">Choose a valid page and member view.</p>
      </CommunityShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <CommunityShell title="Community members">
        <CommunityUnavailable />
      </CommunityShell>
    );
  if (!context.user) notFound();
  const [group, membership] = await Promise.all([
    readCommunity(context.client, id),
    readMembership(context.client, id, context.user.id),
  ]);
  if (!group || !membership.role) notFound();
  const rank = roleRank(membership.role),
    { page, tab } = parsed.data;
  if (tab !== 'members' && rank < 2) notFound();
  const roster = await readCommunityRoster(context.client, id, tab, page);
  const path = `/communities/${id}/members`;
  return (
    <CommunityShell title={`${group.name} · members`}>
      <Link className="text-link" href={`/communities/${id}`}>
        ← Back to community
      </Link>
      <nav className="community-tabs" aria-label="Member management">
        {(rank >= 2
          ? ['members', 'requests', 'bans', 'audit']
          : ['members']
        ).map((value) => (
          <Link
            key={value}
            href={`${path}?tab=${value}`}
            aria-current={tab === value ? 'page' : undefined}
          >
            {value === 'requests'
              ? 'Access requests'
              : value[0].toUpperCase() + value.slice(1)}
          </Link>
        ))}
      </nav>
      <h2>
        {tab === 'requests'
          ? 'Pending access requests'
          : tab === 'audit'
            ? 'Moderation audit'
            : tab === 'bans'
              ? 'Community bans'
              : 'Members'}
      </h2>
      <div className="social-stream">
        {roster.people.slice(0, COMMUNITY_PAGE_SIZE).map((person) => {
          const targetRank = roleRank('role' in person ? person.role : null);
          const isOther = person.user_id !== context.user!.id;
          return (
            <article key={person.user_id} className="social-post">
              <h3>
                {person.profile ? (
                  <Link href={`/users/${person.profile.username}`}>
                    {person.profile.display_name} · @{person.profile.username}
                  </Link>
                ) : (
                  `Private profile · ${person.user_id.slice(0, 8)}`
                )}
              </h3>
              {'role' in person && <p className="muted">Role: {person.role}</p>}
              {'reason' in person && (
                <p className="social-body">Reason: {person.reason}</p>
              )}
              <div className="community-controls">
                {tab === 'requests' && (
                  <>
                    <CommunityControl
                      id={id}
                      targetId={person.user_id}
                      operation="approve"
                      label="Approve request"
                    />
                    <CommunityControl
                      id={id}
                      targetId={person.user_id}
                      operation="reject"
                      label="Reject request"
                    />
                  </>
                )}
                {tab === 'members' &&
                  isOther &&
                  rank >= 3 &&
                  rank > targetRank && (
                    <CommunityControl
                      id={id}
                      targetId={person.user_id}
                      operation="role"
                      label="Save role"
                    >
                      <label>
                        Member role
                        <select
                          name="role"
                          defaultValue={
                            'role' in person ? person.role : 'member'
                          }
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          {rank === 4 && <option value="admin">Admin</option>}
                        </select>
                      </label>
                    </CommunityControl>
                  )}
                {tab === 'members' && isOther && rank === 4 && (
                  <CommunityControl
                    id={id}
                    targetId={person.user_id}
                    operation="transfer"
                    label="Transfer ownership"
                    confirm="Transfer ownership to this member? You will become an admin and lose owner authority."
                  />
                )}
                {tab !== 'bans' &&
                  isOther &&
                  rank >= 2 &&
                  rank > targetRank && (
                    <details>
                      <summary>Ban member</summary>
                      <CommunityControl
                        id={id}
                        targetId={person.user_id}
                        operation="ban"
                        label="Confirm ban"
                        confirm="Remove this member and prevent participation?"
                      >
                        <label>
                          Ban reason
                          <textarea
                            name="reason"
                            required
                            maxLength={500}
                            rows={2}
                          />
                        </label>
                      </CommunityControl>
                    </details>
                  )}
                {'issuer_rank' in person && rank >= person.issuer_rank && (
                  <CommunityControl
                    id={id}
                    targetId={person.user_id}
                    operation="unban"
                    label="Remove ban"
                  />
                )}
              </div>
            </article>
          );
        })}
        {roster.audit.slice(0, COMMUNITY_PAGE_SIZE).map((event) => (
          <article className="social-post" key={event.id}>
            <h3>{event.action}</h3>
            <p className="muted">
              <time dateTime={event.created_at}>
                {new Date(event.created_at)
                  .toISOString()
                  .slice(0, 16)
                  .replace('T', ' ')}{' '}
                UTC
              </time>{' '}
              · Actor {event.actor_id?.slice(0, 8) ?? 'deleted'} · Target{' '}
              {event.target_id?.slice(0, 8) ?? 'deleted'}
            </p>
            {event.detail && <p className="social-body">{event.detail}</p>}
          </article>
        ))}
      </div>
      {!roster.people.length && !roster.audit.length && (
        <p className="match-empty">Nothing to show in this view.</p>
      )}
      <SocialPagination
        path={path}
        page={page}
        query={{ tab }}
        hasMore={
          roster.people.length > COMMUNITY_PAGE_SIZE ||
          roster.audit.length > COMMUNITY_PAGE_SIZE
        }
      />
    </CommunityShell>
  );
}
