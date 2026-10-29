# Phase 6 community content verification

## Validation results

- Type check: pass.
- Lint: pass.
- Unit tests: 64 passed.
- Integration tests: 9 passed.
- Production build: pass.
- Public desktop/mobile browser tests: 18 passed.
- Prettier check for changed Markdown, TypeScript and test files: pass.
- Repository-wide `npm run format:check`: reports 192 files in this Windows checkout. The untouched files are checked out with CRLF while the project formatter defaults to LF; changed task files pass individually. Confirm in the Linux CI checkout before treating this as a source formatting failure.
- `npm audit --omit=dev`: reports four production dependency advisories, including a critical Next.js 16.3.4 advisory and high advisories for sharp, source-map-js and zod. Dependency upgrades are outside issue #21 and remain a separate release security follow-up.
- Local database startup: blocked. `npm run db:start` could not start the Supabase stack. Docker and Podman executables, local PostgreSQL tools, and a listener on port 55431 are absent.
- Migration replay, security advisors and real database tests: not run because the isolated database is unavailable.
- New authenticated community post/report/pin/removal and block/unblock browser journeys: added but not run because they require the same local Supabase and Mailpit services.
- The production dependency advisories are tracked separately in GitHub issue #33.

## Database rerun checklist

- [ ] Install/start Docker Desktop (or provide a working compatible container runtime).
- [ ] Run `npm run db:start` and confirm the isolated Supabase API is `http://127.0.0.1:55431`.
- [ ] Run `npm run db:env`, `npm run test:db`, and `npx supabase db advisors --local --type security --fail-on error`.
- [ ] Fix any SQL, RLS, grant, migration replay or database-test failures, then rerun all affected checks.
- [ ] Run authenticated community desktop/mobile journeys for posting, reporting, pinning and moderation.

The issue remains open until these database and authenticated browser checks pass.
