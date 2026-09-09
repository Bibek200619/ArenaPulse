import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
async function emailLink(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const result = await request.get(
          `http://127.0.0.1:55434/api/v1/search?query=${encodeURIComponent(`to:${email} subject:${subject}`)}`,
        );
        if (!result.ok()) return false;
        const body = await result.json();
        const message = body.messages?.[0];
        if (!message) return false;
        const response = await request.get(
          `http://127.0.0.1:55434/api/v1/message/${message.ID}`,
        );
        const detail = await response.json();
        link = detail.HTML?.match(/href="([^"]+)"/)?.[1]?.replaceAll(
          '&amp;',
          '&',
        );
        return Boolean(link);
      },
      { timeout: 25_000, message: 'Local confirmation/recovery email arrives' },
    )
    .toBe(true);
  return link!;
}
test('register → confirm → onboard → edit → logout → login → recover', async ({
  page,
  request,
}) => {
  const suffix = randomUUID().slice(0, 8);
  const email = `arena-${suffix}@example.test`;
  const username = `fan_${suffix}`;
  const password = `Initial-${randomUUID()}`;
  const newPassword = `Updated-${randomUUID()}`;
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Check your email');
  const confirmation = await emailLink(request, email, 'Confirm');
  await page.goto(confirmation);
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Display name', { exact: true }).fill('Matchday Fan');
  await page.getByLabel('football', { exact: true }).check();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Matchday Fan',
  );
  await page.reload();
  await expect(page.getByText(`@${username}`, { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Edit profile' }).click();
  await page.getByLabel('Bio', { exact: true }).fill('Here for every moment.');
  await page.getByLabel('Keep my profile private').check();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Here for every moment.')).toBeVisible();
  await expect(page.getByText(/Private profile/)).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Get back in the game.',
  );
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Send reset email' }).click();
  await expect(page.getByRole('status')).toContainText(
    'If this account exists',
  );
  await page.goto(await emailLink(request, email, 'Reset'));
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Unable to sign in',
  );
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email);
  await page.getByLabel('Password', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('invalid callback stays local and provides a recoverable error', async ({
  page,
}) => {
  await page.goto('/auth/callback?next=https://evil.example&type=bad');
  await expect(page).toHaveURL(
    'http://127.0.0.1:3100/login?error=invalid_link',
  );
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'invalid or expired',
  );
});
