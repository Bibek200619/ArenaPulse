'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import {
  register,
  login,
  recover,
  changePassword,
  type FormState,
} from './actions';
const modes = {
  register: {
    title: 'Join the crowd.',
    label: 'Create account',
    action: register,
  },
  login: { title: 'Welcome back.', label: 'Sign in', action: login },
  recover: {
    title: 'Get back in the game.',
    label: 'Send reset email',
    action: recover,
  },
  reset: {
    title: 'A fresh start.',
    label: 'Update password',
    action: changePassword,
  },
};
export function AuthForm({
  mode,
  configured,
}: {
  mode: keyof typeof modes;
  configured: boolean;
}) {
  const selected = modes[mode];
  const [email, setEmail] = useState('');
  const [state, action, pending] = useActionState<FormState, FormData>(
    selected.action,
    {},
  );
  return (
    <section className="auth-panel">
      <p className="eyebrow">YOUR HOME FOR SPORT</p>
      <h1>{selected.title}</h1>
      {!configured ? (
        <p role="status">
          Accounts are not available yet. Please try again later.
        </p>
      ) : null}
      <form action={action} className="form-stack">
        {mode !== 'reset' ? (
          <label>
            Email
            <input
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              disabled={!configured}
            />
          </label>
        ) : null}
        {mode !== 'recover' ? (
          <div className="form-field">
            <label htmlFor="password">
              {mode === 'reset' ? 'New password' : 'Password'}
            </label>
            <input
              id="password"
              aria-describedby="password-help"
              name="password"
              type="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              minLength={12}
              maxLength={128}
              required
              disabled={!configured}
            />
            <small id="password-help">Use at least 12 characters.</small>
          </div>
        ) : null}
        {state.error ? (
          <p role="alert" className="form-error">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p role="status" className="form-success">
            {state.success}
          </p>
        ) : null}
        <button className="button" disabled={pending || !configured}>
          {pending ? 'Please wait…' : selected.label}
        </button>
      </form>
      <div className="auth-links">
        {mode !== 'login' ? (
          <Link href="/login">Already have an account? Sign in</Link>
        ) : (
          <>
            <Link href="/register">Create an account</Link>
            <Link href="/forgot-password">Forgot password?</Link>
          </>
        )}
      </div>
    </section>
  );
}
