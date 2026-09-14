# Testing

npm run test:unit checks invalid environment input and safe errors. npm run test:integration invokes the real health handler. npm run type-check generates route types and runs strict tsc. npm run lint fails on warnings. npm run build builds production. npm run test:e2e starts that production app on 127.0.0.1:3100 and tests Chromium desktop/mobile navigation, 404 status, skip link, width overflow, unavailable predictions, runtime errors and axe WCAG A/AA checks.

npm run check runs all gates sequentially. npm run format:check adds formatting verification. Install browsers once using npx playwright install chromium. Browser reports and traces are ignored and CI uploads failures. Public shell tests do not establish authenticated behavior; use the database/auth suites below. Full keyboard-flow and screen-reader review remains a release gate.

## Identity verification

With isolated local Supabase running, npm run test:db provisions two confirmed users with a local-only admin client and tests all writes/reads through public or user clients: ownership, privacy, username uniqueness, atomic rollback, protected columns and refresh-session revocation. The runner refuses non-local targets. The generated migration must also pass after npx supabase db reset --local --yes.

After npm run db:env and npm run build, npm run test:e2e:auth uses Mailpit and the actual browser UI to register, confirm email, onboard, persist/edit profile, sign out/in, reset password, reject the old password and sign in with the new one on desktop/mobile. It also tests invalid callbacks and input retention. Local test accounts are disposable; database tests clean up their fixtures, browser test accounts remain in the isolated stack until its next reset. No hosted email is sent.

The Next.js-installed docs under node_modules/next/dist/docs are the authority for version-specific APIs; AGENTS.md records this requirement.

## Social database verification

The social suite provisions public/private users and exercises the real PostgREST interface. It checks author joins and visibility-filtered counts, anonymous/forged writes, immutable columns, owner edits/deletes, hidden-post interactions, same-post visible replies, unique reactions, follow privacy, privacy changes, cascades, parallel rate-limit enforcement and aggregate-only sports counts. Fixtures are cleaned up, including internal budgets through auth-user foreign keys. Run the entire database suite after a clean migration replay, then the Supabase security advisor.

The social application adds server-action validation/identity/error tests and a draft-retention component test. Authenticated E2E provisions two users through real registration/confirmation/onboarding, then publishes, follows, likes, comments, replies, changes privacy and deletes an owned post on desktop/mobile. It checks React text escaping, WCAG A/AA, viewport overflow, no client runtime errors and absent private text in full responses. Public E2E covers configured and unconfigured accounts, invalid filters and terminal not-found behavior. Shared indexing assertions require at least one robots tag and reject any directive other than noindex without assuming Next.js emits exactly one tag.

## Community database verification

The community suite exercises real authenticated RPCs and PostgREST reads after a clean migration replay. It verifies atomic creation, unlisted private communities, request approval/rejection/cancellation, role hierarchy, bans, immutable audit records and denied direct mutations for anonymous, authenticated and service-role callers. Concurrent tests cover competing ownership transfers, approval/ban races and per-user write budgets. Anonymous/service-role RPC calls and authenticated identities without profiles are rejected. Existing public and authenticated social browser suites guard against regressions; community UI journeys remain the next milestone.
