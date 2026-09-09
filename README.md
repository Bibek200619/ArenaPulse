# ArenaPulse

**Follow the game. Build your squad. Join the crowd. Predict what comes next.**

ArenaPulse is being developed as a multi-sport discovery, community and fantasy platform. **Current milestone: authentication and onboarding.** The public foundation and real Supabase account flows are implemented. Sports data, communities, fantasy and personalization are subsequent milestones. The prediction model is intentionally deferred.

## Run locally

Requires Node 22 (see .nvmrc) and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The public shell does not need external credentials. For accounts, run `npm run db:start` and `npm run db:env` before starting Next.js; the latter creates `.env.local` and refuses to overwrite an existing file. See [authentication setup](docs/auth.md). Never put service-role/secret keys in NEXT_PUBLIC variables.

## Verify

```sh
npx playwright install chromium
npm run check
npm run format:check
```

The check script runs unit, integration, types, lint, production build, then desktop/mobile browser tests against the production server on port 3100. CI runs the same checks. Run `npm run test:db` for real local RLS/auth integration and `npm run test:e2e:auth` after a configured build for confirmation/onboarding/recovery browser journeys. Both have dedicated CI coverage.

## Project

- src/app: Next.js routes and UI shell
- src/components: reusable presentation/navigation
- src/lib: configuration, safe errors and utility boundaries
- tests: unit/integration/E2E
- docs: product/architecture/security/testing/engineering notes
- legacy/world-cup: original React/Vite demo preserved as reference; unverified sports data, excluded from production

See [plan.md](plan.md), [ARCHITECTURE.md](ARCHITECTURE.md), [deployment](docs/deployment.md), and [contribution guide](CONTRIBUTING.md). Existing GitHub origin redirects from fifa to ArenaPulse; the integration branch remains development.
