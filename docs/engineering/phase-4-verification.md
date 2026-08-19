# Phase 4 verification

## Failure: database test import

Test: npm run test:db.
Expected: new catalog/RLS suite runs.
Actual: isolated DB Vitest config did not resolve the app @ alias.
Root cause: this separate configuration previously used no application imports.
Fix: use an explicit relative import for the seed catalog in the DB test.

## Failure: migration generation

Test: supabase db pull.
Expected: generate current schema diff.
Actual: local empty migration created by migration new was absent from applied history.
Root cause: CLI creation and diff-generation workflows overlap. Do not mark an empty migration applied.
Fix: remove only the verified-empty, uncommitted placeholder and let db pull create the actual migration, as in Phase 1.

## Verification

- [x] failing database suite rerun
- [x] migration generated/replayed
- [x] security advisors
- [x] unit/integration
- [x] types/lint/build

Migration review caught the same pg-delta column-grant ordering problem as Phase 1. An explicit final ACL baseline restores intended insert columns and revokes anonymous follow access before clean replay; no policies were weakened. Catalog mutation tests assert SQLSTATE 42501 to distinguish permission denial from request-validation errors.

Schema milestone verified: 26 real local database tests pass after clean migration/seed replay; security advisor empty; migration history aligned; 47 unit/component + 9 API integration, types, lint and production build pass. Seed drift check passes. Entity UI remains in progress.

All four desktop/mobile real authentication E2E cases also passed against the replayed database. No application UI changed in this schema milestone.

## Failure: accessibility scan during streamed navigation

Test: mobile match navigation axe scan.
Expected: complete document has its configured title.
Actual: one run scanned between streamed page content and metadata commit, reporting an empty title. All content assertions had already passed.
Root cause: the test waited for content but not document-title readiness on client navigation. The transient failure is consistent with separate content/metadata commits; the rerun will explicitly verify the title arrives.
Fix: explicitly assert the expected page title before running axe. Keep the document-title rule enabled and fail if metadata never arrives.
Verification: rerun the full public browser suite after the title assertion.

Entity milestone final verification: 51 unit/component + 9 API integration, 26 local DB tests, 14 public desktop/mobile E2E and 4 real auth/follow E2E pass. Expected title now arrives before axe scan; no rules disabled. Types/lint/build/formatting pass. Team list/detail desktop/mobile screenshots reviewed; browser errors empty.
