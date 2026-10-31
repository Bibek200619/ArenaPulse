# Social foundation

Phase 5 provides public-profile discovery, user following, posts, threaded comments and one like per user/post. The responsive feed, profile and conversation screens use verified server actions backed by RLS.

## Visibility contract

- Public profile: authored activity can appear publicly, subject to parent-post visibility.
- Private profile: authored activity is visible only to its author. Changing privacy also hides previous activity.
- Following a person never grants access to private activity; private profiles cannot receive new follow relationships.
- Users can delete their own comments/reactions after a post becomes private. The private parent content stays hidden.
- Replies require a visible comment belonging to the same post. Deleting a comment cascades to its replies.
- Social counts reflect only activity visible to the reader. Sports follower totals are aggregate-only and available to authenticated users; private pick identities remain hidden.

## Database contract

Authenticated clients supply content and target IDs; the server must derive actor IDs from a verified user. Database RLS independently rejects forged actors. Bodies are bounded to 2,000 characters for posts and 1,000 for comments. Ownership, generated IDs and timestamps are immutable to clients. User follows reject self-following and duplicates. See database.md for write budgets and function grants.

The authenticated RPC `sports_follower_count(p_kind, p_id)` accepts team/player/competition and a UUID. It returns the real aggregate count, including zero for a missing target, and rejects anonymous callers or unknown kinds. The UI should first resolve its sports entity and display an unavailable state on RPC failure.

## Application routes

- `/feed`: latest visible activity or people you follow, with a post composer for completed profiles.
- `/people`: paginated public profiles and literal username-prefix search.
- `/users/{username}`: visible profile, follower/following counts, follow control and authored activity. Private or missing profiles have the same not-found UI for outsiders.
- `/posts/{id}`: post, visible likes/comments, replies and owner deletion. Private or missing posts have the same not-found UI for outsiders.

Pagination uses 20 displayed items plus one look-ahead row, stable timestamp/ID ordering and bounded page numbers. Following-feed filtering runs in the database through an inner relationship query; it never truncates a client-side list of followed IDs. Counts are explicitly labeled visible. Replies are stored as a tree but displayed chronologically, preserving parent IDs without revealing hidden parent content. Realtime is not enabled for the global feed.

Forms validate content/IDs/operations, derive actors from `getUser()`, and return safe errors. Drafts survive failed saves. Likes and follows are idempotent; deleting inaccessible content is not reported as success. Text renders through React escaping, never unsafe HTML. All social paths refresh sessions and send private/no-store cache headers. Unexpected action failures log a structured operation/event only, never raw exceptions, text or credentials.

Next.js may send a 200 loading shell for asynchronous not-found pages. Verification waits for the final not-found UI and noindex metadata and checks the complete response for private-text leakage, alongside actual database RLS tests.

## Notifications (Phase 10)

Successful comments, replies, likes and follows append a deduplicated outbox event in the source write transaction. Recipients and targets come from persisted rows. Opening `/notifications` processes the authenticated recipient queue after rechecking preferences, blocks and current post/community visibility; hidden or stale events are skipped. The inbox stores IDs and event types only, so queued text cannot expose deleted or newly private content. See [notifications.md](notifications.md) for event sources, timezone-aware reminders and the delivery boundary.
Community context/roles/moderation are Phase 6, match discussions/realtime Phase 7, and notification persistence/delivery Phase 10. Editing posts has database support but no editor UI in this initial social experience.
