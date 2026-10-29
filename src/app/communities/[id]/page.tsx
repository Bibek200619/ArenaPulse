import Link from 'next/link';
import { notFound } from 'next/navigation';
import { socialContext } from '@/features/social/context';
import {
  CommunityShell,
  CommunityUnavailable,
  MembershipControl,
} from '@/features/communities/presentation';
import {
  readCommunity,
  readMembership,
} from '@/features/communities/repository';
import { communityId } from '@/features/communities/validation';
import { readCommunityPosts } from '@/features/social/repository';
import {
  CommunityPostComposer,
  CommunityPostList,
} from '@/features/communities/content';
import { SocialPagination } from '@/features/social/presentation';
import {
  socialQuerySchema,
  SOCIAL_PAGE_SIZE,
} from '@/features/social/validation';
export const metadata = {
  title: 'Community',
  robots: { index: false, follow: false },
};
export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!communityId.safeParse(id).success) notFound();
  const parsed = socialQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <CommunityShell title="Community">
        <p role="alert">Choose a valid page number.</p>
      </CommunityShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <CommunityShell title="Community">
        <CommunityUnavailable />
      </CommunityShell>
    );
  const [group, membership] = await Promise.all([
    readCommunity(context.client, id),
    context.user
      ? readMembership(context.client, id, context.user.id)
      : Promise.resolve({
          role: undefined,
          request: undefined,
          ban: undefined,
        }),
  ]);
  const posts =
    group && membership.role
      ? await readCommunityPosts(context.client, id, parsed.data.page)
      : [];
  return (
    <CommunityShell title={group?.name ?? 'Community access'}>
      {group ? (
        <>
          <p className="eyebrow">{group.visibility} community</p>
          <p className="social-body">
            {group.description || 'Welcome to the crowd.'}
          </p>
          <section className="social-post">
            <h2>Community rules</h2>
            <p className="social-body">
              {group.rules ||
                'Respect other fans and keep discussions about the sport.'}
            </p>
          </section>
        </>
      ) : (
        <p className="data-notice">
          This community is private or unavailable. If you received this link,
          you can request access without seeing private details.
        </p>
      )}
      {membership.role && <p role="status">Your role: {membership.role}</p>}
      <MembershipControl
        id={id}
        signedIn={!!context.user}
        hasProfile={!!context.profile}
        {...membership}
      />
      {membership.role && (
        <section className="social-post">
          <h2>Your crowd</h2>
          <Link className="text-link" href={`/communities/${id}/members`}>
            Members and community management →
          </Link>
          <p className="muted">
            Invite a fan by sharing this page link. Private communities require
            approval.
          </p>
        </section>
      )}
      {membership.role && (
        <>
          <CommunityPostComposer
            id={id}
            signedIn={!!context.user && !!context.profile}
          />
          <CommunityPostList
            id={id}
            posts={posts}
            role={membership.role}
            userId={context.user!.id}
          />
          <SocialPagination
            path={`/communities/${id}`}
            page={parsed.data.page}
            hasMore={posts.length > SOCIAL_PAGE_SIZE}
          />
        </>
      )}
    </CommunityShell>
  );
}
