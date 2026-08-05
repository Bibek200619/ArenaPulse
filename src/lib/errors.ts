export const errorStatuses = {
  VALIDATION_ERROR: 400,
  AUTHENTICATION_REQUIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  EXTERNAL_PROVIDER_ERROR: 502,
  INTERNAL_ERROR: 500,
  SERVICE_NOT_CONFIGURED: 503,
} as const;
export type ErrorCode = keyof typeof errorStatuses;
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}
export function errorResponse(error: unknown) {
  const known = error instanceof AppError;
  const code = known ? error.code : 'INTERNAL_ERROR';
  return Response.json(
    {
      error: {
        code,
        message: known
          ? error.message
          : 'Something went wrong. Please try again.',
      },
    },
    { status: errorStatuses[code] },
  );
}
