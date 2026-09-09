import { expect, it } from 'vitest';
import { GET as getCatalog } from '@/app/api/sports/route';
import { GET as getMatches } from '@/app/api/matches/route';
it('serves catalog and filtered fixtures through the actual provider service', async () => {
  const response = await getCatalog();
  expect(response.status).toBe(200);
  const catalog = await response.json();
  expect(catalog.provenance.isDemo).toBe(true);
  const sportId = catalog.data.sports[1].id;
  const fixtures = await getMatches(
    new Request(
      `http://localhost/api/matches?sportId=${sportId}&state=live&limit=1`,
    ),
  );
  expect(fixtures.status).toBe(200);
  expect(fixtures.headers.get('Cache-Control')).toBe('public, max-age=15');
  expect(await fixtures.json()).toMatchObject({
    data: { total: 1, items: [{ sportId, state: 'live' }] },
    provenance: { isDemo: true },
  });
});
it.each([
  'limit=50000',
  'offset=-1',
  'date=today',
  'sportId=bad',
  'state=unknown',
  'secret=value',
])('rejects invalid API query %s', async (query) => {
  const response = await getMatches(
    new Request(`http://localhost/api/matches?${query}`),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: { code: 'VALIDATION_ERROR' },
  });
});

it('returns match details and standardized invalid/missing errors', async () => {
  const { GET } = await import('@/app/api/matches/[id]/route');
  const fixtures = await (
    await getMatches(new Request('http://localhost/api/matches?limit=1'))
  ).json();
  const id = fixtures.data.items[0].id;
  const response = await GET(
    new Request(`http://localhost/api/matches/${id}`),
    { params: Promise.resolve({ id }) },
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    data: { id, participants: expect.any(Array) },
    provenance: { isDemo: true },
  });
  for (const [value, status] of [
    ['invalid', 400],
    ['00000000-0000-4000-8000-000000000000', 404],
  ] as const) {
    expect(
      (
        await GET(new Request('http://localhost'), {
          params: Promise.resolve({ id: value }),
        })
      ).status,
    ).toBe(status);
  }
});
