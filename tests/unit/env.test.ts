import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '@/lib/env';
describe('environment validation', () => {
  it('boots the public shell without credentials and keeps predictions off', () => {
    const env = parseEnvironment({});
    expect(env.PREDICTIONS_ENABLED).toBe('false');
    expect(env.SPORTS_DATA_PROVIDER).toBe('demo');
  });
  it('rejects partial Supabase configuration', () => {
    expect(() =>
      parseEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow('Invalid environment');
  });
  it('accepts paired publishable configuration', () => {
    expect(
      parseEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }).NEXT_PUBLIC_SUPABASE_URL,
    ).toBe('https://example.supabase.co');
  });
  it('rejects service credentials without leaking their value', () => {
    const secret = 'sb_secret_do_not_log';
    let message = '';
    try {
      parseEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('Invalid environment');
    expect(message).not.toContain(secret);
  });
  it.each(['yes', '1', 'TRUE'])(
    'rejects ambiguous prediction flag %s',
    (flag) => {
      expect(() => parseEnvironment({ PREDICTIONS_ENABLED: flag })).toThrow();
    },
  );
  it('rejects non-http callback origin', () => {
    expect(() =>
      parseEnvironment({ APP_URL: 'javascript:alert(1)' }),
    ).toThrow();
  });
});
