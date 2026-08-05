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
