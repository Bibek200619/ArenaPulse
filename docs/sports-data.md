# Sports data

The server-facing `SportsDataProvider` contract isolates domain entities from transport and vendor naming. `DemoSportsProvider` currently supplies football, cricket, basketball and individual tennis fixtures. UI and route handlers use `SportsService`; they never call an external sports API.

## Demo provenance

`src/features/sports/demo-catalog.ts` is a typed, deterministic fictional catalog with stable UUIDs, competition/season/venue relationships, six teams, 26 players and twelve fixtures. Tennis participants reference players directly. Composite cricket scores and tennis set scores remain strings; unavailable scores are null and unavailable events/statistics/lineups are empty arrays. Sample football events and lineups are illustrative subsets, not a complete match record.

Every response includes source, isDemo, observedAt, fetchedAt and a visible label. The snapshot is fixed at 9 September 2026; fetchedAt means adapter retrieval, never live observation. The UI says “In progress · Demo”. No licensed/live provider is configured. No network request is needed, so an external API outage cannot prevent demo browsing.

## Cache and failures

Public data only: a per-process cache bounds stored entries and tracked in-flight promises to 100 each, deduplicates simultaneous requests, copies data to prevent mutation, and retries after errors. Catalog TTL is five minutes, fixture TTL sixty seconds (thirty for a live filter), match TTL thirty seconds. API HTTP caches add at most sixty seconds for catalog and fifteen for fixtures. This cache is neither shared across deployments nor a distributed rate limiter. Private/personalized data must never enter it.

Unknown provider failures become safe EXTERNAL_PROVIDER_ERROR responses. Missing entities remain NOT_FOUND. A future remote adapter must add request cancellation/timeouts, response-schema validation, quota budgets, retry/backoff and explicitly labeled stale/demo fallback before activation. No unimplemented external adapter or live connection is advertised.

## Persistence boundary

The catalog is read-only source data at this milestone. Normalized import tables, provider ID mappings and foreign-key-backed team/player/competition preferences are part of Phase 4, together with secure follows. This avoids introducing writes to a second, unused catalog before ingestion exists. Stable UUIDs are available for that import. Fantasy prices belong to fantasy competition rules/pricing, not player identities.

## Verification

Provider tests cover relationships, individual participants, composite scores, nulls, filters, stable pagination, isolation and not-found handling. Cache tests cover TTL, bounded eviction, concurrent deduplication and failure recovery. Route integration tests execute the real service. Desktop/mobile browser tests check source labeling, navigation, overflow, runtime errors and axe accessibility.
