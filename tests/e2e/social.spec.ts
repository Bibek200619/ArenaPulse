import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('visitor can explore the crowd with honest account availability', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/feed');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Activity feed',
  );
  await expect(
    page
      .getByRole('link', { name: 'Sign in to join the conversation →' })
      .or(
        page.getByText(
          'The crowd is unavailable until accounts are configured. Please try again later.',
        ),
      ),
  ).toBeVisible();
  await expect(page).toHaveTitle('Activity feed | ArenaPulse');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
      .violations,
  ).toEqual([]);
  await page
    .getByRole('navigation', { name: 'Social', exact: true })
    .getByRole('link', { name: 'Find fans' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find fans');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto('/feed?page=-1');
  await expect(page.getByRole('alert')).toContainText('valid feed and page');
  expect((await page.goto('/posts/not-a-uuid'))?.status()).toBe(404);
  expect(errors).toEqual([]);
});
