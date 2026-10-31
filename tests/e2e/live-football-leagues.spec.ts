import { expect, test } from '@playwright/test';

test('filters live SportScore fixtures to a preferred football league', async ({
  page,
}) => {
  await page.goto('/matches');
  const league = page.getByLabel('Football league', { exact: true });
  await expect(league).toBeVisible();
  await expect(league.locator('option')).toHaveText([
    'All football leagues',
    'Champions League',
    'English Premier League',
    'Spanish La Liga',
    'Italian Serie A',
    'Bundesliga',
    'French Ligue 1',
    'Netherlands Eredivisie',
    'Brazilian Serie A',
    'English Football League Championship',
    'Austrian Bundesliga',
  ]);

  await league.selectOption('premier-league');
  await page.getByRole('button', { name: 'Apply filters' }).click();

  await expect(page).toHaveURL(/footballLeague=premier-league/);
  await expect(page.locator('.results-count')).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole('link', { name: 'Powered by SportScore' }),
  ).toBeVisible();
  const fixtureRows = page.locator('.fixture-row');
  const count = await fixtureRows.count();
  for (let index = 0; index < count; index += 1) {
    await expect(fixtureRows.nth(index)).toContainText(
      'English Premier League',
    );
    await expect(fixtureRows.nth(index)).toContainText('SportScore');
  }
  if (count === 0) {
    await expect(
      page.getByRole('heading', { name: 'No matches found' }),
    ).toBeVisible();
  }
});
