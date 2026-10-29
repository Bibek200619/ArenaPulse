import Link from 'next/link';
import type { SocialPost } from '@/features/social/repository';
import { SocialPostAuthor } from '@/features/social/presentation';
import { ContentForm } from '@/features/social/forms';
import { CommunityControl } from './forms';

export function CommunityPostComposer({
  id,
  signedIn,
}: {
  id: string;
  signedIn: boolean;
}) {
  return (
    <section className="social-post">
      <h2>Community conversation</h2>
      {signedIn ? (
        <ContentForm communityId={id} />
      ) : (
        <p className="data-notice">
          <Link href="/login">Sign in to post in this community.</Link>
        </p>
      )}
    </section>
  );
}

export function CommunityPostList({
  id,
  posts,
  role,
  userId,
}: {
  id: string;
  posts: SocialPost[];
  role: string;
  userId: string;
}) {
  if (!posts.length)
    return (
      <p className="match-empty">
        No community posts yet. Start the conversation.
      </p>
    );
  return (
    <div className="social-stream">
      {posts.map((post) => (
        <article className="social-post" key={post.id}>
          {post.is_pinned && <p className="eyebrow accent">Pinned post</p>}
          <SocialPostAuthor author={post.author} date={post.created_at} />
          <p className="social-body">{post.body}</p>
          <div className="social-post-footer">
            <Link className="text-link" href={`/posts/${post.id}`}>
              Open conversation →
            </Link>
            <span className="muted">
              {post.comments[0]?.count ?? 0} comments ·{' '}
              {post.reactions[0]?.count ?? 0} likes
            </span>
          </div>
          <div className="community-controls">
            {['owner', 'admin'].includes(role) && (
              <CommunityControl
                id={id}
                targetId={post.id}
                operation={post.is_pinned ? 'unpin-post' : 'pin-post'}
                label={post.is_pinned ? 'Unpin post' : 'Pin post'}
              />
            )}
            {role !== 'member' && post.author_id !== userId && (
              <CommunityControl
                id={id}
                targetId={post.id}
                operation="remove-post"
                label="Remove post"
                confirm="Remove this post from the community? The action will be recorded in the audit trail."
              />
            )}
            <CommunityControl
              id={id}
              targetId={post.id}
              operation="report-post"
              label="Report post"
            >
              <label>
                Why are you reporting this post?
                <textarea name="reason" required maxLength={500} rows={2} />
              </label>
            </CommunityControl>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CommunityReportList({
  id,
  reports,
}: {
  id: string;
  reports: {
    id: string;
    post_id: string;
    reporter_id: string;
    reason: string;
    status: string;
    created_at: string;
  }[];
}) {
  if (!reports.length)
    return <p className="match-empty">No reports in this view.</p>;
  return (
    <div className="social-stream">
      {reports.map((report) => (
        <article className="social-post" key={report.id}>
          <h3>Report · {report.status}</h3>
          <p className="social-body">{report.reason}</p>
          <p className="muted">
            Reporter {report.reporter_id.slice(0, 8)} ·{' '}
            <Link href={`/posts/${report.post_id}`}>Open reported post</Link>
          </p>
          {report.status === 'open' && (
            <div className="community-controls">
              <CommunityControl
                id={id}
                targetId={report.id}
                operation="resolve-report"
                label="Resolve report"
              />
              <CommunityControl
                id={id}
                targetId={report.id}
                operation="dismiss-report"
                label="Dismiss report"
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
