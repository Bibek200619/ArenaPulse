# Notifications and reminders

Phase 10 adds an owner-only in-app inbox, per-category preferences, a transactional outbox, and a private dashboard. Successful social comments/replies/likes/follows, community requests/membership changes, match-discussion replies/reactions, and fantasy-league joins append a deduplicated outbox row in the same database transaction as the domain write. Failed writes and duplicate relationships do not enqueue events.

Inbox processing happens when the authenticated user opens `/notifications`. The processor rechecks current preferences, blocks, membership, profile visibility, content state, and target ownership before creating an inbox row. Disallowed events are marked `skipped`; events waiting to be processed remain `queued` and are never presented as delivered. Email and push are disabled until a provider is configured. The private dashboard at `/dashboard` uses the existing RLS-protected follow feed, current community memberships, fantasy league memberships, and saved sports preferences.

Users can schedule a match or fantasy-gameweek reminder using a local wall time plus an explicit IANA time zone. The database validates the zone and round-trips the wall time before storing its UTC instant. A due reminder is queued and materialized as an in-app notification the next time its owner processes the inbox. This version does not promise background or email/push delivery while the owner is away; an authenticated worker/cron provider must be configured for that behavior.

Notification preferences, reminders, inbox rows, and queued events are scoped to their owner by RLS. Outbox events contain IDs and event types only, not message bodies, private profile details, invitation codes, or report content.
