import { sportsService } from '@/services/sports/service';
import { errorResponse } from '@/lib/errors';
export async function GET() {
  try {
    return Response.json(await sportsService.getCatalog(), {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
