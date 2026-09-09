# API

GET /api/health returns 200 with {"status":"ok","application":"ArenaPulse"}, Cache-Control: no-store. This is liveness, not backend readiness.

API errors use {"error":{"code":"...","message":"..."}} with VALIDATION_ERROR 400, AUTHENTICATION_REQUIRED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, RATE_LIMITED 429, EXTERNAL_PROVIDER_ERROR 502, SERVICE_NOT_CONFIGURED 503 and INTERNAL_ERROR 500. Unknown errors never expose internal messages.

Auth uses validated server actions and /auth/callback; see auth.md. Social/fantasy/prediction routes remain future milestones.

## Sports reads

- GET `/api/sports`: public catalog containing sports, competitions, seasons, teams and players, plus provenance. Cache-Control: public, max-age=60. Currently a bounded demo catalog; remote catalogs will require pagination before enabling ingestion at scale.
- GET `/api/matches`: public `{data: {items, total, offset, limit}, provenance}`. Optional filters: sportId/competitionId (UUID), state (scheduled/live/paused/finished/postponed/cancelled/abandoned), date (YYYY-MM-DD in UTC). offset defaults 0, maximum 10000; limit defaults 20, range 1–50. Unknown filters and invalid values return 400. Cache-Control: public, max-age=15.

All sports values are fictional demo data until a licensed provider is configured. `observedAt` refers to the fixed snapshot; `fetchedAt` refers to retrieval. Do not strip provenance when rendering these responses.

## Match details

GET `/api/matches/{id}` returns `{data: Match, provenance}` with public max-age=15. IDs must be UUIDs (400 when malformed, 404 when absent). Match includes participants, events, statistics and available lineups. `/api/matches` also supports `startsAfter` (ISO UTC datetime) for inclusive upcoming cutoffs; combine with state=scheduled. Scores remain sport-specific strings or null.
