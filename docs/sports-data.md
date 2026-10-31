# Sports data

The server-facing `SportsDataProvider` contract isolates domain entities from transport and vendor naming. `DemoSportsProvider` supplies the fictional catalog and cricket, basketball and tennis fixtures. `SportScoreProvider` supplies football scores and recent fixtures from SportScore when `SPORTS_DATA_PROVIDER=sportscore`. The preferred football league filters always appear for UEFA Champions League, English Premier League, Spanish La Liga, Italian Serie A, Bundesliga, French Ligue 1, Netherlands Eredivisie, Brazilian Serie A, English Football League Championship, and Austrian Bundesliga. Selecting a league requests that date's real SportScore fixtures even when the site's all-sports default remains the demo provider. UI and route handlers use `SportsService`; the vendor API key is read only by the server adapter.

## Demo provenance

`src/features/sports/demo-catalog.ts` is a typed, deterministic fictional catalog with stable UUIDs, competition/season/venue relationships, six teams, 26 players and twelve fixtures. Tennis participants reference players directly. Composite cricket scores and tennis set scores remain strings; unavailable scores are null and unavailable events/statistics/lineups are empty arrays. Sample football events and lineups are illustrative subsets, not a complete match record.

Every response includes source, isDemo, observedAt, fetchedAt and a visible label. Demo snapshot dates are fictional and never indicate live observation. The SportScore adapter requests football matches over HTTPS, validates the response, enforces an eight-second timeout and labels its provider update time. It maps only fields available from the match-list endpoint; event timelines, lineups, statistics, venue and standings remain unavailable for those records. Match lists refresh through the app at most every 30 seconds (SportScore edge responses may be cached for 60 seconds).

SportScore's [developer documentation](https://sportscore.com/developers/) describes `/api/widget/matches/` as a keyless endpoint with a free usage tier and asks consumers to show a visible dofollow “Powered by SportScore” link. The adapter also sends `SPORTSCORE_API_KEY` as the `X-API-Key` header when configured. Do not add the key to a `NEXT_PUBLIC_` variable or commit it. Keep the demo provider selected by default; opt into the live provider with `SPORTS_DATA_PROVIDER=sportscore` and set the optional key in the server environment. If the provider is unavailable, the UI reports a safe provider error instead of silently presenting demo matches as live.

## Cache and failures

Public data only: a per-process cache bounds stored entries and tracked in-flight promises to 100 each, deduplicates simultaneous requests, copies data to prevent mutation, and retries after errors. Catalog TTL is five minutes, fixture TTL sixty seconds (thirty for a live filter), match TTL thirty seconds. API HTTP caches add at most sixty seconds for catalog and fifteen for fixtures. This cache is neither shared across deployments nor a distributed rate limiter. Private/personalized data must never enter it.

Unknown provider failures become safe EXTERNAL_PROVIDER_ERROR responses. Missing entities remain NOT_FOUND. The SportScore adapter uses cancellation/timeouts and response-schema validation; retries/backoff and distributed quota controls are not implemented. Its listed free tier is approximately 10,000 requests per day per IP, and the vendor edge cache is 60 seconds; production traffic should be measured before increasing request volume.

## Persistence boundary

The catalog is read-only source data at this milestone. Normalized import tables, provider ID mappings and foreign-key-backed team/player/competition preferences are part of Phase 4, together with secure follows. This avoids introducing writes to a second, unused catalog before ingestion exists. Stable UUIDs are available for that import. Fantasy prices belong to fantasy competition rules/pricing, not player identities.

## Verification

Provider tests cover relationships, individual participants, composite scores, nulls, filters, stable pagination, isolation and not-found handling. Cache tests cover TTL, bounded eviction, concurrent deduplication and failure recovery. Route integration tests execute the real service. Desktop/mobile browser tests check source labeling, navigation, overflow, runtime errors and axe accessibility.
