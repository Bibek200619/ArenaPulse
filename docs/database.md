# Database

The initial migration is 20260909091916_identity_schema.sql, generated from the local database and reviewed with an explicit ACL baseline added after replay tests exposed grant-ordering differences.

profiles references auth.users, has unique lowercase usernames, bounded display/bio/country fields, private visibility, timestamps and an avatar URL reserved for the storage milestone. Public readers see only non-private rows; authenticated owners see and modify their own. Column grants restrict writes to profile fields and prevent changes to identity or created_at. There is no browser delete grant.

profile_preferences references profiles and is owner-only under RLS. It stores bounded supported sport interests and onboarding state. save_profile is security invoker, derives auth.uid(), and atomically upserts both tables. Constraint failure rolls back both writes. Timestamp triggers have a fixed empty search path and live in an unexposed private schema. No security-definer functions or auth metadata roles are used.

Run npm run test:db against isolated local port 55431. The test runner uses local admin credentials only to provision/delete test users; all assertions use anonymous/user clients. It refuses a hosted target. Run npx supabase db reset --local --yes only on this disposable ArenaPulse development stack to verify replay, then run tests again. Never use a hosted database for destructive tests.

Future relational sports, communities, fantasy, notifications and prediction schemas are tracked in plan.md. They do not exist yet.
