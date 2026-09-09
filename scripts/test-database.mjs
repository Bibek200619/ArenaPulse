import { execFileSync, spawnSync } from 'node:child_process';
const status = JSON.parse(
  execFileSync('npx', ['supabase', 'status', '--output', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
if (status.API_URL !== 'http://127.0.0.1:55431')
  throw new Error('Refusing a non-ArenaPulse local stack.');
const result = spawnSync(
  'npx',
  ['vitest', 'run', '--config', 'vitest.db.config.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
      SUPABASE_TEST_SECRET_KEY: status.SECRET_KEY,
    },
  },
);
process.exit(result.status ?? 1);
