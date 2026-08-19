'use client';
import { useActionState } from 'react';
import { changeFollow } from './actions';
import type { FollowKind } from './validation';
export function FollowButton({
  kind,
  id,
  name,
  following,
}: {
  kind: FollowKind;
  id: string;
  name: string;
  following: boolean;
}) {
  const [state, action, pending] = useActionState(changeFollow, {});
  const active = state.following ?? following;
  return (
    <form action={action} className="follow-form">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input
        type="hidden"
        name="operation"
        value={active ? 'unfollow' : 'follow'}
      />
      <button
        className={`button button-small ${active ? 'secondary' : ''}`}
        disabled={pending}
        aria-label={`${active ? 'Unfollow' : 'Follow'} ${name}`}
      >
        {pending ? 'Saving…' : active ? 'Following ✓' : 'Follow +'}
      </button>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
