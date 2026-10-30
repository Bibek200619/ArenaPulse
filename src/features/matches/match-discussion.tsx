'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase/browser';
import { changeMatchDiscussion } from './discussion-actions';

type Entry = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  is_removed: boolean;
  profile?: { username: string; display_name: string } | null;
  reactionCount: number;
  reacted: boolean;
  replies: Entry[];
};
export function MatchDiscussion({
  matchId,
  userId,
  isModerator,
  messages,
  hasMore,
  page,
}: {
  matchId: string;
  userId: string | null;
  isModerator: boolean;
  messages: Entry[];
  hasMore: boolean;
  page: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const client = browserClient();
    let timer: ReturnType<typeof setInterval> | undefined;
    const channel = client
      .channel(`match-discussion:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_discussion_messages',
          filter: `match_id=eq.${matchId}`,
        },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_discussion_reactions',
          filter: `match_id=eq.${matchId}`,
        },
        () => router.refresh(),
      )
      .subscribe((status) => {
        const failed = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(
          status,
        );
        setFallback(failed);
        if (failed && !timer)
          timer = setInterval(() => {
            if (document.visibilityState === 'visible') router.refresh();
          }, 15000);
        if (status === 'SUBSCRIBED' && timer) {
          clearInterval(timer);
          timer = undefined;
        }
      });
    return () => {
      if (timer) clearInterval(timer);
      void client.removeChannel(channel);
    };
  }, [matchId, router]);
  const submit = (form: FormData) =>
    startTransition(async () => {
      const result = await changeMatchDiscussion(form);
      if (result.error) window.alert(result.error);
      else router.refresh();
    });
  const composer = (operation: string, extras: Record<string, string> = {}) => (
    <form action={submit} className="discussion-form">
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="matchId" value={matchId} />
      {Object.entries(extras).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <label
        className="sr-only"
        htmlFor={`discussion-${operation}-${extras.parentId ?? extras.messageId ?? 'root'}`}
      >
        {operation === 'reply'
          ? 'Write a reply'
          : operation === 'report'
            ? 'Report reason'
            : 'Your match comment'}
      </label>
      <textarea
        id={`discussion-${operation}-${extras.parentId ?? extras.messageId ?? 'root'}`}
        name="body"
        maxLength={1000}
        required
        placeholder={
          operation === 'reply'
            ? 'Write a reply…'
            : operation === 'report'
              ? 'Add context for moderators…'
              : 'Share your take on the match…'
        }
      />
      {operation === 'report' && (
        <span className="muted">
          Tell moderators why this message should be reviewed.
        </span>
      )}
      <button className="button secondary button-small" disabled={pending}>
        {operation === 'reply'
          ? 'Reply'
          : operation === 'report'
            ? 'Report'
            : 'Send'}
      </button>
    </form>
  );
  const renderEntry = (entry: Entry, reply = false) => (
    <div className="discussion-message" key={entry.id}>
      <p className="discussion-byline">
        {entry.profile ? (
          <Link href={`/users/${entry.profile.username}`}>
            {entry.profile.display_name || `@${entry.profile.username}`}
          </Link>
        ) : (
          'Fan'
        )}{' '}
        ·{' '}
        <time dateTime={entry.created_at}>
          {`${entry.created_at.slice(0, 16).replace('T', ' ')} UTC`}
        </time>
      </p>
      <p>{entry.body}</p>
      {userId && !entry.is_removed && (
        <div className="discussion-actions">
          <form action={submit}>
            <input type="hidden" name="operation" value="react" />
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="messageId" value={entry.id} />
            <input
              type="hidden"
              name="active"
              value={entry.reacted ? 'false' : 'true'}
            />
            <button className="text-button" disabled={pending}>
              {entry.reacted ? 'Unlike' : 'Like'} · {entry.reactionCount}
            </button>
          </form>
          {!reply && (
            <details>
              <summary>Reply</summary>
              {composer('reply', { parentId: entry.id })}
            </details>
          )}
          <details>
            <summary>Report</summary>
            {composer('report', { messageId: entry.id })}
          </details>
          {entry.author_id === userId && (
            <form action={submit}>
              <input type="hidden" name="operation" value="delete" />
              <input type="hidden" name="matchId" value={matchId} />
              <input type="hidden" name="messageId" value={entry.id} />
              <button className="text-button" disabled={pending}>
                Delete
              </button>
            </form>
          )}
          {isModerator && (
            <form action={submit}>
              <input type="hidden" name="operation" value="moderate" />
              <input type="hidden" name="matchId" value={matchId} />
              <input type="hidden" name="messageId" value={entry.id} />
              <button className="text-button" disabled={pending}>
                Remove as moderator
              </button>
            </form>
          )}
        </div>
      )}
      {!reply && entry.replies.map((child) => renderEntry(child, true))}
    </div>
  );
  return (
    <section
      className="match-section match-discussion"
      aria-labelledby="discussion-heading"
    >
      <h2 id="discussion-heading">Fan discussion</h2>
      {fallback && (
        <p className="muted" role="status">
          Live updates are reconnecting; checking for new messages periodically.
        </p>
      )}
      {userId ? (
        composer('message')
      ) : (
        <p>
          <Link
            href={`/login?next=${encodeURIComponent(`/matches/${matchId}#discussion-heading`)}`}
            className="text-link"
          >
            Sign in
          </Link>{' '}
          to join this discussion.
        </p>
      )}
      {messages.length ? (
        messages.map((entry) => renderEntry(entry))
      ) : (
        <p className="muted">No discussion yet. Start the conversation.</p>
      )}
      {hasMore && (
        <Link
          className="text-link"
          href={`/matches/${matchId}?discussionPage=${page + 1}#discussion-heading`}
        >
          Load older messages
        </Link>
      )}
      {page > 0 && (
        <Link
          className="text-link"
          href={`/matches/${matchId}?discussionPage=${page - 1}#discussion-heading`}
        >
          Newer messages
        </Link>
      )}
    </section>
  );
}
