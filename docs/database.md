# Database

The initial migration is 20260909091916_identity_schema.sql, generated from the local database and reviewed with an explicit ACL baseline added after replay tests exposed grant-ordering differences.

profiles references auth.users, has unique lowercase usernames, bounded display/bio/country fields, private visibility, timestamps and an avatar URL reserved for the storage milestone. Public readers see only non-private rows; authenticated owners see and modify their own. Column grants restrict writes to profile fields and prevent changes to identity or created_at. There is no browser delete grant.

profile_preferences references profiles and is owner-only under RLS. It stores bounded supported sport interests and onboarding state. save_profile is security invoker, derives auth.uid(), and atomically upserts both tables. Constraint failure rolls back both writes. Timestamp triggers have a fixed empty search path and live in an unexposed private schema. The identity layer uses no security-definer functions or auth metadata roles.

Run npm run test:db against isolated local port 55431. The test runner uses local admin credentials only to provision/delete test users; all assertions use anonymous/user clients. It refuses a hosted target. Run npx supabase db reset --local --yes only on this disposable ArenaPulse development stack to verify replay, then run tests again. Never use a hosted database for destructive tests.

Notification and prediction schemas remain tracked in plan.md for later phases.

## Sports catalog and follows (Phase 4 schema milestone)

Migration `20260909194645_sports_catalog_and_follows.sql` adds sports, competitions, seasons, teams, players, venues, sports_data_sources, matches, match_participants, match_events, match_statistics, match_lineups and standings. Composite foreign keys keep players/participants in their sport and match seasons in their competition. A participant references exactly one team or individual player. Scores remain strings or null. Domain-specific statistics remain normalized observations.

Every catalog table enables RLS and grants only SELECT to anon/authenticated. Catalog writes require a trusted import role; there is no browser write policy. Foreign-key and common filter indexes support joins and cleanup. Follows reference profiles and actual catalog IDs: team_follows, player_follows and competition_follows. Only the owner can read/insert/delete; clients cannot update ownership or supply created_at. No anonymous access or implicit private-follower list exposure. No SECURITY DEFINER function was introduced.

The generated migration receives a reviewed final ACL baseline because pg-delta's table-level REVOKE follows column grants. Tests replay the complete migration and require specific permission-denied SQLSTATE values.

`supabase/seed.sql` is generated from the same typed fictional catalog as the demo provider. Run `npm run db:seed:generate` after catalog changes; CI runs `npm run db:seed:check`. Seeds contain no accounts and no user activity. Local reset applies migrations and seeds. This repository currently runs demo mode only; hosted demo environments must explicitly apply this seed if follow targets are needed. Do not import this fictional catalog into a live sports environment. A provider-backed ingestion/mapping service remains unconfigured.

The entity milestone connects these tables through verified follow actions and optional onboarding/preferences UI; see entities.md.

## Match discussions (Phase 7)

Migration `20261030160000_phase7_match_discussions.sql` adds match-scoped messages, one-level replies, likes, reports and an immutable moderation log. Reads require an authenticated account; private-profile and block visibility follows the existing social rules. Direct writes are revoked. Authenticated writes use bounded RPCs with ownership checks and per-user write limits. Composite keys bind replies and reactions to the same match. The server verifies that a match exists before accepting a write; provider match IDs are not foreign-keyed because live providers may not persist fixtures in the local catalog.

Moderators are identified only by the trusted `app_metadata.role` claim (`moderator` or `admin`). They can remove messages and resolve/dismiss reports through RPCs; every moderation change is logged. Match pages fetch 20 root messages at a time and cap replies per page. Realtime subscriptions filter both messages and reactions to the active match and switch to 15-second polling after channel failures.

Security reference: [Supabase RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security). The [April 2026 API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) is handled through explicit grants.

## Social persistence (Phase 5 schema milestone)

Migration `20260911203544_social_foundation.sql` adds posts, comments, one like per user/post, and user follows. Every table has RLS, explicit grants, foreign keys and access-path indexes. Generated IDs/timestamps and ownership columns cannot be edited. Posts support owner edits; comments/reactions support owner deletion. Deleting a post removes dependent interactions; deleting a comment removes its reply subtree.

Public readers see public-profile authors only. A private profile's activity remains owner-only, and changing privacy immediately hides previous activity without rewriting each post. Following does not bypass privacy. Comment/reaction owners retain access to remove their own interactions when the parent post becomes private, without obtaining access to that post. New interactions require a visible post. A security-invoker trigger checks reply visibility and thread identity; a composite foreign key independently prevents cross-post replies.

`private.social_write_limits` stores atomic per-user/minute budgets: 10 post creates/edits, 30 comments, 60 reactions and 30 follows. The trigger derives auth.uid(), rejects forged actors, and serializes concurrent increments through a primary-key upsert. Budgets survive deleting content and reset after a minute; rejected transactions roll back increments. Clients cannot access this table or invoke trigger helpers. This bounds successful writes per account, not all API traffic; deployment-level request throttling and account-abuse controls remain necessary before release.

Two deliberate SECURITY DEFINER boundaries live in the unexposed private schema with fixed empty search paths: the budget trigger writes an inaccessible counter; the sports follower-count helper reads protected follow tables but returns only a bigint aggregate after checking authentication. Its public wrapper is SECURITY INVOKER, executable only by authenticated users. No follower identity list is exposed. Aggregate counts include private picks, as documented in the product privacy contract. Returned social interaction counts, in contrast, count only rows visible to the current reader under RLS.

See [social.md](social.md) for the next application milestone. The subsequent social application milestone connects the feed, profiles and interaction controls. Notification delivery remains deferred.

## Community membership (Phase 6 foundation)

Migration `20260913162757_community_foundation.sql` introduces communities, community_members, community_join_requests, community_bans and community_audit. All are indexed with explicit RLS/grants. Clients have no direct writes, including the service role. Public SECURITY INVOKER wrappers call narrowly scoped private transition functions that verify auth.uid(), check the current role and lock the community row before mutation. Creation/approval/ban/role/ownership changes and audit entries are atomic. A partial unique index prevents multiple owner memberships, while RPC-only writes preserve owner_id consistency.

Private communities are unlisted; UUID-link access requests do not reveal their metadata. Public metadata remains public even for banned accounts. Member directories require membership; audit records require staff status. See communities.md for the complete matrix, ban authority rules, budgets and account-deletion semantics. The underlying private role helper returns only the current caller's role and avoids recursive membership RLS; anonymous callers receive no membership. Generated migration ACLs are reasserted explicitly to avoid environment/default-grant differences.

## Fantasy squads (Phase 8)

Migration `20261030180000_phase8_fantasy_squads.sql` adds sport-scoped fantasy competitions, versioned rules and price pools, scheduled gameweeks, owner-private teams and roster snapshots. Public rules, player prices and gameweeks are readable; teams, gameweek entries and selected players use owner-only RLS. Direct client writes are revoked. `save_fantasy_squad` is the only authenticated write path and atomically validates the gameweek deadline, rule version, roster size, position limits, same-sport player pool, budget, team cap, distinct captain/vice-captain selections and transfer allowance. The caller identity comes from `auth.uid()`. Demo competitions and prices are generated from `src/features/fantasy/demo-config.ts` with the fictional sports seed.

Migration `20261031110000_phase9_fantasy_scoring_leagues.sql` adds immutable versioned scoring weights, gameweek score revisions, private league membership and score snapshots. `recalculate_fantasy_gameweek_scores` is service-role-only; it locks and replaces all scores for a locked/completed week from finished normalized match events. Authenticated users create/join leagues through narrow RPCs. Invitation codes are hashed in storage, are not selectable by clients, and league/leaderboard reads require member authorization. Tied scores receive the same rank with a deterministic display order.
