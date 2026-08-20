# Testing

npm run test:unit checks invalid environment input and safe errors. npm run test:integration invokes the real health handler. npm run type-check generates route types and runs strict tsc. npm run lint fails on warnings. npm run build builds production. npm run test:e2e starts that production app on 127.0.0.1:3100 and tests Chromium desktop/mobile navigation, 404 status, skip link, width overflow, unavailable predictions, runtime errors and axe WCAG A/AA checks.

npm run check runs all gates sequentially. npm run format:check adds formatting verification. Install browsers once using npx playwright install chromium. Browser reports and traces are ignored and CI uploads failures. Public shell tests do not establish authenticated behavior; use the database/auth suites below. Full keyboard-flow and screen-reader review remains a release gate.

## Identity verification

With isolated local Supabase running, npm run test:db provisions two confirmed users with a local-only admin client and tests all writes/reads through public or user clients: ownership, privacy, username uniqueness, atomic rollback, protected columns and refresh-session revocation. The runner refuses non-local targets. The generated migration must also pass after npx supabase db reset --local --yes.

After npm run db:env and npm run build, npm run test:e2e:auth uses Mailpit and the actual browser UI to register, confirm email, onboard, persist/edit profile, sign out/in, reset password, reject the old password and sign in with the new one on desktop/mobile. It also tests invalid callbacks and input retention. Local test accounts are disposable; database tests clean up their fixtures, browser test accounts remain in the isolated stack until its next reset. No hosted email is sent.

The Next.js-installed docs under node_modules/next/dist/docs are the authority for version-specific APIs; AGENTS.md records this requirement.

## Social database verification

The social suite provisions public/private users and exercises the real PostgREST interface. It checks author joins and visibility-filtered counts, anonymous/forged writes, immutable columns, owner edits/deletes, hidden-post interactions, same-post visible replies, unique reactions, follow privacy, privacy changes, cascades, parallel rate-limit enforcement and aggregate-only sports counts. Fixtures are cleaned up, including internal budgets through auth-user foreign keys. Run the entire database suite after a clean migration replay, then the Supabase security advisor.
