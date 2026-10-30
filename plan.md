# ArenaPulse implementation roadmap

## Active micro-plan — login, SportScore live data, and fantasy follow-up (2026-10-31)

### Scope and sequence

- [x] Login/account creation: inspect current auth actions, Supabase configuration, redirects, and browser flows. Found that sign-in incorrectly enforced the 12-character *new-password* minimum and that missing APP_URL defaulted to localhost in hosted deployments. Separate sign-in validation and resolve trusted Vercel callback hosts over HTTPS; keep actionable generic provider errors and never expose credentials.
- [x] SportScore: inspect the existing server-only provider and deployment/environment wiring. The adapter and UI are already implemented under issue #37; local configuration is explicitly `demo`, and no API key is configured in this task worktree. Validate actual live provider behavior during the integration phase, without printing the previously supplied credential; if the credential is rejected, request a replacement and keep it server-only.
- [x] Fantasy: inspect GitHub for the current/open fantasy-team PR and issue status. Issue #26 (scoring, private leagues, leaderboards) and PR #42 are already completed/merged; GitHub currently lists no open Fantasy issue or PR. Do not duplicate completed work. A new issue needs an agreed feature scope before one can be created.
- [x] Once all three implementation tracks are complete, run the relevant integration tests together, then the complete required local verification suite and inspect GitHub/Vercel checks.
- [x] If any check is red, add a small, specific corrective micro-plan here, fix it, and rerun the affected integration and verification checks.
- [x] After local checks were green, commit and push the task branch; do not start another unrelated roadmap issue without user direction.
- [ ] Open a PR linked to an issue, set reviewer/assignee/labels, and inspect remote checks; GitHub API access currently returns 401. Close issues only after verified merge.

### Verification targets

- [x] Login and account creation work in real authenticated desktop/mobile journeys, including useful error states.
- [x] SportScore live matches/results render from the configured server-side API without exposing the key; handle provider rejection, unavailable service, and empty response honestly.
- [x] Fantasy team PR scope works end-to-end and respects existing ownership, scoring, private league, and deadline rules.
- [x] Integration tests, database/security checks where relevant, unit tests, type-check, lint, format, production build, public browser tests, and authenticated browser tests pass.

### Initial findings

PR #42 for fantasy scoring/private leagues was merged and issue #26 closed. The next fantasy-related PR/issue must be confirmed from GitHub before modifying fantasy scope. The existing workspace has uncommitted user files; implementation will use an isolated task branch/worktree and preserve those files.

### Validation cycle 0 (scope and diagnosis)

GitHub's public issues endpoint reports no open Fantasy item and no open PRs; open work is #27–#30 and #33. The authenticated GitHub credential returned 401, so publishing changes may require the user to reconnect GitHub. Auth inspection identified the legacy-password sign-in blocker and localhost callback default; the Vercel environment hostname is trusted deployment configuration and the request Host header is never used. Local `.env.local` selects demo and has no SportScore key. Fantasy #26 / PR #42 are complete and closed.

### Validation cycle 1 (implementation)

Separated sign-in's accepted password length from the stricter password-creation/reset rule. Callback URL resolution now prefers explicit APP_URL, otherwise uses HTTPS VERCEL_URL, allows localhost default only outside production, and errors in production when neither trusted source exists. Added focused environment/auth validation cases and updated hosted auth setup guidance. SportScore adapter remains server-only and unchanged until integration validation determines whether endpoint behavior needs a code change.

### Corrective micro-plan (focused verification failure)

- [x] Reject a malformed VERCEL_URL explicitly instead of treating it as absent and falling back to localhost.
- [x] Rerun the focused environment/auth/provider tests and integration suite; proceed only when green.

### Corrective micro-plan (production build configuration failure)

- [ ] Do not reject an explicitly configured localhost APP_URL during build/type generation; production without either APP_URL or VERCEL_URL must still fail rather than infer localhost.
- [ ] Update tests and hosted setup wording to match the distinction.
- [x] Rerun the focused environment tests, integration tests, and full required check suite.

### Corrective micro-plan (final formatting review)

- [x] Apply Prettier only to the changed source, test, and auth documentation files; leave unrelated roadmap formatting intact.
- [x] Restore test-generated screenshot changes and confirm `git diff --check` plus focused formatting are green.

Validation cycle 2 (integration and quality): SportScore's keyless football endpoint returned HTTP 200 with 10 records. With `SPORTS_DATA_PROVIDER=sportscore` supplied only to a temporary local app process, `/api/matches` returned 50 validated non-demo football records and `/matches?sportId=<football UUID>` rendered SportScore provenance, attribution and fixture rows. Unit 81/81, integration 9/9, type-check, lint, build, public desktop/mobile E2E 18/18, focused auth/provider tests 28/28, auth integration tests 9/9, and authenticated browser journeys 14/14 passed. Targeted Prettier and `git diff --check` passed. No database changes were made. GitHub reports no open PRs and no open Fantasy issue; the stored GitHub API credential returned 401, so remote checks cannot be inspected. The runtime SportScore API is keyless; local `.env.local` remains explicitly set to demo and production must be configured with `SPORTS_DATA_PROVIDER=sportscore` to show live football.

Delivery: commit `b23b138` is pushed to `codex/login-live-fantasy-followup`. Git push succeeded, but GitHub REST API calls return 401, so the PR, reviewer/assignee, labels and remote check inspection remain pending GitHub API reconnection. No issue was created because the Fantasy issue is already completed and there is no additional Fantasy scope to track.

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
| 2     | Generic sports/provider/seed/cache with integration and outage coverage                                       | COMPLETE    |
| 3     | Match filters/list/detail/timeline/available stats; navigation E2E                                            | COMPLETE    |
| 4     | Team/player/competition pages, standings and secured follows                                                  | COMPLETE    |
| 5     | Profiles/follows/posts/comments/reactions/feed with ownership tests                                           | COMPLETE    |
| 6     | Public/private communities, roles/membership/moderation and adversarial RLS tests                             | IN_PROGRESS |
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

## Phase 2 — sports provider milestone

Phase: 2
Status: COMPLETE
Completed: typed multi-sport provider, stable fictional catalog, bounded cache/deduplication, safe failure recovery, public catalog/fixture APIs, responsive preview and reviewed screenshots.
Tests: PASS — 36 unit/component, 8 API integration, 8 local identity/RLS and 8 public desktop/mobile E2E; type-check/lint/build and formatting green. Locator failure documented and fixed.
Known Issues: no licensed external provider configured.
Deferred: persistent sports import tables and team/competition/player preferences ship with Phase 4 follows, when database foreign keys are required; Phase 2 catalog is versioned read-only source data.
Next Phase: Phase 3 match browsing after this milestone passes verification and is published.

## Phase 3 — match experience

Phase: 3
Status: COMPLETE
Completed: shareable filters, pagination, match detail/API, timeline/statistics/lineups/standings, loading/retry/not-found states, visible-tab live refresh architecture and explicit demo provenance.
Tests: PASS — 47 unit/component, 9 route integration, 12 desktop/mobile E2E; type-check, lint, build and formatting. Visual review complete. Filter label test failure fixed and rerun.
Known Issues: fixed demo snapshot; Today uses the real current UTC date and may be empty.
Deferred: authenticated discussions in Phase 7 and fantasy associations in Phase 8.
Next Phase: Phase 4 catalog persistence, entity pages and follows.

## Phase 4 — sports entities and follows

Phase: 4
Status: COMPLETE
Completed: normalized catalog/RLS/seed, team/player/competition pages, available squads/standings/history, verified follow/unfollow, optional onboarding picks, sports settings, loading/retry and visual review. Schema PR #14 CI green.
Tests: PASS — 51 unit/component, 9 API integration, 26 real database tests, 14 public desktop/mobile E2E, 4 real auth/follow E2E; types/lint/build/formatting, replay/security advisor and seed drift verification. Transient title-readiness failure fixed without disabling accessibility rules.
Known Issues: catalog persistence must be seeded explicitly for demo follows; no external importer configured.
Deferred: public follower totals/social visibility in Phase 5; related communities in Phase 6; fantasy associations in Phase 8. Complete individual statistics require an actual provider.
Next Phase: Phase 5 social profiles, user following, posts/comments/reactions and activity feed.

## Phase 5 — social foundation

Phase: 5
Status: COMPLETE
Completed: social schema/RLS/write budgets, latest/following feeds, fan discovery/profiles, verified posts/comments/replies/likes/user follows, owner deletion, authenticated sports follower totals, safe errors/draft retention, notification integration design and desktop/mobile visual review. Schema PR #20 merged with green CI.
Tests: PASS — 58 unit/component, 9 API integration, 42 actual database tests, 16 public E2E and 6 real auth/social E2E; type-check/lint/build/format pass; security advisor clear and production dependency audit zero vulnerabilities. Streamed-page/locator/formatting failures documented and corrected.
Known Issues: no hosted deployment; global feed is chronological, not realtime. Post editing has database support but no editor UI. Private profiles remain invisible to outsiders; following does not bypass privacy.
Deferred: community context/roles in Phase 6, match discussion/realtime in Phase 7, notification delivery in Phase 10.
Next Phase: Phase 6 community creation/discovery, public/private membership and moderation (#21).

Social permission decision: posts/comments/reactions require authenticated profiles. Public discovery shows only public-profile authors; private-profile activity remains owner-only. Changing profile privacy hides prior activity from outsiders. User follows do not grant private-profile access. Authors retain access to delete their own interactions even if a parent post becomes private; this does not expose the parent content. Replies require a visible parent in the same post. Social writes are bounded by atomic per-user database budgets that survive content deletion and serialize concurrent writes. Sports follower totals expose only an aggregate to authenticated users; private pick identities remain protected.

## Phase 6 — community foundation

Phase: 6
Status: IN_PROGRESS
Completed: Phase 5 PR #22 merged with green CI; community schema, transactional membership/role procedures, bans, ownership transfers, rate limits and audit records implemented. Generated migration replayed cleanly with explicit final ACLs.
Tests: 59 real database tests, 67 unit/component/API tests, 16 public browser regressions and six authenticated browser journeys passed; type-check, lint, formatting, production build, seed consistency, security advisors and migration history checks passed.
Known Issues: private communities will be unlisted; members can share a UUID link for access requests without exposing the member directory or content. Bans prevent participation; public content remains publicly readable.
Deferred: community content and moderation UI follow the membership schema; match realtime remains Phase 7 and notification delivery Phase 10.
Next Phase: connect community discovery, creation and membership controls, then add scoped content and moderation while preserving private visibility across existing social feeds.

Community decision: owner/admin/moderator/member roles are stored in PostgreSQL. Direct client membership/role writes are denied. Narrow private security-definer functions implement audited transitions with verified auth.uid(), fixed search paths and a per-community row lock. Only owners transfer ownership; owners cannot leave without transfer. Staff may moderate lower-ranked members only. Existing profile privacy continues to protect global social activity; adding community context must preserve private content in every feed/query.

## Phase 6 — community application milestone

Phase: 6
Status: COMPLETE
Completed: community foundation PR #23 and community content PR #35 merged. Discovery, membership, role management, bans/transfers, scoped posts, reports, pinning, audited moderation, and blocks are implemented with database-enforced visibility and authority. SSR sessions and no-store responses protect account-specific pages.
Tests: 65 unit/component, 9 integration, 61 real database and 18 public desktop/mobile browser tests passed. All 8 authenticated desktop/mobile test runs passed. Migration replay and security advisors passed; type-check, lint and production build passed.
Known Issues: browser robots helper corrected to recognize noindex alongside nofollow without accepting index. Recurring Next.js destination-stream-closed log observed during navigation; privacy/runtime assertions remain enabled.
Deferred: no community images/uploads. Phase 7 realtime match discussions follow.
Next Phase: two-user realtime match discussions and moderation (#24).

## Completed GitHub issue #21 — community content and moderation

- [x] Extend posts with optional community scope while preserving the existing global feed; enforce membership, community visibility and block rules in database policies for posts, comments and reactions.
- [x] Add community post creation/listing, pin/unpin controls, member reports, staff content removal, and audited moderation actions. Keep moderation authority in the database.
- [x] Add user blocks and ensure blocked relationships do not reveal or enable interaction with protected content.
- [x] Add real database and authenticated browser coverage for members, outsiders, public/private communities, bans, blocks, reporting, pinning and moderation.
- [x] Replay migrations, run the database suite/security advisor and authenticated desktop/mobile journeys.
- [x] Update community docs, this plan and changelog; run available type, lint, unit, integration, formatting, build and public browser gates; record actual results.
- [x] Commit only issue-specific changes on the task branch.
- [x] Push `codex/phase-6-community-content-21` and merge PR #35 targeting `development`; issue #21 is closed.
- [x] Track the environment-dependent migration/database/security/authenticated-browser verification in follow-up issue #34, linked from PR #35 and issue #21.

Validation cycle 1 (implementation PR): type-check, lint, 65 unit tests, 9 integration tests, production build and 18 public desktop/mobile browser tests passed. The initial PR's CI exposed database RLS and formatting failures; issue #34 tracks their fixes and final verification.

Security follow-up: `npm audit --omit=dev` reports four production dependency advisories, including a critical advisory for the pinned Next.js 16.3.4 and high advisories for sharp, source-map-js and zod. No dependency versions were changed in this community issue; tracked separately in GitHub issue #33.

## Completed GitHub issue #24 — Phase 7 realtime match discussions and moderation

- [x] Inspect existing social schema, match routes and auth patterns; choose a match-scoped data model with RLS.
- [x] Add validated authenticated discussion/reply/reaction writes, bounded history, and owner/moderator controls.
- [x] Add scoped realtime subscriptions with polling fallback/reconnect behavior on desktop and mobile match pages.
- [x] Add two-user database/authenticated browser coverage and document actual verification results.
- [x] Run relevant database, security, unit/integration, browser, type, lint and build checks.
- [x] Commit and push `codex/phase-7-match-discussions-24`, open PR #39 linked to #24, merge after verification, and close issue #24.

Validation cycle 1: local migration applied; database tests passed 64/64; security advisor found no issues; unit tests passed 65/65; integration tests passed 9/9; type-check, lint and production build passed; public desktop/mobile browser tests passed 18/18; authenticated match discussion tests passed on desktop and mobile. Targeted Prettier checks passed for changed source, tests, docs and configuration.

Validation cycle 2: GitHub CI showed public match pages assumed Supabase auth was configured. Anonymous discussion reads/session lookup were made optional and the browser subscription was disabled without auth configuration. Production build passed without `.env.local`; public match journeys passed 4/4 across desktop/mobile with no auth configuration, including an explicit guest discussion/sign-in assertion. Configured-auth discussion journey passed 2/2 across desktop/mobile. A subsequent merge of PR #38 exposed duplicate match-page declarations and a stale homepage E2E expectation; both were corrected. After the merge, database tests passed 64/64, unit tests 71/71, integration tests 9/9, lint and type-check passed, production build passed, public E2E passed 18/18 without `.env.local`, and authenticated E2E passed 10/10. PR #39 was merged to `development`; Vercel preview deployed and issue #24 closed.

## Completed GitHub issue #25 — Phase 8 fantasy rules, gameweeks and squad builder

- [x] Inspect existing sports catalog IDs, player positions, auth/server-action patterns, database permissions and Fantasy architecture before designing the schema. The demo catalog has 8 football, 8 cricket and 8 basketball players; tennis has only 2, so initial fantasy pools cover the first three sports. Next.js Server Action docs and the local RLS/RPC patterns were reviewed.
- [x] Add configurable sport-aware fantasy competitions with immutable/versioned rules and gameweeks, including authoritative player prices, roster positions, team caps, budget, captain/vice multipliers, transfer allowance and deadlines.
- [x] Implement atomic authenticated squad creation/update with server/database validation of competition, rule version, roster size/positions, budget, per-team limits, captain/vice selection, transfers and deadline.
- [x] Enforce ownership and visibility with RLS and server authorization; reject forged IDs, stale rules, repeated writes and concurrent invalid updates safely.
- [x] Build a responsive fantasy squad builder with loading, validation, success, deadline and recoverable error states; keep scoring/private leagues/leaderboards in Phase 9.
- [x] Add unit, database and integration coverage plus authenticated desktop/mobile browser journeys; update fantasy/database docs.
- [x] Run database replay/security advisors, unit, integration, browser, type-check, lint, format and build gates; record actual results.
- [x] Commit and push `codex/phase-8-fantasy-25`; PR #40 linked to #25 was merged and closed issue #25. Follow-up PR #41 fixed the existing SportScore Prettier failure and merged with quality, identity, security and Vercel checks passing.

Validation cycle 0: GitHub issue #25 is the next roadmap issue and its Phase 7 dependency (#24) is merged/closed. Baseline `npm audit --omit=dev` reports four findings: one critical advisory affecting Next.js and high advisories affecting sharp, source-map-js and zod; the separate remediation is tracked in #33.

Validation cycle 1: clean migration replay succeeded; database tests passed 68/68; Supabase security advisor found no issues; unit tests passed 74/74; integration passed 9/9; seed consistency, type-check, lint, targeted Prettier and diff checks passed; production build passed. Public E2E passed 18/18 and fantasy authenticated save/reload passed on desktop and mobile (2/2). The full authenticated suite passed 11/12: all auth, community, fantasy and social cases passed, while the existing mobile match-discussion journey timed out during registration because onboarding remained at `/onboarding` rather than advancing to `/onboarding/sports`. First database teardown exposed a foreign-key cleanup ordering issue; tests now remove gameweeks before their rules and pass on clean reset.

## Active GitHub issue #26 — Phase 9 fantasy scoring, private leagues and leaderboards

- [x] Inspect existing fantasy squad/rule/gameweek schema, normalized match events, auth/RLS boundaries, route/action patterns, tests and docs before designing scoring and league persistence.
- [x] Implement idempotent, replayable score calculation tied to immutable rule versions, including captain and vice-captain multipliers and corrected match events.
- [x] Add private fantasy league creation and membership with unpredictable join codes; enforce visibility, join authorization and non-leaking code behavior.
- [x] Add deterministic rankings, tie handling and leaderboard reads/updates that reflect score corrections and membership changes.
- [x] Build responsive league and leaderboard journeys with recoverable loading, join, authorization and error states.
- [x] Add unit, database, integration and authenticated browser coverage; update fantasy/database docs and generated database types.
- [x] Run clean migration replay, security advisors, unit/integration/database/browser, type, lint, format and production build checks; record actual results.
- [x] Commit `e727293`, push `codex/phase-9-fantasy-26`, and open PR #42 linked to #26; reviewer `Bibek200619`, assignee `roushan-23`, and `area:fantasy`, `feature`, `testing` labels are set.
- [ ] Close issue #26 only after verified merge of PR #42.

Validation cycle 0: GitHub issue #26 is the next roadmap issue and its Phase 8 dependency (#25) is merged/closed through PR #40. The separate production dependency remediation remains open as issue #33 and is outside this issue's scope.

Validation cycle 1 (design): existing match events are normalized rows with nullable `player_id`, free-text `type`, and a match FK; matches include source competition, start time and finished state. Scoring will map configured event types to points and ignore events without a player or an unknown type; score calculation will rebuild a complete gameweek snapshot under a row lock so corrections/retries replace prior totals atomically. Fantasy rule versions are immutable once a gameweek references them, so scoring weights can live in the versioned rule record. League codes will be generated cryptographically server-side, hashed in the database, returned only to the creator, and accepted through a narrow authenticated join RPC. League reads and scoreboards will be member-scoped; ranks will be calculated from current score snapshots with deterministic tie ordering rather than stored as stale rank values.

Validation cycle 2 (implementation): clean local migration replay succeeded. Database tests passed 69/69, including corrected event replay, revision increments, captain/vice calculations, rank ties and reordering, private score reads, hidden invitation hashes and non-member denial. Supabase security advisor found no issues; unit tests passed 76/76; integration tests passed 9/9; seed consistency, type-check, lint and targeted Prettier checks passed. Production build passed and generated `/fantasy/leagues/[id]`. Public browser tests passed 18/18. Authenticated fantasy browser journeys passed 4/4 across desktop/mobile, including league creation, outsider denial, joining and leaderboard loading.

## Completed GitHub issue #37 — integrate SportScore live football match data

- [x] Add an optional server-side SportScore provider with validated responses, timeout handling, and safe error behavior.
- [x] Map live football matches into the current match list/detail experience while preserving demo mode when not configured.
- [x] Keep the optional credential server-only, add visible dofollow SportScore attribution, and update environment/docs.
- [x] Add provider coverage and run relevant checks; record actual results.
- [x] Commit `698918a` and push `codex/sportscore-live-scores-37`; open PR #38 linked to #37. Vercel deployment/preview checks passed and issue #37 is closed as completed.

SportScore docs list the match endpoint as keyless; an optional server-side `SPORTSCORE_API_KEY` header will be supported for the user-provided credential. The endpoint was verified to return football match records. No key is stored in repository files.

Validation cycle 1: 71 unit tests, 9 integration tests, lint and type-check passed. A production build with `SPORTS_DATA_PROVIDER=sportscore` passed using `NEXT_BUILD_OUTPUT_DIR=.next-live` to avoid a OneDrive reparse-point cleanup error in the default `.next` directory. Four desktop/mobile match E2E tests passed in demo mode. With the supplied credential loaded only from ignored `.env.local`, the live `/matches` page and a match detail page returned HTTP 200, showed SportScore data and attribution, and did not expose the credential in rendered HTML. A direct keyed provider request returned HTTP 200 with football matches.

## Completed GitHub issue #34 — verify Phase 6 community content migration and authenticated journeys

- [x] Fix merged PR #35 CI failures: global post inserts under RLS, staff moderation writes blocked by the social write-limit trigger, private interaction author deletion, and the following-feed nested join.
- [x] Replay all migrations on a clean local Supabase stack; run all 61 database tests and security advisors.
- [x] Run authenticated community content journeys on desktop and mobile; all 8 authenticated runs passed.
- [x] Run type-check, lint, 65 unit, 9 integration, 18 public browser and production build checks. The changed Markdown/TypeScript/MJS files pass targeted Prettier checks; repository-wide Prettier reports 163 files on this Windows checkout because of line-ending differences.
- [x] Commit issue-specific changes, push `codex/verify-phase6-34`, and open PR #36 targeting `development`, linked to #34.

Validation cycle 1: clean migration replay succeeded. `npm run test:db` passed 61/61; `npx supabase db advisors --local --type security --fail-on error` found no issues. `npm run test:e2e:auth` passed all desktop/mobile authentication, community and social journeys. `npm run check` passed 65 unit tests, 9 integration tests, type-check, lint, build and all 18 public desktop/mobile E2E tests. `npm run db:start` and `npm run db:env` now work on Windows. The generated sports seed was reconciled and `npm run db:seed:check` passes.

PR #36: https://github.com/Bibek200619/ArenaPulse/pull/36. GitHub preview feedback and Vercel deployment checks passed; issue #34 is closed as completed and linked to PR #36.
