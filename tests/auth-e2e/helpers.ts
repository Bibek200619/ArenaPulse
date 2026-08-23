import { expect, type APIRequestContext } from '@playwright/test';
export async function emailLink(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const result = await request.get(
          `http://127.0.0.1:55434/api/v1/search?query=${encodeURIComponent(`to:${email} subject:${subject}`)}`,
        );
        if (!result.ok()) return false;
        const body = await result.json();
        const message = body.messages?.[0];
        if (!message) return false;
        const response = await request.get(
          `http://127.0.0.1:55434/api/v1/message/${message.ID}`,
        );
        const detail = await response.json();
        link = detail.HTML?.match(/href="([^"]+)"/)?.[1]?.replaceAll(
          '&amp;',
          '&',
        );
        return Boolean(link);
      },
      { timeout: 25_000, message: 'Local confirmation/recovery email arrives' },
    )
    .toBe(true);
  return link!;
}
