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
