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

- [ ] rerun two-user browser flow
- [ ] related public browser flows
- [x] following-feed join against actual Supabase: 42 DB tests passed
- [ ] final unit/API integration
- [ ] final type-check/lint/build/format

## Failure: streamed not-found transport status

Test: private post/profile navigation in the two-user browser journey.
Expected: transport status 404 immediately after navigation.
Actual: Next.js sent a 200 loading shell before the asynchronous RLS lookup completed.
Root cause: installed Next.js not-found documentation explicitly specifies 200 for streamed responses and 404 for non-streamed responses. The test asserted a transport status before the terminal page rendered.
Fix: require the not-found UI and noindex metadata, assert private text is absent both from the rendered document and complete HTML response, and keep actual RLS permission tests. Apply the same terminal-state assertion to deleted posts. Do not remove loading states or weaken privacy checks.
Verification: rerun the two-user flows and complete public/auth browser suites.


Follow-up: the streamed not-found response briefly contains robots metadata in both head and body. The initial metadata locator was ambiguous. Scope the assertion to `head meta[name="robots"]`, the document metadata that controls indexing; retain the full-response private-text checks.
