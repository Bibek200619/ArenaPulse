import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { registerFan } from './helpers';

async function openMatch(page: Page, matchId: string) {
  await page.goto(`/matches/${matchId}#discussion-heading`);
  await expect(
    page.getByRole('heading', { name: 'Fan discussion' }),
  ).toBeVisible();
}

test('two fans discuss a match without leaking messages to another match', async ({
  page,
  browser,
  request,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await registerFan(page, request);
  const firstMatch = '513a966a-6a38-58a4-ad7a-6ec05e3789a2';
  const otherMatch = 'd2455f96-3463-5adb-bb88-b61129227b5d';
  const bobContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100',
    viewport: page.viewportSize(),
    isMobile: testInfo.project.name.includes('mobile'),
  });
  const bobPage = await bobContext.newPage();
  bobPage.on('pageerror', (error) => errors.push(error.message));
  try {
    const bob = await registerFan(bobPage, request);
    const message = `Match take ${randomUUID().slice(0, 8)}`;
    await openMatch(page, firstMatch);
    await page.getByLabel('Your match comment').fill(message);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();

    await openMatch(bobPage, firstMatch);
    await expect(bobPage.getByText(message, { exact: true })).toBeVisible();
    const discussionMessage = bobPage
      .locator('.discussion-message')
      .filter({ hasText: message })
      .first();
    await discussionMessage.getByRole('button', { name: /Like · 0/ }).click();
    await expect(
      discussionMessage.getByRole('button', { name: /Unlike · 1/ }),
    ).toBeVisible();
    await discussionMessage
      .locator('summary')
      .filter({ hasText: 'Reply' })
      .click();
    await discussionMessage
      .getByLabel('Write a reply')
      .fill(`Reply from ${bob}`);
    await discussionMessage
      .getByRole('button', { name: 'Reply', exact: true })
      .click();
    await expect(
      bobPage.getByText(`Reply from ${bob}`, { exact: true }),
    ).toBeVisible();

    await openMatch(bobPage, otherMatch);
    await expect(bobPage.getByText(message, { exact: true })).toHaveCount(0);
    await expect(
      bobPage.getByText('No discussion yet. Start the conversation.'),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await bobContext.close();
  }
});
