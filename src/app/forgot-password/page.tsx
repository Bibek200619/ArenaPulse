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
      <AuthForm mode="recover" configured={isAuthConfigured()} />
    </>
  );
}
