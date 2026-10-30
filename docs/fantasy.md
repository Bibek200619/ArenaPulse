# Fantasy competitions

ArenaPulse fantasy supports published sport-aware competitions, versioned roster rules, scheduled gameweeks, a squad builder, scoreboards and private leagues. The current demo seed contains football, cricket and basketball competitions. The tennis demo catalog has only two players and is not large enough for a squad. All seeded names, player prices, scoring weights and dates are examples, not live sports data.

## Competition configuration

Create a `fantasy_competitions` row for a source sports competition and its sport. Add a `fantasy_rules` version with the squad size, budget, JSON position minimum/maximums, per-team cap, captain multipliers and transfers per gameweek. Add one `fantasy_player_prices` row for each eligible player and rule version, then schedule `fantasy_gameweeks` with the rule version, deadline, start/end and status. Price pools must reference catalog players from the same sport as the fantasy competition. Publish by setting the competition status to `open` and setting each schedulable gameweek to `open`. Add a new rules version and price pool for changes; published gameweeks and their associated rules/prices are immutable. Do not edit an existing version after publishing it.

The current demo seed gives each supported sport a four-player squad with sport-specific positions, two-player club caps and sample credits. Multiple gameweeks are seeded as open. The builder chooses the earliest open gameweek whose deadline is still in the future, so it advances to the next scheduled week after a deadline passes. Trusted database maintenance is responsible for adding future weeks and setting each to open.

## Squad integrity

Authenticated users save one private squad per fantasy competition. The `save_fantasy_squad` security-definer RPC derives ownership from `auth.uid()`, locks the competition to serialize writes, checks the gameweek deadline and rule version, and validates roster size, duplicate IDs, eligible player prices, total budget, position limits, club caps, captain/vice-captain selection and transfer allowance. Squad and gameweek selections are written in one transaction. A later gameweek compares its roster to the most recently submitted earlier gameweek; newly selected players count against that week's transfer allowance. First-time squad creation is treated as the initial roster.

Competition rules, player pools, and gameweeks are readable to visitors. Squad, gameweek entry and selected players are readable only to their owner. Direct client writes are revoked; changes must use the validated RPC. Captains and vice-captains are stored with each gameweek entry.

## Scoring and corrections

Each immutable fantasy rule version contains a `scoring_rules` object whose normalized event type keys map to point values. The score worker calls `recalculate_fantasy_gameweek_scores` with a gameweek ID using the service role after the week is locked or complete. It reads only finished matches from the source competition whose start time falls inside that gameweek. Events without a player and event types absent from the scoring map contribute zero. Player base points are multiplied for the saved captain and vice-captain; totals retain separate base, captain-bonus and vice-captain-bonus values.

The scoring procedure locks the gameweek and replaces the entire score snapshot in one transaction, incrementing its revision. Replaying the same event set yields the same totals. When a source event is corrected, rerun the procedure; the updated leaderboard reads the latest score revision. Demo weights are deliberately illustrative and must be configured and verified for a real sports data provider before use.

## Private leagues and leaderboards

Create and join leagues through the authenticated actions. Both require a saved squad for the selected fantasy competition. A 192-bit invitation code is generated server-side and shown only after league creation. The database stores its SHA-256 hash, never the code. Joining accepts the code through a narrow RPC and returns the league only after membership is created. Incorrect codes and missing squads share the same error response. League rows, membership and scoreboards are limited to members by RLS and database authorization; invitation hashes are not selectable by clients.

The leaderboard uses the latest calculated gameweek and assigns equal ranks to equal point totals. Rows with tied points have a stable display order by join time and user ID. It is computed from the latest score snapshot, so score corrections update ranks without storing stale positions. No prizes, betting or real-money features are included.
