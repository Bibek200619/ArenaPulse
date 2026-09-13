import { notFound } from 'next/navigation';
import { z } from 'zod';
import { socialContext } from '@/features/social/context';
import { readPost, readComments } from '@/features/social/repository';
import {
  socialQuerySchema,
  SOCIAL_PAGE_SIZE,
} from '@/features/social/validation';
import { ContentForm, SocialButton } from '@/features/social/forms';
import {
  SocialShell,
  SocialUnavailable,
  Author,
  SocialPagination,
  WriteNotice,
} from '@/features/social/presentation';
export const metadata = { title: 'Conversation' };
export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const parsed = socialQuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <SocialShell title="Conversation">
        <p role="alert">Choose a valid page number.</p>
      </SocialShell>
    );
  const context = await socialContext();
  if (!context)
    return (
      <SocialShell title="Conversation">
        <SocialUnavailable />
      </SocialShell>
    );
  const { client, user, profile } = context;
  const post = await readPost(client, id);
  if (!post) notFound();
  const [comments, reaction] = await Promise.all([
    readComments(client, id, parsed.data.page),
    user
      ? client
          .from('reactions')
          .select('post_id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      : null,
  ]);
  if (reaction?.error) throw new Error('Reaction status is unavailable');
  return (
    <SocialShell title="Conversation">
      <article className="social-post">
        <Author
          name={post.author.display_name}
          username={post.author.username}
          date={post.created_at}
        />
        <p className="social-body">{post.body}</p>
        <p className="muted">{post.reactions[0]?.count ?? 0} visible likes</p>
        <div className="actions">
          {user && profile && (
            <SocialButton
              key={String(!!reaction?.data)}
              input={{ operation: 'like', postId: id }}
              active={!!reaction?.data}
              label="Like post"
              activeLabel="Unlike post"
            />
          )}
          {user?.id === post.author_id && (
            <SocialButton
              input={{ operation: 'delete-post', postId: id }}
              label="Delete post"
              confirmDelete
            />
          )}
        </div>
      </article>
      <h2 className="social-subheading">Comments</h2>
      <WriteNotice signedIn={!!user} isPrivate={profile?.is_private} />
      {user && profile && <ContentForm postId={id} />}
      <div className="social-stream">
        {comments.slice(0, SOCIAL_PAGE_SIZE).map((comment) => (
          <article
            key={comment.id}
            className="social-post"
            id={`comment-${comment.id}`}
          >
            <Author
              name={comment.author.display_name}
              username={comment.author.username}
              date={comment.created_at}
            />
            {comment.parent_id && (
              <p className="muted social-reply-note">
                Reply in this conversation
              </p>
            )}
            <p className="social-body">{comment.body}</p>
            {user && profile && (
              <details className="social-reply">
                <summary>Reply to @{comment.author.username}</summary>
                <ContentForm
                  postId={id}
                  parentId={comment.id}
                  replyTo={`@${comment.author.username}`}
                />
              </details>
            )}
            {user?.id === comment.author_id && (
              <SocialButton
                input={{
                  operation: 'delete-comment',
                  postId: id,
                  commentId: comment.id,
                }}
                label="Delete comment"
                confirmDelete
              />
            )}
          </article>
        ))}
      </div>
      {!comments.length && (
        <p className="match-empty muted">
          No visible comments yet. Start the conversation.
        </p>
      )}
      <SocialPagination
        path={`/posts/${id}`}
        page={parsed.data.page}
        hasMore={comments.length > SOCIAL_PAGE_SIZE}
      />
    </SocialShell>
  );
}
