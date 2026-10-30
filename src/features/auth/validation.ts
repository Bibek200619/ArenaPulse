import { z } from 'zod';
const normalizedEmailSchema = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const credentialsSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
});
export const loginCredentialsSchema = z.object({
  email: normalizedEmailSchema,
  // Existing accounts may predate the current 12-character creation policy.
  password: z.string().min(1).max(128),
});
export const emailSchema = credentialsSchema.pick({ email: true });
export const passwordSchema = credentialsSchema.pick({ password: true });
export const sports = [
  'football',
  'cricket',
  'basketball',
  'tennis',
  'motorsport',
] as const;
export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(24)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Use letters, numbers and underscores, starting with a letter.',
    ),
  display_name: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(280).default(''),
  country: z.string().trim().max(60).default(''),
  favorite_sports: z
    .array(z.enum(sports))
    .max(5)
    .transform((values) => [...new Set(values)]),
  is_private: z.boolean().default(false),
});
export function callbackDestination(type: string | null) {
  return type === 'recovery' ? '/reset-password' : '/onboarding';
}
