import { expect, test } from '@playwright/test';
import { registerFan } from './helpers';

test('a fan builds, saves and reloads a rules-checked fantasy squad', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(120_000);
  await registerFan(page, request);
  await page.goto('/fantasy');
  const football = page.locator('.fantasy-competition-card').filter({
    has: page.getByRole('heading', { name: 'Harbour Fantasy League' }),
  });
  await expect(football).toBeVisible();
  await football.getByRole('link', { name: 'Build squad' }).click();
  await expect(
    page.getByRole('heading', { name: 'Build your squad' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Gameweek 1/ })).toBeVisible();
  await page.getByRole('checkbox', { name: /Alex Brook/ }).check();
  await page.getByRole('checkbox', { name: /Sam Vale/ }).check();
  await page.getByRole('checkbox', { name: /Robin Brook/ }).check();
  await page.getByRole('checkbox', { name: /Casey Vale/ }).check();
  const pickedIds = await page
    .getByRole('checkbox', { checked: true })
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement).value),
    );
  await page.getByLabel('Captain (2× points)').selectOption(pickedIds[0]);
  await page
    .getByLabel('Vice-captain (1.5× points)')
    .selectOption(pickedIds[1]);
  await page.getByRole('button', { name: 'Save squad' }).click();
  await expect(page.getByRole('status')).toContainText('Your squad is saved');
  await page.reload();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(4);
  await expect(page.getByLabel('Captain (2× points)')).toHaveValue(
    pickedIds[0],
  );
  await expect(page.getByLabel('Vice-captain (1.5× points)')).toHaveValue(
    pickedIds[1],
  );
  expect(testInfo.project.name).toMatch(/auth-(desktop|mobile)/);
});
