export function GET() {
  return Response.json(
    { status: 'ok', application: 'ArenaPulse' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
