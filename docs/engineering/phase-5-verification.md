# Phase 5 verification

## Failure: formatting convergence

Test: npm run format:check.
Expected: the newly formatted database test is stable.
Actual: Prettier requested another pass on five wrapped await/member chains.
Root cause: the first formatting pass produced non-idempotent wrapping for these chains. Comparing a second formatter output showed whitespace-only differences.
Fix: run Prettier again on the test and verify the complete formatting gate; no assertions or configuration changes.

## Verification

- [x] formatting gate rerun
- [x] real database suite after clean replay: 41 passed
- [x] unit/component: 51 passed
- [x] API integration: 9 passed
- [x] type-check and lint
- [x] production build
- [x] existing authentication/follow browser regressions: 4 desktop/mobile passed

Security advisor returned no issues before and after replay. Local migration history matches all three migrations. The generated social migration receives explicit final ACLs for column grants and private function permissions, accounting for the already documented pg-delta ordering issue.

## Failure: ambiguous reply disclosure locator

Test: two-user social browser journey, desktop and mobile.
Expected: open Bob's reply disclosure.
Actual: getByText matched both the disclosure summary and the enclosed textarea label.
Root cause: both intentionally describe the same reply recipient; a text-only selector is ambiguous, including hidden label nodes.
Fix: target the semantic summary element for the disclosure, retaining the explicit textarea label for input. No accessibility labels or application behavior are removed.

## Application verification

- [x] rerun two-user browser flow
- [x] related public browser flows
- [x] following-feed join against actual Supabase: 42 DB tests passed
- [x] final unit/API integration
- [x] final type-check/lint/build/format

## Failure: streamed not-found transport status

Test: private post/profile navigation in the two-user browser journey.
Expected: transport status 404 immediately after navigation.
Actual: Next.js sent a 200 loading shell before the asynchronous RLS lookup completed.
Root cause: installed Next.js not-found documentation explicitly specifies 200 for streamed responses and 404 for non-streamed responses. The test asserted a transport status before the terminal page rendered.
Fix: require the not-found UI and noindex metadata, assert private text is absent both from the rendered document and complete HTML response, and keep actual RLS permission tests. Apply the same terminal-state assertion to deleted posts. Do not remove loading states or weaken privacy checks.
Verification: rerun the two-user flows and complete public/auth browser suites.

Follow-up: the streamed not-found response briefly contains robots metadata in both head and body. The initial metadata locator was ambiguous. Scope the assertion to `head meta[name="robots"]`, the document metadata that controls indexing; retain the full-response private-text checks.

## Failure: public validation alert selector

Test: public social navigation, desktop/mobile.
Expected: invalid pagination message is announced.
Actual: the page alert and Next.js route announcer both matched an unscoped alert selector.
Root cause: Next.js adds a second alert outside main during navigation.
Fix: scope the validation assertion to main, consistent with existing authentication tests. Keep both live regions intact.
Verification: rerun all public browser cases.

Visual verification: agent-browser loaded the feed and reported no browser errors, but subsequent captures intermittently returned an empty tool page. Used Playwright with an explicit page lifecycle to capture the actual desktop/mobile feed and verify Find fans navigation/overflow. Chromium needed the normal macOS sandbox escalation. Both reviewed screenshots contain only disposable local test activity, including an intentionally escaped HTML test string; this is not production content.

## Failure: logging spy was unused

Test: lint, zero-warning gate.
Expected: safe-error test verifies the structured log envelope.
Actual: a spy was created but the intended assertion was missing, producing an unused-variable warning.
Root cause: an earlier edit added the spy without the matching assertion.
Fix: assert the exact safe structured log object; this also prevents raw exception/credential logging regressions. Rerun unit tests, lint and the final gates.

The malformed-ID public route can hoist both noindex tags into head, so even head-scoping is insufficient. Replace singleton metadata assertions with one shared semantic check: at least one robots tag must exist in head and every such tag must be noindex. This covers both streaming paths without assuming framework tag cardinality or accepting contradictory indexing directives.

Final application milestone: 58 unit/component + 9 API integration, 42 actual DB tests, 16 public desktop/mobile E2E and 6 real auth/social E2E pass. Type-check, lint, final production build and formatting pass; security advisor clear; production audit zero vulnerabilities. Reviewed desktop/mobile screenshots and navigation have no overflow/client runtime errors. Two server-side stream-closed messages appeared during one navigation run without failing the terminal page or client assertions; no raw private text was returned. Hosted deployment is not verified or claimed.
