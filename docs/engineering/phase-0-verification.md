# Phase 0 verification

## Failure 1

Test: npm run lint (zero-warning gate).
Expected: no warnings.
Actual: import/no-anonymous-default-export on postcss.config.mjs.

## Root Cause

The initial PostCSS configuration exported an anonymous object, contrary to the enabled Next.js lint preset.

## Fix

1. Name the configuration object before export.
2. Declare the root package as ESM to remove the Vitest native-config compatibility warning.
3. Rerun lint and the complete integration/type/build/browser gates.

## Verification

- [x] failing lint rerun
- [x] unit and integration tests
- [x] type-check
- [x] production build
- [x] desktop/mobile E2E and visual review

## Failure 2

Test: npm run format:check.
Expected: all maintained files formatted.
Actual: this newly written engineering note was unformatted.
Root cause: note was added after the initial formatter run.
Fix: format the note and rerun the format gate before publication.

## Failure 3

Test: desktop/mobile unknown-route HTTP status.
Expected: 404. Actual: 200 with streamed not-found UI.
Root cause: the dynamic placeholder route accepts arbitrary params and begins streaming before notFound executes.
Fix: set dynamicParams=false because the foundation has a finite, statically generated set of sections. Keep the 404 assertion unchanged.
Verification: rerun build and both browser projects, then integration/type/lint gates.

## Follow-up from Failure 3

The dynamicParams fix passed HTTP assertions but Next.js logged Internal: NoFallbackError for unknown routes. Replaced the temporary catch-all with explicit route files, removing runtime fallback routing entirely. The shared copy stays in lib/sections.ts. Rerun all gates after this change.

## Failure 4

Test: type-check after replacing dynamic routes.
Expected: generated validators reflect current routes.
Actual: .next/dev/types retained a validator importing the removed catch-all.
Root cause: the running dev server retained generated route types during route restructuring.
Fix: stop the task dev server and clear only generated .next/dev/types; rerun typegen and all gates. No source or tests are removed.

## Environment failure 5

Test: build inside restricted sandbox.
Expected: CSS compilation. Actual: Turbopack worker could not bind a local port (Operation not permitted).
Root cause: execution sandbox, not application code.
Fix: rerun the unchanged full check with approved local-process permissions.

The first approved rerun reproduced the cached CSS worker panic. Clear the generated .next cache and rebuild directly with approved permissions; no source changes.

## Final result (2026-09-09)

PASS: 10 unit, 1 real health-route integration, strict type-check, zero-warning lint, production build, 6 desktop/mobile E2E, formatting and npm audit (0 vulnerabilities). Unknown-route 404 is correct with no NoFallbackError log. Development browser screenshot review completed at desktop and 390px mobile; no runtime errors/overlay. Screenshots in docs/screenshots. No auth/database features claimed tested in this milestone.
