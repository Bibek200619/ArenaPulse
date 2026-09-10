# Changelog

## Unreleased

### Added — Sports foundation

- Typed multi-sport provider contract and deterministic fictional football/cricket/basketball/tennis catalog.
- Public catalog/fixture APIs with validated filters and pagination, bounded cache and failure recovery.
- Responsive fixture preview with explicit source labels and unavailable data preserved.
- Provider/cache/API tests and desktop/mobile accessibility coverage.

### Deferred — Sports foundation

- Licensed provider integration; persistent catalog import and secured follows in Phase 4.
- Match filters/details in Phase 3; custom ML model remains unimplemented.

### Added — Identity milestone

- Supabase SSR registration/confirmation, login/logout, password recovery and fixed callbacks.
- Unique profiles, private visibility, sport interests, atomic onboarding and editable preferences.
- Local stack with isolated ports, generated migration/types, adversarial RLS tests and actual email/browser journeys.
- Google OAuth entry behind an off-by-default configuration flag.

### Fixed — Identity milestone

- Explicit replay-safe grants preserve column restrictions and private preferences.
- Accessible field labels and non-sensitive form input retention on errors.

### Security — Identity milestone

- Verified server identity, uncached account routes, ownership RLS, bounded server validation, fixed callback destinations and secret-free local tooling.

## 0.1.0 — Foundation

### Added

- ArenaPulse roadmap with sequential acceptance criteria and truthful milestone tracking.
- Next.js/TypeScript public foundation, responsive navigation and honest availability states.
- Validated environment, safe application errors and process health route.
- Vitest, Playwright, accessibility checks and CI quality workflow.

### Changed

- Preserved the original World Cup application under legacy/world-cup; new root is ArenaPulse.
- Lowercase plan.md replaces the completed venues-only PLAN.md; historical plan retained in docs.

### Security

- Secret/environment ignores, paired public-key validation, safe error responses and security headers.

### Deferred

- Authentication, sports data, social/community/fantasy/personalization milestones.
- Custom ML model and all prediction output.
