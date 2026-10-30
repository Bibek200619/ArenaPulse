import { execFileSync } from 'node:child_process';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
console.log(
  'Starting isolated ArenaPulse database services (local CLI credentials are withheld from logs).',
);
try {
  execFileSync(
    npx,
    [
      'supabase',
      'start',
      '--exclude',
      'studio,meta,realtime,storage,imgproxy,edge-runtime,analytics,vector',
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
      shell: process.platform === 'win32',
    },
  );
  console.log(
    'ArenaPulse local services started. Run npm run db:env for public configuration.',
  );
} catch {
  console.error(
    'Local Supabase startup failed. Check Docker health and available ports; CLI output is withheld because it can contain credentials.',
  );
  process.exit(1);
}
