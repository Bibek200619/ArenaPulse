# ArenaPulse implementation roadmap

Created 2026-09-09. All commits use actual timestamps. The earlier venues plan is preserved in Git and will be copied to docs/legacy-venues-plan.md.

## 1. Product overview

**Follow the game. Build your squad. Join the crowd. Predict what comes next.** ArenaPulse brings multi-sport discovery, communities, fantasy, personalization and future match intelligence into one product.

## 2. Objectives

Complete sports discovery, social communities, fantasy and personalization for v1. Prepare prediction architecture only. Work in reviewable milestones with real verification; foundations and placeholders never count as completed features.

## 3. Functional requirements

Authentication (registration/login/logout/recovery/session persistence), unique profiles, lightweight sport/league/team/player onboarding; fixtures/live/results/statistics/standings; team/player/user follows; posts/comments/replies/reactions; public/private communities, join requests, owner/admin/moderator/member roles, rules/pins/bans/reports/audit; realtime match discussions; configurable fantasy squads/captains/budgets/deadlines/scoring/private leagues/rankings; personalized feed, notification preferences/center; debounced paginated global search; account/profile/appearance/privacy/sports/blocks/security settings. Predictions remain visibly unavailable until a genuine custom model is configured.

## 4. Non-functional requirements

Strict types, modular services, validated API boundaries, predictable safe errors, least privilege, RLS, bounded indexed queries, explicit data freshness, responsive layouts, keyboard access, loading/error/empty states, secret-free structured logging. Target WCAG 2.2 AA and measure accessibility; automated checks alone are not certification.

## 5. Technology stack

Next.js App Router, React, TypeScript, Tailwind, accessible reusable UI primitives (shadcn/ui as needed); Supabase PostgreSQL/Auth/Storage/Realtime; Zod; Vitest/Testing Library/Playwright; npm lockfile; GitHub Actions. Future Python inference service with FastAPI-compatible contracts; no final ML dependencies/algorithm selected.

Baseline inspection: commit 618c07c on development, origin Bibek200619/fifa. Existing React/Vite demo has three source files, hand-written pathname routing and no backend, TypeScript, tests or CI. Existing Graphify graph is stale. No Sites hosting configuration. Migrate to Next.js for server functionality; preserve original demo under legacy/world-cup. Original untracked package-lock.json and PLAN.md backed up in /private/tmp before changing application files.

## 6. System architecture

Browser → Next.js pages/actions/route handlers → domain services → repositories/provider adapters → Supabase or sports provider. Server Components for reads; small Client Components for interaction/realtime. Domain services do not depend on React. Modular monolith initially; dedicated Python inference later. UI never calls an external sports API directly. Validate writes server-side even when client validation exists.

## 7. Database architecture

UUIDs, timestamptz, foreign keys, check/unique constraints, indexed ownership/filter columns. Incremental migrations with default-deny RLS and explicit grants on every exposed table.

- Identity/preferences: profiles, favorite sports/competitions, team_follows, player_follows, user_follows.
- Sports: sports, competitions, seasons, teams, players, venues, matches, match_participants, match_events, match_statistics, standings; external provider ID mappings.
- Community/social: communities, community_members, community_join_requests, community_bans, posts, comments, reactions, reports, blocks, moderation_audit.
- Fantasy: fantasy_competitions, fantasy_rules, fantasy_gameweeks, fantasy_teams, fantasy_team_members, fantasy_scores, fantasy_leagues, fantasy_league_members.
- Notifications: notifications, notification_preferences, transactional outbox/deduplication.
- Future ML: prediction_models, prediction_model_versions, prediction_features, prediction_requests, predictions, prediction_results/evaluations.
  Use relational constraints for ownership/membership; JSON only for versioned sport-specific statistics/features/rules. No football-only participant assumptions.

## 8. Authentication strategy

Supabase SSR cookies with separate server/browser clients and verified identity on protected operations. Profile keyed to auth.users; case-insensitive unique usernames. Restrict callback destinations to allowed local paths. Email confirmation/recovery and optional Google configuration documented. Never authorize from editable user_metadata. Public shell works without credentials; account operations fail honestly when unconfigured. Test full auth against isolated local Supabase and its email inbox; mocks are not real auth evidence.

## 9. Sports data architecture

SportsDataProvider supports sports, competitions, fixtures/live/match, teams, players and standings. Deterministic fictional seeded adapter first; external adapters independently configured. Provenance includes source/demo, fetchedAt and freshness. Bound cache TTL, deduplicate, timeout and budget requests; label all fallback data. Match states: scheduled/live/paused/finished/postponed/cancelled/abandoned. Missing scores/statistics stay null. Never present the legacy dataset as verified current sports data.

## 10. Community architecture

Explicit permission matrix in domain logic and RLS. Private content requires membership; join requests confer no access. Browser role values cannot grant privileges. Owner transfer/moderation transactional and audited. Enforce bans/blocks on appropriate reads/writes, constrain replies to actual parent and paginate discussions.

## 11. Fantasy architecture

Version rules per competition/gameweek: budget, size, positions, team caps, captain/vice multipliers, transfers and deadline. Validate against authoritative prices/rules/time within atomic save. Score stable normalized event IDs idempotently with rule version and correction support. Unpredictable private join codes, membership-scoped league visibility, deterministic ties and rank-change baseline. No money, betting or prizes in v1.

## 12. Notification architecture

Domain event → transactional outbox → preference-aware dispatcher → recipient-owned notifications → scoped realtime/UI. Deduplicate replays. Match/fantasy reminder jobs use explicit time zones. In-app first; email/push dispatch only with configured providers. Never claim delivery from a queued event.

## 13. Future ML architecture

Sports Data → Feature Engineering → Feature Store → Custom ML Model → Prediction Service → Backend API → UI. Version feature schemas/snapshots, model metadata/artifacts, registry, request correlation, history and evaluation. Phase 12 creates ml/{datasets,features,training,evaluation,models,experiments} and contracts/readmes only. No training, algorithm, random output or LLM-generated predictions.

## 14. Testing strategy

Per milestone: unit → integration → type-check → lint → production build → relevant E2E. Unit: validation, permissions, cache, scoring/ranks. Integration: actual route handlers/service adapters and real isolated Supabase auth/policy/write tests. E2E: mobile/desktop public journeys and two-user authenticated journeys. Mocks are contract coverage only. Every failure gets a docs/engineering microplan containing test/expected/actual/root cause/fix and rerun checklist. Do not skip or weaken security tests.

## 15. Deployment architecture

Separate local/test/staging/production. Next.js compatible Node hosting; Supabase per environment. Document non-secret variable names in .env.example. CI uses npm ci and all gates. Test migrations before applying them with backup/rollout plan. No remote deployment or database mutation until target identity is known. Repository branch-protection settings require separate verification.

## 16. Security considerations

RLS plus server authorization; no service keys in browser; explicit grants and ownership checks; validate pagination/IDs/content/URLs/usernames/squads; origin/CSRF controls; provider/auth/write rate limits; safe text rendering without arbitrary HTML; restricted upload MIME/size/path. No credentials, tokens or raw bodies in logs. Test IDOR, private-content leakage, role escalation, fantasy ownership/deadlines, private-league visibility. Pin dependencies and audit.

## 17. Git workflow

Preserve development integration branch and existing origin. First commit only plan.md, then feat/project-foundation. Subsequent feat/auth, feat/sports-foundation, feat/matches etc. Small genuine commits and truthful timestamps; 6–8/day only when work warrants. Milestone PRs target development or documented stacked prerequisites. Do not merge unrelated work. PR sections: Summary, Motivation, Changes, Testing, Screenshots, Database Changes, Security Impact, Risks, Follow-Ups. Link meaningful issues. If publishing is blocked, preserve commits and exact blocker; never claim a PR exists.

## 18. Phase breakdown

| Phase | Deliverable / acceptance                                                                                      | Status      |
| ----- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| 0     | Plan, preserved legacy, Next/TS shell, env validation/docs/CI and green lint/types/unit/integration/build/E2E | COMPLETE    |
| 1     | Supabase migrations/RLS, register/login/logout/recovery, profiles/onboarding; full flow tested                | COMPLETE    |
| 2     | Generic sports/provider/seed/cache with integration and outage coverage                                       | NOT_STARTED |
| 3     | Match filters/list/detail/timeline/available stats; navigation E2E                                            | NOT_STARTED |
| 4     | Team/player/competition pages, standings and secured follows                                                  | NOT_STARTED |
| 5     | Profiles/follows/posts/comments/reactions/feed with ownership tests                                           | NOT_STARTED |
| 6     | Public/private communities, roles/membership/moderation and adversarial RLS tests                             | NOT_STARTED |
| 7     | Two-user realtime match discussion/replies/reactions/moderation                                               | NOT_STARTED |
| 8     | Rules/gameweeks/squad builder; persist valid roster, budget, captain and deadline enforcement                 | NOT_STARTED |
| 9     | Reproducible idempotent scoring, private leagues/codes, leaderboards                                          | NOT_STARTED |
| 10    | Notifications/preferences, personalized dashboard, reminder architecture                                      | NOT_STARTED |
| 11    | Search/settings, responsive/a11y/performance/loading/empty/error polish                                       | NOT_STARTED |
| 12    | Prediction contracts/schema/registry/flag/history/docs; unavailable model handling only                       | NOT_STARTED |
| 13    | Full journey/security/integration verification and release readiness                                          | NOT_STARTED |

Desired Aug 5–20 schedule: work 5–6, rest 7; work 8–10, rest 11; work 12–16, rest 17–18; work 19–20. Actual date is September 9, 2026. This is sequencing guidance, not backdating or a claim of elapsed engineering days. No automatic work schedule is created.

## 19. Acceptance criteria

Every phase needs readable implementation, correct types, passing appropriate tests/lint/build, docs, migrations/security review where applicable, commits and milestone PR (or an explicit publishing blocker). Final journeys:
A: register → favorites → personalized home → match → follow team.
B: search community → join → post → comment → reaction notification.
C: match → discussion → reply with two authenticated users.
D: fantasy competition → valid captain/squad save → private league → leaderboard.
E: predictions → coming soon → model_not_configured response with prediction null.
Final release also needs visual/keyboard/accessibility review, RLS adversarial tests, secret scan, docs/changelog, linked issues/PRs and deployment documentation. Placeholders do not satisfy feature acceptance.

## 20. Risk register

| Risk                                   | Mitigation / release effect                                              |
| -------------------------------------- | ------------------------------------------------------------------------ |
| Large scope                            | Sequential tested milestones; never label foundation as finished product |
| GitHub CLI token invalid on inspection | Check connected app/SSH; record exact publishing blocker                 |
| Supabase target not identified         | Inspect local tooling; isolate DB; do not guess a production target      |
| Sports licensing/quotas/outages        | Provider isolation, explicit provenance, labeled demo fallback           |
| RLS/private content escalation         | Default deny, explicit grants, outsider/two-user tests                   |
| Fantasy ambiguity                      | Configurable published demo rules, deterministic scoring                 |
| Realtime cost/fan-out                  | Scoped subscriptions, bounded histories and polling fallback             |
| Missing ML requirements                | Contracts only and flag disabled                                         |
| Unverified legacy sports data          | Preserve as reference only                                               |
| Environment/dependency failures        | Locked releases and microplan recovery with actual evidence              |

## 21. Known assumptions

Keep repository identity/branch convention. English first; UTC storage/localized display. Demo fixtures are fictional and labeled. No paid cloud provisioning or selecting unrelated existing projects. Local public pages start without external credentials. Unavailable services remain explicitly unavailable. Preserve original files and untracked lockfile backup before migration.

## 22. Deferred features

Custom ML model/training/inference; gambling/payments; real-money fantasy; licensed provider selection pending access/terms; native apps; advanced anti-abuse; push/email delivery without configuration; recommendation ML. Basic privacy/moderation/security are mandatory.

## 23. Future ML integration plan

Owner supplies sports/outcomes/horizon, data rights, evaluation splits/metrics and latency constraints. Freeze feature schemas/leakage safeguards; register artifact/checksum/version; implement inference adapter; validate offline evaluation/calibration; stage shadow traffic; enable server flag after approved evaluation. Record snapshot/model/request/history/observed outcome. Missing-model response remains usable during outages.

## Milestone log

Phase: 0
Status: COMPLETE
Completed: Next.js/TypeScript shell, explicit navigation routes, legacy preservation, validated environment, safe errors, health route, docs, CI, desktop/mobile visual review.
Tests: 10 unit and 1 integration passed; types/lint/build passed; all 6 final desktop/mobile E2E cases passed after explicit routing refactor. npm audit reports zero vulnerabilities.
Known Issues: source-free .next cache required clearing after sandbox worker panic; no backend configured. GitHub access verified, tracking issue #1 created.
Deferred: production features remain phases 1–13; custom ML intentionally unimplemented.
Next Phase: publish foundation PR then Phase 1 database/authentication.

## Phase 1 — identity milestone

Phase: 1
Status: COMPLETE
Completed: verified SSR auth, registration/confirmation, login/logout, recovery/password replacement, profiles/private preferences, atomic onboarding, edit/privacy controls, generated migration/types, fixed least-privilege grants after clean replay, optional Google OAuth entry, CI database/browser job.
Tests: PASS — 20 unit/component, 1 route integration, 8 real local Supabase identity/RLS tests, 6 public desktop/mobile E2E, 4 real auth desktop/mobile E2E, type-check, lint, build, formatting; security advisor clear and npm audit zero vulnerabilities. Migration replay verified. Foundation PR #2 CI green.
Known Issues: hosted SMTP/OAuth/deployment not configured or claimed tested. Local auth port 55431 and inbox 55434. Google OAuth entry remains off. Team/competition/player onboarding preferences depend on the Phase 2 sports catalog.
Deferred: sports/social/community/fantasy/notification milestones and final custom ML model.
Next Phase: publish identity PR linked to issue #3, then Phase 2 sports foundation.
