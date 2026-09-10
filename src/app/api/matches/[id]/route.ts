import { sportsService } from '@/services/sports/service';
import { errorResponse } from '@/lib/errors';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return Response.json(await sportsService.getMatch((await params).id), {
      headers: { 'Cache-Control': 'public, max-age=15' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
