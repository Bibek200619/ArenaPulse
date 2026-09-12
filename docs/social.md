# Social foundation

The Phase 5 schema supports public-profile discovery, user following, posts, threaded comments and one like per user/post. The feed and interaction screens are the next milestone; schema availability alone does not mean those user journeys are complete.

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

## Next application milestone

Implement paginated feeds and public user pages, verified server actions, input schemas, safe rate-limit responses and accessible posting/comment/reaction/follow controls. Verify two-user browser journeys and privacy changes. Keep community-scoped posts/roles for Phase 6 and match discussions/realtime for Phase 7. Notification event production and delivery belong to Phase 10; this schema does not claim to send notifications.
