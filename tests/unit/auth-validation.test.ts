import { expect, it } from 'vitest';
import {
  credentialsSchema,
  profileSchema,
  callbackDestination,
} from '@/features/auth/validation';
const profile = {
  username: 'Fan_123',
  display_name: 'Fan',
  favorite_sports: ['football'],
};
it('canonicalizes username and email', () => {
  expect(profileSchema.parse(profile).username).toBe('fan_123');
  expect(
    credentialsSchema.parse({
      email: 'FAN@example.com',
      password: 'a-long-test-password',
    }).email,
  ).toBe('fan@example.com');
});
it.each(['ab', '3invalid', 'name with spaces', '<script>', 'a'.repeat(25)])(
  'rejects username %s',
  (username) => {
    expect(profileSchema.safeParse({ ...profile, username }).success).toBe(
      false,
    );
  },
);
it('rejects short passwords, oversized bios and unknown sports', () => {
  expect(
    credentialsSchema.safeParse({ email: 'x@y.com', password: 'short' })
      .success,
  ).toBe(false);
  expect(
    profileSchema.safeParse({ ...profile, bio: 'x'.repeat(281) }).success,
  ).toBe(false);
  expect(
    profileSchema.safeParse({ ...profile, favorite_sports: ['invented'] })
      .success,
  ).toBe(false);
});
it('deduplicates favorite sports and allows skipping interests', () => {
  expect(
    profileSchema.parse({
      ...profile,
      favorite_sports: ['football', 'football'],
    }).favorite_sports,
  ).toEqual(['football']);
  expect(
    profileSchema.parse({ ...profile, favorite_sports: [] }).favorite_sports,
  ).toEqual([]);
});
it('never redirects callbacks to arbitrary input', () => {
  expect(callbackDestination('recovery')).toBe('/reset-password');
  expect(callbackDestination('https://evil.example')).toBe('/onboarding');
  expect(callbackDestination(null)).toBe('/onboarding');
});
