# Communities

Phase 6 begins with the membership/permission boundary. The application screens, community-scoped content and content moderation remain in progress; this schema milestone does not expose community posts or claim those user journeys are complete.

## Access contract

Public community metadata is discoverable by everyone. Private communities are unlisted: only members can read their metadata. A shared UUID link allows a signed-in fan with a completed profile to request access without exposing the community's name, description or member list. Private requests grant no read access until staff approve them. Rejected requests can be submitted again; pending requests can be cancelled.

Member directories are visible to current members only. Users can read their own request/ban record; staff can read requests, bans and the audit trail. Private profile content remains protected by the existing profile policies. Community ownership is part of community metadata, independent of profile display visibility. Public content cannot be made secret through a ban: bans remove membership and prevent participation, but public metadata remains public.

## Permission matrix

| Action                        | Owner                      | Admin                     | Moderator               | Member / outsider     |
| ----------------------------- | -------------------------- | ------------------------- | ----------------------- | --------------------- |
| Create community              | Any completed profile      | Any completed profile     | Any completed profile   | Any completed profile |
| Join public / request private | Yes                        | Yes                       | Yes                     | Yes, unless banned    |
| Approve / reject requests     | Yes                        | Yes                       | Yes                     | No                    |
| Assign admin                  | Yes                        | No                        | No                      | No                    |
| Assign moderator / member     | Yes, except owner          | Lower-ranked targets only | No                      | No                    |
| Ban / remove ban              | Lower-ranked targets       | Lower-ranked targets      | Members/nonmembers only | No                    |
| Transfer ownership            | Yes, to an existing member | No                        | No                      | No                    |
| Leave                         | Transfer first             | Yes                       | Yes                     | Yes                   |
| Read audit trail              | Yes                        | Yes                       | Yes                     | No                    |

A ban records the issuing authority's rank. Lower-ranked staff cannot override it even if the original issuer later changes role. Unbanning never restores membership or an elevated role; a private community requires a fresh request. Role changes cannot target peers, promote oneself or assign owner. Ownership transfer atomically demotes the old owner to admin, promotes an existing member, updates owner_id and appends an audit record.

## Database interface

`create_community(p_name, p_slug, p_description, p_rules, p_visibility, p_sport_id, p_team_id, p_competition_id)` derives auth.uid() and creates the community, owner membership and audit record in one transaction. Slugs are unique lowercase hyphenated identifiers. Names/rules/descriptions and optional sport/team/competition relationships are constrained. Image/banner fields are reserved; no client upload or media URL write is enabled.

`community_transition(p_id, p_action, p_target, p_role, p_reason)` supports join, cancel-request, leave, approve, reject, role, ban, unban and transfer. Caller identity and role are always read from the database. Optional target/role values never confer authority. Transitions lock the community row before reading authoritative membership and ban state, serializing competing approvals, bans and transfers. Public wrappers are security invoker; privileged transition helpers are confined to the unexposed private schema with fixed empty search paths and explicit grants.

All five tables enable RLS and reject direct mutations by anon, authenticated and service_role. Trusted PostgreSQL migration/maintenance roles remain privileged. The regular service role has read access for trusted server maintenance but cannot bypass transition rules to write these tables. Staff cannot alter audit entries. Deleting an auth account cascades its profile; if it still owns a community, that community and its membership records are removed. Account-deletion UX must explain this and offer transfer before release.

Per-user database budgets allow three community creations and 30 transition calls per minute. Atomic private counters survive content deletion and serialize concurrent writes. Idempotent join/request operations avoid duplicate membership/audit records but still consume transition budget. Broader traffic throttling/account-abuse controls remain deployment work.

## Remaining Phase 6 work

Connect discovery, creation, join requests and member/staff controls to validated server actions. Add community-scoped posts with visibility enforced through every social read/write path; require membership and reject banned participants. Add pinning, reports, moderator removal, blocks architecture and audited content actions. Verify private-community leakage against direct APIs and existing feeds before exposing content. Match discussions/realtime remain Phase 7; notification delivery remains Phase 10.
