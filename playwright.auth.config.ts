import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/auth-e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'auth-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'auth-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/api/health',
    reuseExistingServer: false,
    timeout: 60_000,
    env: { APP_URL: 'http://127.0.0.1:3100' },
  },
});
