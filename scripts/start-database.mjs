import { execFileSync } from 'node:child_process';
console.log(
  'Starting isolated ArenaPulse database services (local CLI credentials are withheld from logs).',
);
try {
  execFileSync(
    'npx',
    [
      'supabase',
      'start',
      '--exclude',
      'studio,meta,realtime,storage,imgproxy,edge-runtime,analytics,vector',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 },
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
