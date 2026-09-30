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
import { CreateCommunityForm } from '@/features/communities/forms';
const { changeCommunity, push } = vi.hoisted(() => ({
  changeCommunity: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/features/communities/actions', () => ({ changeCommunity }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
afterEach(cleanup);
it('keeps community entries after a failure and navigates only after confirmed creation', async () => {
  changeCommunity
    .mockResolvedValueOnce({ error: 'Slug already exists.' })
    .mockResolvedValueOnce({ id: 'created-community', success: 'Saved.' });
  render(<CreateCommunityForm sports={[]} />);
  const name = screen.getByLabelText('Community name'),
    slug = screen.getByLabelText('Unique slug');
  fireEvent.change(name, { target: { value: 'Matchday fans' } });
  fireEvent.change(slug, { target: { value: 'matchday' } });
  fireEvent.submit(name.closest('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Slug already exists.',
  );
  expect(name).toHaveValue('Matchday fans');
  expect(slug).toHaveValue('matchday');
  expect(push).not.toHaveBeenCalled();
  fireEvent.change(slug, { target: { value: 'matchday-fans' } });
  fireEvent.submit(name.closest('form')!);
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith('/communities/created-community'),
  );
});
