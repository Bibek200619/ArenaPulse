# Phase 1 verification

## Environment failure 1

Test: local schema iteration via supabase db query --local --file.
Expected: execute transactional SQL file.
Actual: CLI rejected multiple commands in a prepared statement; no schema change applied.
Root cause: CLI query implementation uses prepared protocol for a multi-statement file.
Fix: use psql inside the isolated ArenaPulse database container with ON_ERROR_STOP and the same transaction. Generate the final migration after advisors and schema verification.

## Verification

- [x] schema applied and advisors reviewed
- [x] generated migration replay
- [x] real database/RLS integration tests
- [x] auth browser journey including email confirmation/recovery
- [x] unit/integration/types/lint/build/format gates

## Failure 2

Test: strict type-check. Expected supported Vitest suite API. Actual: Vitest 5 no longer exposes describe.sequential.
Root cause: using a removed convenience API.
Fix: ordinary describe uses the default sequential execution; the database configuration already disables file parallelism. No test ordering or assertions changed. Rerun types and database suite.

## Environment failure 3

Migration export attempted before initial stack startup finished applying its empty CLI-created migration. The exporter correctly refused inconsistent history. Retry after initialization completes; do not repair or fabricate history.

The CLI-created empty bootstrap migration was discarded before publication. The generated identity_schema migration is the first meaningful schema change; a clean local reset will establish its actual migration history. No hosted migration history is rewritten.

## Failure 4 — accessible form names and alert scope

Test: registration/recovery browser journey. Expected fields labeled Password/Username. Actual: helper text inside label became part of the accessible name, so exact semantic locators timed out.
Fix: give fields explicit labels and connect separate helper text with aria-describedby. Keep exact field-name tests.
The callback assertion also matched the framework's route announcer; scope assertions to the main content alert. Both application and framework announcements remain enabled.
Verification: rebuild and rerun full auth journeys on desktop/mobile.

## Failure 5 — migration replay did not preserve grants

Test: real database suite after reset. Expected the same least-privilege ACLs as the iterated schema. Actual: profile writes denied and anonymous preferences SELECT privilege remained. RLS still prevented private row disclosure.
Root cause: schema-diff grant ordering revoked the earlier column grants and omitted the anonymous preferences revocation relative to bootstrap defaults.
Fix: append an explicit revoke/grant baseline to the unpublished initial migration, preserving column-restricted profile writes and owner-only RLS. Apply the same ACL locally, rerun the database suite, then replay from clean state again. Do not grant unrestricted profile writes or remove security assertions.

## Failure 6 — browser navigation race

Test: recovery step after login/logout. Expected reset form submission; actual the email input was empty and no recovery POST occurred.
Root cause: immediately after clicking Forgot password, the test filled the still-visible login email field before navigation completed. The new reset form then rendered empty and browser required validation blocked submission.
Fix: wait for the recovery page heading before filling its email field. Keep real submission and email-delivery assertions.

## Failure 7 — failed login cleared the email

Test: old password rejected, new password succeeds after recovery. Expected email retained for retry; actual React reset uncontrolled form inputs after the action returned an error result. The empty required email blocked the retry.
Fix: retain the non-sensitive email in controlled client state. Password remains cleared after submission. Add an explicit email-retention assertion before retrying the new password. Rebuild and rerun all auth journeys.

## Failure 8 — profile checkbox reset

Test: profile conflict retains all non-sensitive input. Expected selected football interest retained; actual the action's native form reset unchecked the checkbox despite controlled state.
Fix: prevent native reset on the profile form; successful saves redirect, while failed saves keep the edited fields and selections. The test retains assertions for username, name, bio and favorite checkbox.

Failure 8 follow-up: preventing the reset event did not stop React's scheduled host-form reset. The installed React implementation schedules reset for automatic form actions. Use the documented manual useActionState dispatch inside startTransition from onSubmit, while retaining the action prop for pre-hydration submission. This avoids automatic reset on hydrated submissions. The selection assertion remains unchanged. Reference: https://react.dev/reference/react/useActionState.

## Final result

PASS: clean migration replay, security advisor, 20 unit/component tests, 1 real health-route integration, 8 real local Supabase tests, strict type-check, lint, production build, 6 public E2E and 4 full auth E2E on desktop/mobile, formatting, npm audit (0 vulnerabilities). Profile input retention is covered by a component test; full browser journeys include email confirmation and recovery via Mailpit. Hosted Google/SMTP and deployment remain unverified configuration.
