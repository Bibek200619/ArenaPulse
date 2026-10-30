import { expect, test } from '@playwright/test';
import { registerFan } from './helpers';

async function saveFootballSquad(page: import('@playwright/test').Page) {
  await page.goto('/fantasy');
  const football = page.locator('.fantasy-competition-card').filter({
    has: page.getByRole('heading', { name: 'Harbour Fantasy League' }),
  });
  await football.getByRole('link', { name: 'Build squad' }).click();
  await page.getByRole('checkbox', { name: /Alex Brook/ }).check();
  await page.getByRole('checkbox', { name: /Sam Vale/ }).check();
  await page.getByRole('checkbox', { name: /Robin Brook/ }).check();
  await page.getByRole('checkbox', { name: /Casey Vale/ }).check();
  const playerIds = await page
    .getByRole('checkbox', { checked: true })
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement).value),
    );
  await page.getByLabel('Captain (2× points)').selectOption(playerIds[0]);
  await page
    .getByLabel('Vice-captain (1.5× points)')
    .selectOption(playerIds[1]);
  await page.getByRole('button', { name: 'Save squad' }).click();
  await expect(page.getByRole('status')).toContainText('Your squad is saved');
}

test('a fan builds, saves and reloads a rules-checked fantasy squad', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await registerFan(page);
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

test('two fans create and join a private fantasy league without exposing it to outsiders', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(120_000);
  await registerFan(page);
  await saveFootballSquad(page);
  await page.goto('/fantasy');
  await page
    .getByLabel('Competition')
    .selectOption('f0000000-0000-4000-8000-000000000001');
  await page.getByLabel('League name').fill('Harbour private group');
  await page.getByRole('button', { name: 'Create private league' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Private league created',
  );
  const inviteCode = (await page
    .locator('.fantasy-invite-code')
    .textContent())!;
  expect(inviteCode).toMatch(/^[A-Za-z0-9_-]{32}$/);
  const leagueUrl = await page
    .getByRole('link', { name: 'Open leaderboard' })
    .getAttribute('href');
  expect(leagueUrl).toMatch(/^\/fantasy\/leagues\/[0-9a-f-]+$/);

  const other = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100',
    viewport: page.viewportSize(),
    isMobile: testInfo.project.name.includes('mobile'),
  });
  const bobPage = await other.newPage();
  try {
    await registerFan(bobPage);
    await bobPage.goto(leagueUrl!);
    await expect(
      bobPage.getByRole('heading', { name: 'Harbour private group' }),
    ).toHaveCount(0);
    await expect(
      bobPage.getByText('The leaderboard will appear', { exact: false }),
    ).toHaveCount(0);

    await saveFootballSquad(bobPage);
    await bobPage.goto('/fantasy');
    await expect(bobPage.getByText(inviteCode, { exact: true })).toHaveCount(0);
    await bobPage.getByLabel('Invitation code').fill(inviteCode);
    await bobPage.getByRole('button', { name: 'Join league' }).click();
    await expect(bobPage).toHaveURL(/\/fantasy\/leagues\/[0-9a-f-]+$/);
    await expect(
      bobPage.getByRole('heading', { name: 'Harbour private group' }),
    ).toBeVisible();
    await expect(
      bobPage.getByText('The leaderboard will appear', { exact: false }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('link', { name: /Harbour private group/ }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});
