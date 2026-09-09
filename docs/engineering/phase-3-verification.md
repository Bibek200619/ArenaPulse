# Phase 3 verification

## Failure

Test: desktop/mobile sport filter journey.
Expected: select Football by its exact label.
Actual: getByLabel could not match the wrapping label, which also includes select option text; browser accessible combobox name is correctly “Sport”.

## Root cause

Wrapping select labels include all option text for Playwright label-text queries. This made the test selector ambiguous relative to the accessibility tree.

## Fix

1. Give each filter a stable id and a separate explicit label; this also simplifies assistive-technology association.
2. Rebuild and rerun filter journeys and all public browser checks.

## Verification

- [ ] failing test rerun
- [ ] related tests
- [ ] integration tests
- [ ] type-check
- [ ] lint
- [ ] build
