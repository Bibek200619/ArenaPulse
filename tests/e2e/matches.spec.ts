import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('filter a sport, open match details and return to results', async ({
  page,
}) => {
  await page.goto('/matches');
  await page
    .getByLabel('Sport', { exact: true })
    .selectOption({ label: 'Football' });
  await page.getByLabel('Show', { exact: true }).selectOption('live');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(
    page.getByText('1 matches · Page 1 · Times in UTC'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Cricket', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('link', { name: /Harbour Athletic vs Summit United/ })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Harbour Athletic vs Summit United',
  );
  await expect(
    page.getByText('Casey Vale scores for Harbour Athletic.'),
  ).toBeVisible();
  await expect(page.getByRole('table').first()).toContainText('Possession');
  await expect(
    page.getByRole('heading', { name: 'Lineups', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/illustrative subsets/)).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: '← All matches' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matches');
});
test('pagination, scheduled empty data and no-results states are honest', async ({
  page,
}) => {
  await page.goto('/matches');
  await page.getByRole('link', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await page
    .getByRole('link', { name: /Harbour Athletic vs Summit United/ })
    .click();
  await expect(
    page.getByText('No event timeline is available for this match.'),
  ).toBeVisible();
  await expect(
    page.getByText('No statistics are available for this match.'),
  ).toBeVisible();
  await page.goto('/matches?date=2020-01-01');
  await expect(
    page.getByRole('heading', { name: 'No matches found' }),
  ).toBeVisible();
  await page.goto('/matches?page=-1');
  await expect(
    page.getByRole('heading', { name: 'Invalid match filters' }),
  ).toBeVisible();
  await page.goto('/matches/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'out of play',
  );
});
