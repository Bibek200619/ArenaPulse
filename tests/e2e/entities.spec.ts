import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('visitors explore teams, squads, players and competitions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/teams');
  await page.getByRole('link', { name: /Harbour Athletic/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Harbour Athletic',
  );
  await expect(
    page.getByRole('heading', { name: 'Available squad' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('link', { name: 'Sign in to follow' })
      .or(
        page.getByText(
          'Following is unavailable until accounts are configured.',
        ),
      ),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'Alex Vale Goalkeeper' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alex Vale');
  await expect(
    page.getByText(/Complete individual season statistics are not available/),
  ).toBeVisible();
  await page.goto('/competitions');
  await page.getByRole('link', { name: /Harbour Football League/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Harbour Football League',
  );
  await expect(page.getByRole('table')).toContainText('Harbour Athletic');
  expect(errors).toEqual([]);
});
