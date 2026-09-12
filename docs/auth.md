# Authentication and profiles

Email/password signup requires email confirmation. The callback accepts a Supabase token hash with type email/recovery or a PKCE code. Its destination is fixed to onboarding or password reset; arbitrary next URLs are ignored. Passwords require 12–128 characters. Recovery responds uniformly to avoid account enumeration, then updates the password under a verified user session and revokes refresh sessions.

Supabase SSR uses a new server client per request. Proxy refreshes claims/cookies and sets private no-store caching; protected pages and actions independently call getUser. Browser clients use only publishable keys. RLS derives ownership from auth.uid(), never browser form IDs or editable user_metadata. Next.js Server Actions enforce origin/host matching and a default 1MB body limit. Supabase auth rate limits are configured locally; production needs SMTP, CAPTCHA/abuse settings and per-deployment rate-limit review.

Onboarding atomically writes profiles and private profile_preferences through a security-invoker RPC. Username is lowercase and unique with a database check. Users may skip favorite sports and change them later. Team/competition/player preferences attach to the sports catalog in Phase 2. Public profiles exclude emails and preferences; is_private hides the profile from other users and anonymous visitors.

## Local development

npm run db:start starts the task-specific ArenaPulse stack on 55431 (API), 55432 (database), 55434 (Mailpit). npm run db:env creates ignored .env.local with public values only and refuses to overwrite it. Open the application at http://127.0.0.1:3000. Confirmation/recovery emails remain in the local inbox and are never sent externally.

## Hosted setup

Set APP_URL to the exact HTTPS origin, configure Supabase site URL and callback allowlist, and copy supabase/templates/confirmation.html and recovery.html into the corresponding hosted email templates. Enable email confirmations and set minimum password length to 12. Templates use RedirectTo plus token_hash/type; do not replace with an implicit-flow URL. Configure production SMTP and verify actual delivery before release.

Google OAuth entry is implemented behind GOOGLE_OAUTH_ENABLED=false. To enable it, configure the Google provider and credentials in the same Supabase project, then enable the flag. It uses the same PKCE callback. No Google credentials are embedded or committed; hosted OAuth is not claimed tested locally. Magic links are optional and not included in this milestone.

## Limits

Signout revokes refresh sessions but an already-issued access token remains valid until expiry (local default one hour). Protected server operations use getUser; do not claim immediate JWT revocation at the database. Advanced account deletion/MFA and media uploads belong to subsequent settings/security work.

After initial profile creation, `/onboarding/sports` offers optional team/competition/player follows. Choices save individually; Continue reaches the profile without forcing selections. Existing profile edits keep returning to `/profile`. `/settings/sports` edits favorites later.
