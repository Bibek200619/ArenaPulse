# Teams, players, competitions and favorites

`/teams`, `/players` and `/competitions` show the bounded demo catalog through SportsService, with source labels and links to UUID detail routes. Team pages show available fixtures/results, sample squad and standings. Player pages show identity, nationality, position, team/individual status and recorded match appearances. Competition pages show season, fixtures/results, standings and participating teams. Missing individual season statistics remain explicitly unavailable.

Following is a server action: validate kind/UUID/operation, verify the current Supabase user, then use their cookie-scoped database client. Ownership never comes from hidden form input. Database grants/RLS independently enforce ownership, uniqueness, referenced entity validity and timestamp protection. Follow is idempotent; unfollow deletes only the verified user's matching row. Read failures never masquerade as a successful follow.

Entity pages containing account-specific follow state are dynamic; proxy refreshes cookies and applies private/no-store. The public provider cache contains sports data only. Anonymous visitors get a sign-in link; unconfigured auth is honestly unavailable. Individual follow checks query the exact entity, independent of list pagination.

Initial profile save continues to `/onboarding/sports`, an optional team/competition/player selection screen. Each choice saves immediately; Continue skips any further picks. `/settings/sports` edits these choices later. Profile edits return to profile. The final browser journey verifies team/competition selection, reload persistence, team→player navigation, player follow/unfollow, editing, logout/login and recovery.

The current catalog is deliberately small (6 teams, 26 players, 4 competitions). Preferences query up to 100 follows per kind; a licensed provider rollout must add catalog/preference pagination before exceeding that bound. No external provider is enabled. Public follower totals and related communities are deferred to the social/community layer, preserving private follow lists. No fantasy associations or invented performance statistics are shown.
