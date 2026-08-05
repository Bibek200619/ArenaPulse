# Contributing

Use Node 22, npm ci and a feat/* or fix/* branch from development (or a documented stacked prerequisite). Follow plan.md in order. Keep coherent conventional commits and real timestamps. Never manufacture contribution counts.

Run npm run check and npm run format:check before marking a milestone ready. For a failed check, record the failure/expected/actual/root cause/small fix and verification checklist under docs/engineering, then rerun the failed check and integration gates. Never disable failing tests to pass.

Update plan.md and CHANGELOG.md. Include database migrations and adversarial RLS tests for persistence changes. No secrets in source, logs, screenshots or test artifacts. PRs use the repository template, link a milestone issue and include actual test evidence. Do not merge known-broken code. See SECURITY.md for reporting vulnerabilities.
