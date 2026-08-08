'use client';
import { useActionState } from 'react';
import { saveProfile } from './actions';
import { sports } from './validation';
export type ProfileInput = {
  username: string;
  display_name: string;
  bio: string;
  country: string;
  is_private: boolean;
  favorite_sports: string[];
};
export function ProfileForm({ profile }: { profile?: ProfileInput }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="form-stack">
      <div className="form-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          aria-describedby="username-help"
          name="username"
          defaultValue={profile?.username}
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z][a-zA-Z0-9_]*"
          required
          autoComplete="username"
        />
        <small id="username-help">
          3–24 letters, numbers or underscores; start with a letter.
        </small>
      </div>
      <label>
        Display name
        <input
          name="display_name"
          defaultValue={profile?.display_name}
          maxLength={60}
          required
          autoComplete="nickname"
        />
      </label>
      <label>
        Bio
        <textarea
          name="bio"
          defaultValue={profile?.bio}
          maxLength={280}
          rows={3}
        />
      </label>
      <label>
        Country (optional)
        <input
          name="country"
          defaultValue={profile?.country}
          maxLength={60}
          autoComplete="country-name"
        />
      </label>
      <fieldset>
        <legend>Your sports (optional)</legend>
        <div className="sport-options">
          {sports.map((sport) => (
            <label key={sport}>
              <input
                type="checkbox"
                name="favorite_sports"
                value={sport}
                defaultChecked={profile?.favorite_sports.includes(sport)}
              />
              {sport}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="is_private"
          defaultChecked={profile?.is_private}
        />
        Keep my profile private
      </label>
      {state.error ? (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      ) : null}
      <button className="button" disabled={pending}>
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
