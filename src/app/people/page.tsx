import Link from 'next/link';
import { socialContext } from '@/features/social/context';
import {
  peopleQuerySchema,
  SOCIAL_PAGE_SIZE,
} from '@/features/social/validation';
import {
  SocialShell,
  SocialUnavailable,
  SocialPagination,
} from '@/features/social/presentation';
export const metadata = { title: 'Find fans' };
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = peopleQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <SocialShell title="Find fans">
        <p role="alert">
          Use a valid page and a username prefix with letters, numbers or
          underscores.
        </p>
      </SocialShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <SocialShell title="Find fans">
        <SocialUnavailable />
      </SocialShell>
    );
  const { page, q } = parsed.data;
  const start = (page - 1) * SOCIAL_PAGE_SIZE;
  // A literal prefix: escape underscores so they are not SQL LIKE wildcards.
  const { data, error } = await context.client
    .from('profiles')
    .select('id,username,display_name,bio')
    .eq('is_private', false)
    .ilike('username', `${q.replaceAll('_', '\\_')}%`)
    .order('username')
    .range(start, start + SOCIAL_PAGE_SIZE);
  if (error) throw new Error('Fan discovery is unavailable');
  return (
    <SocialShell title="Find fans">
      <form className="match-filters" action="/people">
        <div className="filter-field">
          <label htmlFor="fan-search">Username starts with</label>
          <input
            id="fan-search"
            name="q"
            maxLength={24}
            defaultValue={q}
            placeholder="Search usernames"
          />
        </div>
        <button className="button secondary">Find fans</button>
      </form>
      <p className="muted">Public profiles from across the crowd.</p>
      <ul className="entity-list">
        {data.slice(0, SOCIAL_PAGE_SIZE).map((person) => (
          <li key={person.id}>
            <Link href={`/users/${person.username}`}>
              <span className="entity-badge" aria-hidden="true">
                {person.display_name.slice(0, 1)}
              </span>
              <div>
                <h2>{person.display_name}</h2>
                <p>@{person.username}</p>
                <p className="social-body muted">
                  {person.bio || 'Here for the love of the game.'}
                </p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      {!data.length && <p className="match-empty">No public profiles found.</p>}
      <SocialPagination
        path="/people"
        page={page}
        hasMore={data.length > SOCIAL_PAGE_SIZE}
        query={{ q }}
      />
    </SocialShell>
  );
}
