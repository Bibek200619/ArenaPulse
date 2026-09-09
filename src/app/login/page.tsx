import { startGoogleSignIn } from '@/features/auth/actions';
import { AuthForm } from '@/features/auth/auth-form';
import { isAuthConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      {params.error ? (
        <p role="alert" className="auth-alert">
          That link is invalid or expired. Please request a new one.
        </p>
      ) : null}
      <AuthForm mode="login" configured={isAuthConfigured()} />
      {isAuthConfigured() && process.env.GOOGLE_OAUTH_ENABLED === 'true' ? (
        <form action={startGoogleSignIn} className="auth-panel oauth-form">
          <button className="button secondary">Continue with Google</button>
        </form>
      ) : null}
    </>
  );
}
