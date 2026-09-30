import { expect, test } from '@playwright/test';
import { expectNoIndex } from '../helpers/browser';
test('community discovery handles unavailable accounts and rejects malformed navigation', async ({
  page,
}) => {
  await page.goto('/communities');
  await expect(
    page.getByRole('heading', { name: 'Communities', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel('Community name starts with')
      .or(
        page.getByText(
          'Communities are unavailable until accounts are configured.',
          { exact: false },
        ),
      ),
  ).toBeVisible();
  await page.goto('/communities?page=-1');
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'valid page',
  );
  await page.goto('/communities/not-a-uuid');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'This one is out of play.',
  );
  await expectNoIndex(page);
  await page.goto('/communities/new');
  await expect(page).toHaveURL(/\/login$/);
});
