'use client';
import { useActionState, useState, startTransition } from 'react';
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
  const [values, setValues] = useState<ProfileInput>(
    profile ?? {
      username: '',
      display_name: '',
      bio: '',
      country: '',
      is_private: false,
      favorite_sports: [],
    },
  );
  const update = <K extends keyof ProfileInput>(
    key: K,
    value: ProfileInput[K],
  ) => setValues((current) => ({ ...current, [key]: value }));
  return (
    <form
      action={action}
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        // Dispatch manually to preserve edited fields when the server rejects a save.
        startTransition(() => action(form));
      }}
    >
      <input
        type="hidden"
        name="onboarding"
        value={profile ? 'false' : 'true'}
      />
      <div className="form-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          aria-describedby="username-help"
          name="username"
          value={values.username}
          onChange={(event) => update('username', event.target.value)}
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
          value={values.display_name}
          onChange={(event) => update('display_name', event.target.value)}
          maxLength={60}
          required
          autoComplete="nickname"
        />
      </label>
      <label>
        Bio
        <textarea
          name="bio"
          value={values.bio}
          onChange={(event) => update('bio', event.target.value)}
          maxLength={280}
          rows={3}
        />
      </label>
      <label>
        Country (optional)
        <input
          name="country"
          value={values.country}
          onChange={(event) => update('country', event.target.value)}
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
                checked={values.favorite_sports.includes(sport)}
                onChange={(event) =>
                  update(
                    'favorite_sports',
                    event.target.checked
                      ? [...values.favorite_sports, sport]
                      : values.favorite_sports.filter(
                          (value) => value !== sport,
                        ),
                  )
                }
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
          checked={values.is_private}
          onChange={(event) => update('is_private', event.target.checked)}
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
