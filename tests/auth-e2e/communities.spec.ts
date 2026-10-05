import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { registerFan } from './helpers';
import { expectNoIndex } from '../helpers/browser';
test('two fans create, request, approve, manage roles, ban and transfer a private community', async ({
  page,
  browser,
  request,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const alice = await registerFan(page, request);
  const name = `Matchday ${randomUUID().slice(0, 8)}`;
  await page.goto('/communities/new');
  await page.getByLabel('Community name', { exact: true }).fill(name);
  await page
    .getByLabel('Unique slug')
    .fill(name.toLowerCase().replace(' ', '-'));
  await page
    .getByLabel('Description', { exact: true })
    .fill('Private tactics and matchday conversation.');
  await page
    .getByLabel('Community rules', { exact: true })
    .fill('Respect every fan.');
  await page.getByLabel('Visibility').selectOption('private');
  await page
    .getByRole('button', { name: 'Create community', exact: true })
    .click();
  await expect(page).toHaveURL(/\/communities\/[0-9a-f-]+$/);
  const url = page.url();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  await expect(
    page.getByText('Your role: owner', { exact: true }),
  ).toBeVisible();
  const other = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100',
    viewport: page.viewportSize(),
    isMobile: testInfo.project.name.includes('mobile'),
  });
  const bobPage = await other.newPage();
  bobPage.on('pageerror', (error) => errors.push(error.message));
  try {
    const bob = await registerFan(bobPage, request);
    await bobPage.goto(`/communities?q=${encodeURIComponent(name)}`);
    await expect(
      bobPage.getByText('No communities found.', { exact: false }),
    ).toBeVisible();
    const response = await bobPage.goto(url);
    await expect(bobPage.getByRole('heading', { level: 1 })).toHaveText(
      'Community access',
    );
    expect(await response!.text()).not.toContain(name);
    expect(response!.headers()['cache-control']).toContain('no-store');
    await expectNoIndex(bobPage);
    await bobPage
      .getByRole('button', { name: 'Join or request access' })
      .click();
    await expect(
      bobPage.getByText('Your access request is pending.'),
    ).toBeVisible();
    await page.goto(`${url}/members?tab=requests`);
    await expect(
      page.getByRole('heading', { name: new RegExp(bob) }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Approve request', exact: true })
      .click();
    await expect(page.getByText('Nothing to show in this view.')).toBeVisible();
    await bobPage.goto(url);
    await expect(bobPage.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(
      bobPage.getByText('Your role: member', { exact: true }),
    ).toBeVisible();
    await bobPage.goto(`${url}/members?tab=audit`);
    await expect(bobPage.getByRole('heading', { level: 1 })).toHaveText(
      'This one is out of play.',
    );
    await page.goto(`${url}/members`);
    const member = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: new RegExp(bob) }) });
    await member.getByLabel('Member role').selectOption('moderator');
    await member.getByRole('button', { name: 'Save role' }).click();
    await expect(
      member.getByText('Role: moderator', { exact: true }),
    ).toBeVisible();
    await member.locator('summary').click();
    await member.getByLabel('Ban reason').fill('Repeated rule violations');
    page.once('dialog', (dialog) => dialog.accept());
    await member.getByRole('button', { name: 'Confirm ban' }).click();
    await expect(
      page.getByRole('heading', { name: new RegExp(bob) }),
    ).toHaveCount(0);
    await bobPage.goto(url);
    await expect(bobPage.getByRole('heading', { level: 1 })).toHaveText(
      'Community access',
    );
    await expect(
      bobPage.getByText('Participation is unavailable.', { exact: false }),
    ).toBeVisible();
    await expect(
      bobPage.getByRole('button', { name: 'Join or request access' }),
    ).toHaveCount(0);
    await page.goto(`${url}/members?tab=bans`);
    await page.getByRole('button', { name: 'Remove ban' }).click();
    await expect(page.getByText('Nothing to show in this view.')).toBeVisible();
    await bobPage.goto(url);
    await bobPage
      .getByRole('button', { name: 'Join or request access' })
      .click();
    await expect(
      bobPage.getByText('Your access request is pending.'),
    ).toBeVisible();
    await page.goto(`${url}/members?tab=requests`);
    await page.getByRole('button', { name: 'Approve request' }).click();
    await expect(page.getByText('Nothing to show in this view.')).toBeVisible();
    await page.goto(`${url}/members`);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Transfer ownership' }).click();
    await expect(
      member.getByText('Role: owner', { exact: true }),
    ).toBeVisible();
    await bobPage.goto(url);
    await expect(
      bobPage.getByText('Your role: owner', { exact: true }),
    ).toBeVisible();
    await page.goto(url);
    await expect(
      page.getByText('Your role: admin', { exact: true }),
    ).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Leave community' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Community access',
    );
    await bobPage.goto('/communities?view=mine');
    await expect(
      bobPage.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
    await expect(bobPage).toHaveTitle('Communities | ArenaPulse');
    expect(
      (
        await new AxeBuilder({ page: bobPage })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await bobPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await bobPage.screenshot({
      path: `docs/screenshots/communities-${testInfo.project.name}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    expect(alice).not.toBe(bob);
    await page.goto('/communities/new');
    const publicName = `Public ${randomUUID().slice(0, 8)}`;
    await page.getByLabel('Community name', { exact: true }).fill(publicName);
    await page
      .getByLabel('Unique slug')
      .fill(publicName.toLowerCase().replace(' ', '-'));
    await page
      .getByRole('button', { name: 'Create community', exact: true })
      .click();
    await expect(page).toHaveURL(/\/communities\/[0-9a-f-]+$/);
    await bobPage.goto(`/communities?q=${encodeURIComponent(publicName)}`);
    await bobPage.getByRole('link', { name: new RegExp(publicName) }).click();
    await bobPage
      .getByRole('button', { name: 'Join or request access' })
      .click();
    await expect(
      bobPage.getByText('Your role: member', { exact: true }),
    ).toBeVisible();
    await bobPage.reload();
    await expect(
      bobPage.getByText('Your role: member', { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await other.close();
  }
});
