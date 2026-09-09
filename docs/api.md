# API

GET /api/health returns 200 with {"status":"ok","application":"ArenaPulse"}, Cache-Control: no-store. This is liveness, not backend readiness.

Future API errors use {"error":{"code":"...","message":"..."}} with VALIDATION_ERROR 400, AUTHENTICATION_REQUIRED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, RATE_LIMITED 429, EXTERNAL_PROVIDER_ERROR 502, SERVICE_NOT_CONFIGURED 503 and INTERNAL_ERROR 500. Unknown errors never expose internal messages.

Auth/sports/social/fantasy/prediction routes are not implemented in Phase 0. Their contracts and authorization must be documented in the implementing milestone.
