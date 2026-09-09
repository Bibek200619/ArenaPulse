# Testing

npm run test:unit checks invalid environment input and safe errors. npm run test:integration invokes the real health handler. npm run type-check generates route types and runs strict tsc. npm run lint fails on warnings. npm run build builds production. npm run test:e2e starts that production app on 127.0.0.1:3100 and tests Chromium desktop/mobile navigation, 404 status, skip link, width overflow, unavailable predictions, runtime errors and axe WCAG A/AA checks.

npm run check runs all gates sequentially. npm run format:check adds formatting verification. Install browsers once using npx playwright install chromium. Browser reports and traces are ignored and CI uploads failures. These tests do not yet verify authentication, RLS, data persistence, full keyboard flows or all screen readers. Add those with their actual milestones.
