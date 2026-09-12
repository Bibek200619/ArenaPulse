import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { emailLink } from './helpers';
async function register(page: Page, request: APIRequestContext) {
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
test('two fans publish, follow, react, reply and preserve privacy', async ({
  page,
  browser,
  request,
}, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const alice = await register(page, request);
  await page.goto('/feed');
  const body = `Opening night for ${alice}. <script>window.pwned=true</script>`;
  await page.getByLabel('Your sports take').fill(body);
  await page.getByRole('button', { name: 'Publish post' }).click();
  await expect(page).toHaveURL(/\/posts\/[0-9a-f-]+$/);
  const postUrl = page.url();
  await expect(page.getByText(body, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => 'pwned' in window)).toBe(false);
  const other = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100',
    viewport: page.viewportSize(),
    isMobile: testInfo.project.name.includes('mobile'),
  });
  const bobPage = await other.newPage();
  bobPage.on('pageerror', (error) => errors.push(error.message));
  try {
    const bob = await register(bobPage, request);
    await bobPage.goto(`/people?q=${alice}`);
    await bobPage.getByRole('link', { name: new RegExp(`@${alice}`) }).click();
    await bobPage
      .getByRole('button', { name: `Follow @${alice}`, exact: true })
      .click();
    await expect(
      bobPage.getByRole('button', { name: `Unfollow @${alice}`, exact: true }),
    ).toBeVisible();
    await bobPage.reload();
    await expect(
      bobPage.getByRole('button', { name: `Unfollow @${alice}`, exact: true }),
    ).toBeVisible();
    await bobPage.goto('/feed?view=following');
    await expect(bobPage.getByText(body, { exact: true })).toBeVisible();
    await bobPage.getByRole('link', { name: 'Open conversation →' }).click();
    await bobPage
      .getByRole('button', { name: 'Like post', exact: true })
      .click();
    await expect(
      bobPage.getByRole('button', { name: 'Unlike post', exact: true }),
    ).toBeVisible();
    await bobPage
      .getByLabel('Your comment', { exact: true })
      .fill('Ready for the new season.');
    await bobPage
      .getByRole('button', { name: 'Send comment', exact: true })
      .click();
    await expect(
      bobPage.getByText('Ready for the new season.', { exact: true }),
    ).toBeVisible();
    await expect(
      bobPage.getByRole('button', { name: 'Delete post', exact: true }),
    ).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByText('1 visible likes', { exact: true }),
    ).toBeVisible();
    await page
      .locator('summary')
      .filter({ hasText: `Reply to @${bob}` })
      .click();
    await page
      .getByLabel(`Reply to @${bob}`, { exact: true })
      .fill('See you in the crowd!');
    await page
      .getByLabel(`Reply to @${bob}`, { exact: true })
      .locator('..')
      .getByRole('button', { name: 'Send comment' })
      .click();
    await expect(
      page.getByText('See you in the crowd!', { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveTitle('Conversation | ArenaPulse');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.goto('/settings/profile');
    await page.getByLabel('Keep my profile private').check();
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    expect((await bobPage.goto(postUrl))?.status()).toBe(404);
    expect((await bobPage.goto(`/users/${alice}`))?.status()).toBe(404);
    await bobPage.goto('/feed?view=following');
    await expect(bobPage.getByText(body, { exact: true })).toHaveCount(0);
    await page.goto(postUrl);
    await expect(page.getByText(body, { exact: true })).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page
      .getByRole('button', { name: 'Delete post', exact: true })
      .click();
    await expect(page).toHaveURL(/\/feed$/);
    expect((await page.goto(postUrl))?.status()).toBe(404);
    expect(errors).toEqual([]);
  } finally {
    await other.close();
  }
});
