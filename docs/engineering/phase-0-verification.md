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
