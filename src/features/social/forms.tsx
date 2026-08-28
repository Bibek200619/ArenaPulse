'use client';
import { startTransition, useActionState, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { changeSocial } from './actions';
import type { SocialMutation } from './validation';
export function ContentForm({
  postId,
  parentId,
  replyTo,
}: {
  postId?: string;
  parentId?: string;
  replyTo?: string;
}) {
  const id = useId();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [state, action, pending] = useActionState(
    async (previous: Parameters<typeof changeSocial>[0], form: FormData) => {
      const next = await changeSocial(previous, form);
      if (!next.error) {
        setBody('');
        if (next.postId) router.push(`/posts/${next.postId}`);
      }
      return next;
    },
    {},
  );
  const label = parentId
    ? `Reply to ${replyTo}`
    : postId
      ? 'Your comment'
      : 'Your sports take';
  return (
    <form
      className="form-stack social-composer"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
    >
      <input
        type="hidden"
        name="operation"
        value={postId ? 'comment' : 'post'}
      />
      {postId && <input type="hidden" name="postId" value={postId} />}
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        name="body"
        rows={3}
        required
        maxLength={postId ? 1000 : 2000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        aria-describedby={`${id}-limit`}
      />
      <div className="social-composer-footer">
        <small id={`${id}-limit`}>
          {body.length} / {postId ? '1,000' : '2,000'} characters
        </small>
        <button
          className="button button-small"
          disabled={pending || !body.trim()}
        >
          {pending ? 'Saving…' : postId ? 'Send comment' : 'Publish post'}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {postId ? 'Comment added.' : 'Post published.'}
        </p>
      )}
    </form>
  );
}
export function SocialButton({
  input,
  label,
  active = false,
  activeLabel,
  confirmDelete = false,
}: {
  input: SocialMutation;
  label: string;
  active?: boolean;
  activeLabel?: string;
  confirmDelete?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (previous: Parameters<typeof changeSocial>[0], form: FormData) => {
      const next = await changeSocial(previous, form);
      if (next.deleted) router.push('/feed');
      return next;
    },
    {},
  );
  const selected = state.active ?? active;
  const operation =
    input.operation === 'like'
      ? selected
        ? 'unlike'
        : 'like'
      : input.operation === 'follow'
        ? selected
          ? 'unfollow'
          : 'follow'
        : input.operation;
  return (
    <form
      action={action}
      className="social-action"
      onSubmit={(event) => {
        if (
          confirmDelete &&
          !window.confirm(
            'Delete this content and its replies? This cannot be undone.',
          )
        )
          event.preventDefault();
      }}
    >
      {Object.entries({ ...input, operation }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        className="button secondary button-small"
        disabled={pending}
        aria-pressed={activeLabel ? selected : undefined}
      >
        {pending ? 'Saving…' : selected && activeLabel ? activeLabel : label}
      </button>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
