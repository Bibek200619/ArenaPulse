// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { LiveRefresh } from '@/components/matches/live-refresh';
const { refresh, router } = vi.hoisted(() => {
  const refresh = vi.fn();
  return { refresh, router: { refresh } };
});
vi.mock('next/navigation', () => ({ useRouter: () => router }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('refreshes only visible live coverage at thirty-second intervals and cleans up', () => {
  vi.useFakeTimers();
  const visibility = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('visible');
  const { unmount } = render(<LiveRefresh enabled />);
  act(() => vi.advanceTimersByTime(29_999));
  expect(refresh).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(refresh).toHaveBeenCalledTimes(1);
  visibility.mockReturnValue('hidden');
  act(() => vi.advanceTimersByTime(30_000));
  expect(refresh).toHaveBeenCalledTimes(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it('does not poll the fixed demo snapshot', () => {
  vi.useFakeTimers();
  render(<LiveRefresh enabled={false} />);
  act(() => vi.advanceTimersByTime(90_000));
  expect(refresh).not.toHaveBeenCalled();
});
