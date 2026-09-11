# Database

The initial migration is 20260909091916_identity_schema.sql, generated from the local database and reviewed with an explicit ACL baseline added after replay tests exposed grant-ordering differences.

profiles references auth.users, has unique lowercase usernames, bounded display/bio/country fields, private visibility, timestamps and an avatar URL reserved for the storage milestone. Public readers see only non-private rows; authenticated owners see and modify their own. Column grants restrict writes to profile fields and prevent changes to identity or created_at. There is no browser delete grant.

profile_preferences references profiles and is owner-only under RLS. It stores bounded supported sport interests and onboarding state. save_profile is security invoker, derives auth.uid(), and atomically upserts both tables. Constraint failure rolls back both writes. Timestamp triggers have a fixed empty search path and live in an unexposed private schema. No security-definer functions or auth metadata roles are used.

Run npm run test:db against isolated local port 55431. The test runner uses local admin credentials only to provision/delete test users; all assertions use anonymous/user clients. It refuses a hosted target. Run npx supabase db reset --local --yes only on this disposable ArenaPulse development stack to verify replay, then run tests again. Never use a hosted database for destructive tests.

Future relational sports, communities, fantasy, notifications and prediction schemas are tracked in plan.md. They do not exist yet.

## Sports catalog and follows (Phase 4 schema milestone)

Migration `20260909194645_sports_catalog_and_follows.sql` adds sports, competitions, seasons, teams, players, venues, sports_data_sources, matches, match_participants, match_events, match_statistics, match_lineups and standings. Composite foreign keys keep players/participants in their sport and match seasons in their competition. A participant references exactly one team or individual player. Scores remain strings or null. Domain-specific statistics remain normalized observations.

Every catalog table enables RLS and grants only SELECT to anon/authenticated. Catalog writes require a trusted import role; there is no browser write policy. Foreign-key and common filter indexes support joins and cleanup. Follows reference profiles and actual catalog IDs: team_follows, player_follows and competition_follows. Only the owner can read/insert/delete; clients cannot update ownership or supply created_at. No anonymous access or implicit private-follower list exposure. No SECURITY DEFINER function was introduced.

The generated migration receives a reviewed final ACL baseline because pg-delta's table-level REVOKE follows column grants. Tests replay the complete migration and require specific permission-denied SQLSTATE values.

`supabase/seed.sql` is generated from the same typed fictional catalog as the demo provider. Run `npm run db:seed:generate` after catalog changes; CI runs `npm run db:seed:check`. Seeds contain no accounts and no user activity. Local reset applies migrations and seeds. This repository currently runs demo mode only; hosted demo environments must explicitly apply this seed if follow targets are needed. Do not import this fictional catalog into a live sports environment. A provider-backed ingestion/mapping service remains unconfigured.

The entity milestone connects these tables through verified follow actions and optional onboarding/preferences UI; see entities.md.

Security reference: [Supabase RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security). The [April 2026 API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) is handled through explicit grants.
