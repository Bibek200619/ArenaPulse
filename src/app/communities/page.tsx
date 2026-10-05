import Link from 'next/link';
import { socialContext } from '@/features/social/context';
import { SocialPagination } from '@/features/social/presentation';
import {
  CommunityShell,
  CommunityUnavailable,
} from '@/features/communities/presentation';
import {
  communityQuerySchema,
  COMMUNITY_PAGE_SIZE,
} from '@/features/communities/validation';
import { readCommunities } from '@/features/communities/repository';
export const metadata = { title: 'Communities' };
export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = communityQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <CommunityShell title="Communities">
        <p role="alert">
          Use a valid page and a community name prefix with letters, numbers,
          spaces or hyphens.
        </p>
      </CommunityShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <CommunityShell title="Communities">
        <CommunityUnavailable />
      </CommunityShell>
    );
  const { page, q, view } = parsed.data;
  const groups =
    view === 'mine' && !context.user
      ? []
      : await readCommunities(
          context.client,
          page,
          q,
          view === 'mine' ? context.user?.id : undefined,
        );
  return (
    <CommunityShell
      title={view === 'mine' ? 'Your communities' : 'Communities'}
    >
      <form className="match-filters" action="/communities">
        <input type="hidden" name="view" value={view} />
        <div className="filter-field">
          <label htmlFor="community-search">Community name starts with</label>
          <input
            id="community-search"
            name="q"
            maxLength={80}
            defaultValue={q}
          />
        </div>
        <button className="button secondary">Find communities</button>
      </form>
      {view === 'mine' && !context.user && (
        <p className="data-notice">
          <Link href="/login">Sign in to see your communities.</Link>
        </p>
      )}
      <ul className="entity-list">
        {groups.slice(0, COMMUNITY_PAGE_SIZE).map((group) => (
          <li key={group.id}>
            <Link href={`/communities/${group.id}`}>
              <span className="entity-badge" aria-hidden="true">
                {group.name.slice(0, 1)}
              </span>
              <div>
                <h2>{group.name}</h2>
                <p className="muted">
                  {group.visibility === 'private'
                    ? 'Private community'
                    : 'Public community'}
                </p>
                <p className="social-body">
                  {group.description || 'A place to talk about the game.'}
                </p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      {!groups.length && (
        <p className="match-empty">
          No communities found. Start a crowd of your own.
        </p>
      )}
      <SocialPagination
        path="/communities"
        page={page}
        hasMore={groups.length > COMMUNITY_PAGE_SIZE}
        query={{ q, view }}
      />
    </CommunityShell>
  );
}
