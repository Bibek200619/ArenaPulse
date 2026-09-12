import { socialContext } from '@/features/social/context';
import { readPosts } from '@/features/social/repository';
import {
  socialQuerySchema,
  SOCIAL_PAGE_SIZE,
} from '@/features/social/validation';
import { ContentForm } from '@/features/social/forms';
import {
  SocialShell,
  SocialUnavailable,
  WriteNotice,
  PostList,
  SocialPagination,
} from '@/features/social/presentation';
export const metadata = { title: 'Activity feed' };
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = socialQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <SocialShell title="Activity feed">
        <p role="alert">Choose a valid feed and page number.</p>
      </SocialShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <SocialShell title="Activity feed">
        <SocialUnavailable />
      </SocialShell>
    );
  const { client, user, profile } = context;
  const { page, view } = parsed.data;
  const posts =
    view === 'following' && !user
      ? []
      : await readPosts(client, page, {
          following: view === 'following' ? user?.id : undefined,
        });
  return (
    <SocialShell title="Activity feed">
      <WriteNotice signedIn={!!user} isPrivate={profile?.is_private} />
      {user && profile && <ContentForm />}
      <form className="match-filters" action="/feed">
        <div className="filter-field">
          <label htmlFor="feed-view">Show posts</label>
          <select id="feed-view" name="view" defaultValue={view}>
            <option value="all">Latest activity</option>
            <option value="following">People you follow</option>
          </select>
        </div>
        <button className="button secondary">Update feed</button>
      </form>
      <PostList posts={posts} />
      <SocialPagination
        path="/feed"
        page={page}
        hasMore={posts.length > SOCIAL_PAGE_SIZE}
        query={{ view }}
      />
    </SocialShell>
  );
}
