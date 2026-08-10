import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('home is responsive, accessible, honest and navigable', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Sport is better',
  );
  await expect(page.getByText('No live sports data connected')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole('link', { name: 'Explore matches' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matches');
  await page
    .getByRole('link', { name: 'ArenaPulse home', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Sport is better',
  );
  expect(errors).toEqual([]);
});
test('unknown routes show a real 404 and keyboard skip navigation works', async ({
  page,
}) => {
  const response = await page.goto('/unknown-route');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'out of play',
  );
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
});
test('prediction preview never presents a prediction', async ({ page }) => {
  await page.goto('/predictions');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'ArenaPulse Prediction Engine — Coming Soon',
  );
  await expect(page.getByText(/No predictions are available/)).toBeVisible();
});
