import { randomUUID } from 'node:crypto';
import { expect, type Page, type APIRequestContext } from '@playwright/test';
export async function emailLink(
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

export async function registerFan(page: Page, request: APIRequestContext) {
  const suffix = randomUUID().slice(0, 8),
    username = `crowd_${suffix}`,
    email = `${username}@example.test`;
  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page
    .getByLabel('Password', { exact: true })
    .fill(`Social-${randomUUID()}`);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Check your email');
  await page.goto(await emailLink(request, email, 'Confirm'));
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page
    .getByLabel('Display name', { exact: true })
    .fill(`Crowd ${suffix}`);
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page).toHaveURL(/\/onboarding\/sports$/);
  return username;
}
