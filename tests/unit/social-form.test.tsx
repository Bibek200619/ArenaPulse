// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ContentForm } from '@/features/social/forms';
const { changeSocial, push } = vi.hoisted(() => ({
  changeSocial: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/features/social/actions', () => ({ changeSocial }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
afterEach(cleanup);
it('retains a draft after a server failure and clears it only after success', async () => {
  changeSocial
    .mockResolvedValueOnce({ error: 'Please wait a minute.' })
    .mockResolvedValueOnce({ success: 'Saved.', postId: 'new-post' });
  render(<ContentForm />);
  const input = screen.getByLabelText('Your sports take');
  fireEvent.change(input, { target: { value: 'My match thoughts' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Please wait a minute.',
  );
  expect(input).toHaveValue('My match thoughts');
  fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/posts/new-post'));
  expect(input).toHaveValue('');
});
