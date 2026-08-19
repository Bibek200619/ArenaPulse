'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { serverClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
import { parseEnvironment } from '@/lib/env';
import {
  credentialsSchema,
  emailSchema,
  passwordSchema,
  profileSchema,
} from './validation';
import { requireUser } from './session';
export type FormState = { error?: string; success?: string };
const publicFailure = (error: unknown): FormState => ({
  error:
    error instanceof AppError
      ? error.message
      : 'The service is unavailable. Please try again.',
});
export async function register(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const client = await serverClient();
    const { APP_URL } = parseEnvironment(process.env);
    const { error } = await client.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${APP_URL}/auth/callback` },
    });
    if (error)
      return {
        error:
          'Unable to create an account. Check your details or try again later.',
      };
    return {
      success:
        'Check your email to confirm your account, then complete your profile.',
    };
  } catch (error) {
    return publicFailure(error);
  }
}
export async function login(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const client = await serverClient();
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        error:
          'Unable to sign in. Check your email, password and email confirmation.',
      };
  } catch (error) {
    return publicFailure(error);
  }
  redirect('/profile');
}
export async function logout() {
  const client = await serverClient();
  const { error } = await client.auth.signOut();
  if (error)
    throw new AppError(
      'EXTERNAL_PROVIDER_ERROR',
      'Unable to sign out. Please try again.',
    );
  redirect('/login');
}
export async function recover(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Enter a valid email address.' };
  try {
    const client = await serverClient();
    const { APP_URL } = parseEnvironment(process.env);
    await client.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${APP_URL}/auth/callback`,
    });
    // Always use the same response to avoid account enumeration.
    return {
      success: 'If this account exists, a password reset email is on its way.',
    };
  } catch (error) {
    return publicFailure(error);
  }
}
export async function changePassword(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { client } = await requireUser();
  const { error } = await client.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return {
      error:
        'Unable to update your password. Request a new recovery email and try again.',
    };
  // Revoke refresh sessions after password recovery; user signs in again.
  const { error: signOutError } = await client.auth.signOut();
  if (signOutError)
    return { error: 'Password updated. Please sign out and sign in again.' };
  redirect('/login');
}
export async function saveProfile(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    ...Object.fromEntries(form),
    favorite_sports: form.getAll('favorite_sports'),
    is_private: form.get('is_private') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { client } = await requireUser();
  const { error } = await client.rpc('save_profile', {
    p_username: parsed.data.username,
    p_display_name: parsed.data.display_name,
    p_bio: parsed.data.bio,
    p_country: parsed.data.country,
    p_favorite_sports: parsed.data.favorite_sports,
    p_is_private: parsed.data.is_private,
  });
  if (error)
    return {
      error:
        error.code === '23505'
          ? 'That username is already taken.'
          : 'Unable to save your profile. Please try again.',
    };
  revalidatePath('/profile');
  if (form.get('onboarding') === 'true') redirect('/onboarding/sports');
  redirect('/profile');
}

export async function startGoogleSignIn() {
  const env = parseEnvironment(process.env);
  if (env.GOOGLE_OAUTH_ENABLED !== 'true')
    throw new AppError(
      'SERVICE_NOT_CONFIGURED',
      'Google sign-in is not enabled.',
    );
  const client = await serverClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${env.APP_URL}/auth/callback` },
  });
  if (error || !data.url)
    throw new AppError(
      'EXTERNAL_PROVIDER_ERROR',
      'Unable to start Google sign-in.',
    );
  redirect(data.url);
}
