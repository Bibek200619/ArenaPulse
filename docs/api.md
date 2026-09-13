# API

GET /api/health returns 200 with {"status":"ok","application":"ArenaPulse"}, Cache-Control: no-store. This is liveness, not backend readiness.

API errors use {"error":{"code":"...","message":"..."}} with VALIDATION_ERROR 400, AUTHENTICATION_REQUIRED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, RATE_LIMITED 429, EXTERNAL_PROVIDER_ERROR 502, SERVICE_NOT_CONFIGURED 503 and INTERNAL_ERROR 500. Unknown errors never expose internal messages.

Auth uses validated server actions and /auth/callback; see auth.md. Fantasy/prediction routes remain future milestones.

## Sports reads

- GET `/api/sports`: public catalog containing sports, competitions, seasons, teams and players, plus provenance. Cache-Control: public, max-age=60. Currently a bounded demo catalog; remote catalogs will require pagination before enabling ingestion at scale.
- GET `/api/matches`: public `{data: {items, total, offset, limit}, provenance}`. Optional filters: sportId/competitionId (UUID), state (scheduled/live/paused/finished/postponed/cancelled/abandoned), date (YYYY-MM-DD in UTC). offset defaults 0, maximum 10000; limit defaults 20, range 1–50. Unknown filters and invalid values return 400. Cache-Control: public, max-age=15.

All sports values are fictional demo data until a licensed provider is configured. `observedAt` refers to the fixed snapshot; `fetchedAt` refers to retrieval. Do not strip provenance when rendering these responses.

## Match details

GET `/api/matches/{id}` returns `{data: Match, provenance}` with public max-age=15. IDs must be UUIDs (400 when malformed, 404 when absent). Match includes participants, events, statistics and available lineups. `/api/matches` also supports `startsAfter` (ISO UTC datetime) for inclusive upcoming cutoffs; combine with state=scheduled. Scores remain sport-specific strings or null.

Entity reads: `/api/matches` accepts optional UUID `teamId` and `playerId`; team filters use actual participants, player filters use individual participants or available lineup/event references. Follow changes use validated server actions (`kind`, `id`, `operation`) with verified identity and database RLS, never a browser-supplied owner ID.

Social reads use server components and typed repository queries; there is no additional public REST mutation surface. `changeSocial` accepts a validated discriminated operation: post, delete-post, comment, delete-comment, like/unlike or follow/unfollow. Content/target IDs are validated; actor identity is always derived server-side. Responses contain safe error/success state and an optional created post ID, never raw database errors. Database rate limits return a retry-after-one-minute message. See social.md for pagination, visibility and future notification contracts.
