import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('sports catalog renders multiple sports with explicit demo provenance', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/matches');
  await expect(
    page.getByRole('heading', { name: 'Matches', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Fictional demo data/)).toBeVisible();
  for (const name of ['Football', 'Cricket', 'Basketball', 'Tennis']) {
    await expect(
      page.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByText('172/6').first()).toBeVisible();
  await expect(page.getByText('In progress · Demo').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
});
