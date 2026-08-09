import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig, isAuthConfigured } from '@/lib/supabase/config';
import { callbackDestination } from '@/features/auth/validation';
import { parseEnvironment } from '@/lib/env';
export async function GET(request: NextRequest) {
  const { APP_URL } = parseEnvironment(process.env);
  const failed = () =>
    NextResponse.redirect(new URL('/login?error=invalid_link', APP_URL));
  if (!isAuthConfigured()) return failed();
  const params = request.nextUrl.searchParams;
  const type = params.get('type');
  const code = params.get('code');
  const tokenHash = params.get('token_hash');
  const response = NextResponse.redirect(
    new URL(callbackDestination(type), APP_URL),
  );
  response.headers.set('Cache-Control', 'private, no-store');
  const { url, key } = supabaseConfig();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  if (tokenHash && (type === 'email' || type === 'recovery')) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    return error ? failed() : response;
  }
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    return error ? failed() : response;
  }
  return failed();
}
