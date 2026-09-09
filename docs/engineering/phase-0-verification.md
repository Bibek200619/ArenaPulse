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

- [ ] failing lint rerun
- [ ] unit and integration tests
- [ ] type-check
- [ ] production build
- [ ] desktop/mobile E2E and visual review

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
