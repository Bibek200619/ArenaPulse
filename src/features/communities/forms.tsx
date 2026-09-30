'use client';
import { startTransition, useActionState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { changeCommunity, type CommunityState } from './actions';
function CommunityForm({
  children,
  label,
  confirm,
}: {
  children: ReactNode;
  label: string;
  confirm?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (previous: CommunityState, form: FormData) => {
      const result = await changeCommunity(previous, form);
      if (result.id) router.push(`/communities/${result.id}`);
      return result;
    },
    {},
  );
  return (
    <form
      className="form-stack community-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
    >
      {children}
      <button className="button secondary button-small" disabled={pending}>
        {pending ? 'Saving…' : label}
      </button>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function CreateCommunityForm({
  sports,
}: {
  sports: { id: string; name: string }[];
}) {
  return (
    <CommunityForm label="Create community">
      <input type="hidden" name="operation" value="create" />
      <label>
        Community name
        <input name="name" required minLength={3} maxLength={80} />
      </label>
      <label>
        Unique slug
        <input
          name="slug"
          required
          minLength={3}
          maxLength={60}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="your-sports-crowd"
        />
      </label>
      <label>
        Description
        <textarea name="description" maxLength={1500} rows={3} />
      </label>
      <label>
        Community rules
        <textarea
          name="rules"
          maxLength={3000}
          rows={4}
          placeholder="Keep it respectful. Discuss the game, not each other."
        />
      </label>
      <label>
        Visibility
        <select name="visibility" defaultValue="public">
          <option value="public">Public — discoverable by everyone</option>
          <option value="private">Private — unlisted, approval required</option>
        </select>
      </label>
      <p className="muted">
        Private communities are accessible through a shared link. Only approved
        members can see their details.
      </p>
      <label>
        Sport
        <select name="sportId" defaultValue="">
          <option value="">All sports</option>
          {sports.map((sport) => (
            <option value={sport.id} key={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </label>
    </CommunityForm>
  );
}
export function CommunityControl({
  id,
  operation,
  targetId,
  label,
  children,
  confirm,
}: {
  id: string;
  operation: string;
  targetId?: string;
  label: string;
  children?: ReactNode;
  confirm?: string;
}) {
  return (
    <CommunityForm label={label} confirm={confirm}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="operation" value={operation} />
      {targetId && <input type="hidden" name="targetId" value={targetId} />}
      {children}
    </CommunityForm>
  );
}
