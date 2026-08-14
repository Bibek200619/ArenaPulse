# Match experience

`/matches` provides server-rendered, shareable GET filters: Show (all/live/today/upcoming/finished), sport, competition and UTC date. Eight results per page; pagination preserves filters. Invalid values and repeated scalar parameters render an explicit invalid-filter state. Empty fields normalize to absent filters. Today uses actual current UTC and overrides Date; Upcoming requires scheduled state and a start at or after request time. A fixed fictional snapshot may have no Today results.

Rows link to `/matches/{uuid}`. Detail pages include participant scores/state, time, venue, season, available event timeline, participant statistics, available lineups and competition standings. Individual participants and composite scores remain supported. Missing data is stated as unavailable; sample events and rosters are explicitly partial. Fan discussions and fantasy associations are deferred to their respective milestones.

The source label stays visible on list and detail. Demo in-progress matches never poll: their snapshot cannot change. A future non-demo live result enables a thirty-second refresh interval only while the browser tab is visible; timers are removed when the component unmounts. Manual refresh is always available. Server provider caching still applies. Quota enforcement and network timeouts remain prerequisites for configuring an external adapter.

Loading and retry boundaries cover the match route subtree. Unknown/malformed detail IDs render not-found UI. The JSON endpoint separately guarantees 400 for malformed IDs and 404 for valid absent UUIDs; streaming HTML may have already sent response headers when a nested not-found is discovered.

Tests cover UTC cutoffs, filter validation, pagination URLs, future scheduled filtering, actual detail API responses and errors, visible-tab polling with cleanup, and desktop/mobile filter → detail → return journeys with accessibility and overflow checks.
