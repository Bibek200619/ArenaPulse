import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAuthConfigured, supabaseConfig } from '@/lib/supabase/config';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Auth/profile pages and actions must never be shared through a CDN.
  response.headers.set('Cache-Control', 'private, no-store');
  if (!isAuthConfigured()) return response;
  const { url, key } = supabaseConfig();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, cacheHeaders) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
        response.headers.set('Cache-Control', 'private, no-store');
      },
    },
  });
  await client.auth.getClaims();
  return response;
}
export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/onboarding',
    '/profile/:path*',
    '/auth/:path*',
    '/settings/:path*',
  ],
};
