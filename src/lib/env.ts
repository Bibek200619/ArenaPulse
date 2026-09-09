import { z } from 'zod';

const optionalValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const environmentSchema = z
  .object({
    APP_URL: z.url().default('http://localhost:3000'),
    NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.url().optional(),
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalValue,
    PREDICTIONS_ENABLED: z.enum(['true', 'false']).default('false'),
    GOOGLE_OAUTH_ENABLED: z.enum(['true', 'false']).default('false'),
    SPORTS_DATA_PROVIDER: z.enum(['demo']).default('demo'),
  })
  .superRefine((env, ctx) => {
    if (
      Boolean(env.NEXT_PUBLIC_SUPABASE_URL) !==
      Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_SUPABASE_URL'],
        message: 'Configure both Supabase public values together.',
      });
    }
    const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (key && !key.startsWith('sb_publishable_')) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
        message: 'Use a Supabase publishable key, never a secret/service key.',
      });
    }
    if (!['http:', 'https:'].includes(new URL(env.APP_URL).protocol)) {
      ctx.addIssue({
        code: 'custom',
        path: ['APP_URL'],
        message: 'Use an HTTP(S) origin.',
      });
    }
  });

export function parseEnvironment(input: Record<string, string | undefined>) {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    // Field paths are safe to log; never include submitted values or credentials.
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  return result.data;
}
