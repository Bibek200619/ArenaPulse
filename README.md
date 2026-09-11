# ArenaPulse

**Follow the game. Build your squad. Join the crowd. Predict what comes next.**

ArenaPulse is being developed as a multi-sport discovery, community and fantasy platform. **Current milestone: Phase 5 social foundation.** Authentication, onboarding, demo sports discovery, match/entity pages and private sports follows are implemented. Social persistence is verified locally; its interaction screens are next. Communities, fantasy and personalization remain later milestones. The prediction model is intentionally deferred.

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

Sports foundation: `/matches` displays a fixed fictional multi-sport snapshot through the provider service. `/api/sports` and `/api/matches` include mandatory demo provenance. See [sports data](docs/sports-data.md) and [API contracts](docs/api.md).

Match experience: shareable filters and paginated fixtures lead to `/matches/{id}` with available scores, events, statistics, lineups and standings. See [match behavior](docs/matches.md). No live provider or predictions are configured.

Sports entities: browse teams, players and competitions, then follow them from detail pages or `/settings/sports`. New profiles get an optional sports-picks step. Follow lists are private and stored in Supabase with RLS. See [entity behavior](docs/entities.md).
