import { expect, type Page } from '@playwright/test';
export async function expectNoIndex(page: Page) {
  await expect
    .poll(async () =>
      page
        .locator('head meta[name="robots"]')
        .evaluateAll(
          (nodes) =>
            nodes.length > 0 &&
            nodes.every((node) => node.getAttribute('content') === 'noindex'),
        ),
    )
    .toBe(true);
}
