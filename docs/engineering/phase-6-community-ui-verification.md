# Community application verification

## Failure: robots directive assertion

Test: authenticated community desktop/mobile journey.
Expected: private access pages prohibit indexing.
Actual: the shared helper rejected a `noindex, nofollow` meta value.

## Root cause

The helper compared the complete string to `noindex`. Playwright trace snapshots show the page correctly includes both noindex and nofollow; no private community name appeared in the outsider response.

## Fix

Parse comma-separated directives and require noindex in every robots tag, rejecting contradictory index directives. Retain the requirement for at least one tag and all private-response checks.

## Verification

- [ ] failing desktop/mobile journeys rerun
- [ ] public/social browser regressions
- [x] real database integration: 59 passed
- [x] unit/component/API integration: 73 passed
- [ ] final type-check/lint/format/build
