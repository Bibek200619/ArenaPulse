import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
const status = JSON.parse(
  execFileSync('npx', ['supabase', 'status', '--output', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
if (status.API_URL !== 'http://127.0.0.1:55431')
  throw new Error('Refusing a non-ArenaPulse local stack.');
const publishable = status.PUBLISHABLE_KEY;
if (!publishable?.startsWith('sb_publishable_'))
  throw new Error('Local stack must expose a publishable key.');
if (existsSync('.env.local'))
  throw new Error(
    '.env.local already exists; keep its existing values or move it aside deliberately.',
  );
writeFileSync(
  '.env.local',
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishable}\nAPP_URL=http://127.0.0.1:3000\nPREDICTIONS_ENABLED=false\nSPORTS_DATA_PROVIDER=demo\n`,
  { mode: 0o600 },
);
console.log(
  'Wrote ignored local-only public configuration. No secret key was written.',
);
