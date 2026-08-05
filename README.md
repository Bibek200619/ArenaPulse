# ArenaPulse

**Follow the game. Build your squad. Join the crowd. Predict what comes next.**

ArenaPulse is being developed as a multi-sport discovery, community and fantasy platform. **Current milestone: Phase 0 foundation.** The public UI is an early preview; accounts, live data, community writes and fantasy are not yet implemented. The prediction model is intentionally deferred.

## Run locally

Requires Node 22 (see .nvmrc) and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The foundation does not need external credentials. Never put service-role/secret keys in NEXT_PUBLIC variables.

## Verify

```sh
npx playwright install chromium
npm run check
npm run format:check
```

The check script runs unit, integration, types, lint, production build, then desktop/mobile browser tests against the production server on port 3100. CI runs the same checks. Current integration coverage is the real health route, not database/auth coverage. Database and authenticated journeys are added in Phase 1.

## Project

- src/app: Next.js routes and UI shell
- src/components: reusable presentation/navigation
- src/lib: configuration, safe errors and utility boundaries
- tests: unit/integration/E2E
- docs: product/architecture/security/testing/engineering notes
- legacy/world-cup: original React/Vite demo preserved as reference; unverified sports data, excluded from production

See [plan.md](plan.md), [ARCHITECTURE.md](ARCHITECTURE.md), [deployment](docs/deployment.md), and [contribution guide](CONTRIBUTING.md). Existing GitHub origin redirects from fifa to ArenaPulse; the integration branch remains development.
