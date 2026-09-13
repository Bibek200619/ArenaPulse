import { notFound } from 'next/navigation';
import { socialContext } from '@/features/social/context';
import { readPosts } from '@/features/social/repository';
import {
  usernameSchema,
  socialQuerySchema,
  SOCIAL_PAGE_SIZE,
} from '@/features/social/validation';
import { SocialButton } from '@/features/social/forms';
import {
  SocialShell,
  SocialUnavailable,
  PostList,
  SocialPagination,
  WriteNotice,
} from '@/features/social/presentation';
export const metadata = { title: 'Fan profile' };
export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const name = usernameSchema.safeParse((await params).username);
  if (!name.success) notFound();
  const parsed = socialQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <SocialShell title="Fan profile">
        <p role="alert">Choose a valid page number.</p>
      </SocialShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <SocialShell title="Fan profile">
        <SocialUnavailable />
      </SocialShell>
    );
  const { client, user } = context;
  const { data: profile, error } = await client
    .from('profiles')
    .select('id,username,display_name,bio,is_private')
    .eq('username', name.data)
    .maybeSingle();
  if (error) throw new Error('Profile is unavailable');
  if (!profile) notFound();
  const [posts, followers, following, relation] = await Promise.all([
    readPosts(client, parsed.data.page, { author: profile.id }),
    client
      .from('user_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('followed_id', profile.id),
    client
      .from('user_follows')
      .select('followed_id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    user
      ? client
          .from('user_follows')
          .select('followed_id')
          .eq('follower_id', user.id)
          .eq('followed_id', profile.id)
          .maybeSingle()
      : null,
  ]);
  if (followers.error || following.error || relation?.error)
    throw new Error('Follow status is unavailable');
  return (
    <SocialShell title={profile.display_name}>
      <p className="accent">
        @{profile.username} ·{' '}
        {profile.is_private ? 'Private profile' : 'Public profile'}
      </p>
      <p className="social-body profile-bio">
        {profile.bio || 'Here for the love of the game.'}
      </p>
      <p className="muted">
        {followers.count ?? 0} visible followers · {following.count ?? 0}{' '}
        visible following
      </p>
      <div className="actions">
        {user &&
        context.profile &&
        user.id !== profile.id &&
        !profile.is_private ? (
          <SocialButton
            key={String(!!relation?.data)}
            input={{ operation: 'follow', userId: profile.id }}
            active={!!relation?.data}
            label={`Follow @${profile.username}`}
            activeLabel={`Unfollow @${profile.username}`}
          />
        ) : !context.profile ? (
          <WriteNotice signedIn={!!user} />
        ) : null}
      </div>
      <h2 className="social-subheading">Sports activity</h2>
      <PostList posts={posts} />
      <SocialPagination
        path={`/users/${profile.username}`}
        page={parsed.data.page}
        hasMore={posts.length > SOCIAL_PAGE_SIZE}
      />
    </SocialShell>
  );
}
