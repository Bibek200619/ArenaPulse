# Deployment

Use separate Supabase projects and environment values for test/staging/production. No hosted deployment has been performed for this milestone.

## Node hosting

Use Node 22. Run npm ci then npm run check and npm run format:check. Start the built app with npm run start. For a compatible managed Next.js host, configure install npm ci and build npm run build. Do not use static export for the future authenticated application. Exclude legacy from deployment source if packaging manually; it is not part of the Next build.

## Variables

| Name                                 | Purpose                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| APP_URL                              | Trusted application origin; HTTPS in staging/production          |
| NEXT_PUBLIC_SUPABASE_URL             | Supabase project URL; pair with public key                       |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Publishable sb_publishable_ key only, never a secret/service key |
| SPORTS_DATA_PROVIDER                 | demo only until a provider is implemented                        |
| PREDICTIONS_ENABLED                  | false by default; a flag alone never configures a model          |

The Phase 0 public shell may deploy without Supabase. That does not enable auth. Before Phase 1 deployment, create a dedicated project, apply reviewed migrations, configure callback origins and email settings, and run real auth/RLS tests. Never point tests at production. Before release configure branch protection requiring Quality checks, backups, log retention and migration rollback/forward-fix procedure. These remote settings are not configured by adding a workflow file.

GET /api/health is liveness only; it returns no configuration values. Verify the deployed URL, response status and critical browser journeys after deployment. Do not claim readiness from a successful build alone.
