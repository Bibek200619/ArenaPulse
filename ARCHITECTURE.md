# Architecture

ArenaPulse uses a Next.js modular monolith. React Server Components and route handlers call domain services; services call repository/provider interfaces. Browser components own only interaction and scoped subscriptions. Supabase will provide persistence, verified sessions, RLS, media storage and realtime. A Python prediction service will be attached later through an explicit inference contract.

## Decision 001 — retain the demo, introduce a server foundation

The baseline is a three-file Vite/React football demo with client-side data fetching and no authentication/tests. Preserve it unchanged in legacy/world-cup. New implementation uses Next.js App Router and TypeScript so auth, validation and domain writes have a clear server boundary. Legacy files are excluded from the new build/lint/typecheck because they are a separate archived application, not because checks failed.

## Boundaries

- app: orchestration and rendering; no direct vendor sports requests
- features/services: domain use cases introduced per phase
- lib: environment, errors, auth/validation/permissions adapters
- Supabase: database-enforced authorization and relational invariants
- sports providers: normalization, provenance, caching and failure handling
- ml: future feature/registry/inference contracts, never synthetic predictions

Public pages must boot without credentials. Paired Supabase configuration is validated when supplied. Health is process liveness only and does not imply database/provider readiness. User-specific responses will be uncached. All feature placeholders explicitly state availability.

See plan.md for entity groups, security boundaries, versioning, failure behavior and per-phase acceptance.

Phase 4 catalog persistence: PostgreSQL stores normalized sports/matches and owner-private follows. Deterministic seed SQL is generated from the typed provider catalog; CI prevents drift. Public sports display still uses the provider interface. Follow writes target PostgreSQL through verified server actions; no browser catalog writes are granted.

## Decision 002 — social privacy and write budgets

Phase 5 social activity inherits profile visibility dynamically through RLS. Following is a feed preference, not permission to read a private profile. Parent visibility is required to create an interaction; authors can always remove their own interactions. Atomic private counters enforce per-account write budgets independently of deleted content. The only aggregate privilege boundary exposes authenticated sports follower totals without disclosing individual private favorites. See docs/database.md for the narrowly scoped SECURITY DEFINER helpers and grants.

## Decision 003 — serialize community authority transitions

Community role and membership tables are read-only to Data API clients, including service_role. Narrow private procedures own creation and transitions, enforce current database roles and take a community row lock. This prevents races from creating two owners or retaining membership after a ban. The public RPC surface remains SECURITY INVOKER. Private communities are unlisted, with explicit link-based requests; requests do not reveal metadata before approval. See docs/communities.md for access and lifecycle decisions. Community posts are a separate upcoming extension and must not weaken existing social privacy.
