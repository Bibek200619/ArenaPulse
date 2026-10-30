# Fantasy competitions

Phase 8 provides published, sport-aware fantasy competitions, versioned roster rules, scheduled gameweeks and a private squad builder. The current demo seed contains football, cricket and basketball competitions. The tennis demo catalog has only two players and is not large enough for a squad. All seeded names, player prices and dates are examples, not live sports data.

## Competition configuration

Create a `fantasy_competitions` row for a source sports competition and its sport. Add a `fantasy_rules` version with the squad size, budget, JSON position minimum/maximums, per-team cap, captain multipliers and transfers per gameweek. Add one `fantasy_player_prices` row for each eligible player and rule version, then schedule `fantasy_gameweeks` with the rule version, deadline, start/end and status. Price pools must reference catalog players from the same sport as the fantasy competition. Publish by setting the competition status to `open` and setting each schedulable gameweek to `open`. Add a new rules version and price pool for changes; published gameweeks and their associated rules/prices are immutable. Do not edit an existing version after publishing it.

The current demo seed gives each supported sport a four-player squad with sport-specific positions, two-player club caps and sample credits. Multiple gameweeks are seeded as open. The builder chooses the earliest open gameweek whose deadline is still in the future, so it advances to the next scheduled week after a deadline passes. Trusted database maintenance is responsible for adding future weeks and setting each to open.

## Squad integrity

Authenticated users save one private squad per fantasy competition. The `save_fantasy_squad` security-definer RPC derives ownership from `auth.uid()`, locks the competition to serialize writes, checks the gameweek deadline and rule version, and validates roster size, duplicate IDs, eligible player prices, total budget, position limits, club caps, captain/vice-captain selection and transfer allowance. Squad and gameweek selections are written in one transaction. A later gameweek compares its roster to the most recently submitted earlier gameweek; newly selected players count against that week's transfer allowance. First-time squad creation is treated as the initial roster.

Competition rules, player pools, and gameweeks are readable to visitors. Squad, gameweek entry and selected players are readable only to their owner. Direct client writes are revoked; changes must use the validated RPC. Captains and vice-captains are stored with each gameweek entry. Scores, private leagues and leaderboards belong to Phase 9.
