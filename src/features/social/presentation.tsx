import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SocialPost } from './repository';
import { SOCIAL_PAGE_SIZE } from './validation';
export function SocialShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section social-page">
      <header className="social-heading">
        <p className="eyebrow accent">THE CROWD</p>
        <h1>{title}</h1>
        <p className="muted">Every sport. Every perspective. Your people.</p>
        <nav aria-label="Social">
          <Link href="/feed">Activity feed</Link>
          <Link href="/people">Find fans</Link>
          <Link href="/profile">Your profile</Link>
        </nav>
      </header>
      {children}
    </section>
  );
}
export function SocialUnavailable() {
  return (
    <p className="data-notice">
      The crowd is unavailable until accounts are configured. Please try again
      later.
    </p>
  );
}
export function WriteNotice({
  signedIn,
  isPrivate,
}: {
  signedIn: boolean;
  isPrivate?: boolean;
}) {
  if (!signedIn)
    return (
      <p className="data-notice">
        <Link className="text-link" href="/login">
          Sign in to join the conversation →
        </Link>
      </p>
    );
  if (isPrivate === undefined)
    return (
      <p className="data-notice">
        <Link className="text-link" href="/onboarding">
          Complete your profile to join the conversation →
        </Link>
      </p>
    );
  return (
    <p className="social-privacy muted">
      {isPrivate
        ? 'Your profile is private. Only you can see your posts, comments and likes.'
        : 'Your profile is public. Your posts and interactions can be seen by everyone.'}{' '}
      <Link href="/settings/profile">Manage privacy</Link>
    </p>
  );
}
export function Author({
  name,
  username,
  date,
}: {
  name: string;
  username: string;
  date: string;
}) {
  return (
    <div className="social-author">
      <span className="entity-badge" aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div>
        <Link href={`/users/${username}`}>
          <strong>{name}</strong> <span className="muted">@{username}</span>
        </Link>
        <time dateTime={date}>
          {new Date(date).toISOString().slice(0, 16).replace('T', ' ')} UTC
        </time>
      </div>
    </div>
  );
}
export function PostList({ posts }: { posts: SocialPost[] }) {
  if (!posts.length)
    return (
      <div className="match-empty">
        <h2>No posts yet.</h2>
        <p>Share a sports take, or find fans to follow.</p>
        <Link className="text-link" href="/people">
          Explore the crowd →
        </Link>
      </div>
    );
  return (
    <div className="social-stream">
      {posts.slice(0, SOCIAL_PAGE_SIZE).map((post) => (
        <article key={post.id} className="social-post">
          <Author
            name={post.author.display_name}
            username={post.author.username}
            date={post.created_at}
          />
          <p className="social-body">{post.body}</p>
          <div className="social-post-footer">
            <Link className="text-link" href={`/posts/${post.id}`}>
              Open conversation →
            </Link>
            <span className="muted">
              {post.comments[0]?.count ?? 0} visible comments ·{' '}
              {post.reactions[0]?.count ?? 0} visible likes
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
export function SocialPagination({
  path,
  page,
  hasMore,
  query = {},
}: {
  path: string;
  page: number;
  hasMore: boolean;
  query?: Record<string, string>;
}) {
  function url(next: number) {
    return `${path}?${new URLSearchParams({ ...query, page: String(next) })}`;
  }
  return (
    <nav className="match-pagination" aria-label="Pagination">
      {page > 1 && (
        <Link className="button secondary button-small" href={url(page - 1)}>
          Previous page
        </Link>
      )}
      {hasMore && page < 1000 && (
        <Link className="button secondary button-small" href={url(page + 1)}>
          Next page
        </Link>
      )}
    </nav>
  );
}
