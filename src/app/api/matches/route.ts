import { sportsService } from '@/services/sports/service';
import { matchQuerySchema } from '@/features/sports/validation';
import { AppError, errorResponse } from '@/lib/errors';
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = matchQuerySchema.safeParse(params);
  if (!query.success)
    return errorResponse(
      new AppError('VALIDATION_ERROR', 'Invalid match filters or pagination.'),
    );
  try {
    return Response.json(await sportsService.getFixtures(query.data), {
      headers: { 'Cache-Control': 'public, max-age=15' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
