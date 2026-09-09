// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { ProfileForm } from '@/features/auth/profile-form';
vi.mock('@/features/auth/actions', () => ({
  saveProfile: vi.fn(async () => ({
    error: 'That username is already taken.',
  })),
}));
it('preserves profile input when the server rejects a conflicting username', async () => {
  render(<ProfileForm />);
  fireEvent.change(screen.getByLabelText('Username', { exact: true }), {
    target: { value: 'existing_fan' },
  });
  fireEvent.change(screen.getByLabelText('Display name'), {
    target: { value: 'New fan' },
  });
  fireEvent.change(screen.getByLabelText('Bio'), {
    target: { value: 'My sports story' },
  });
  fireEvent.click(screen.getByLabelText('football'));
  expect(screen.getByLabelText('football')).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('already taken');
  expect(screen.getByLabelText('Username', { exact: true })).toHaveValue(
    'existing_fan',
  );
  expect(screen.getByLabelText('Display name')).toHaveValue('New fan');
  expect(screen.getByLabelText('Bio')).toHaveValue('My sports story');
  expect(screen.getByLabelText('football')).toBeChecked();
});
