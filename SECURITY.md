# Security

Report vulnerabilities privately through GitHub private vulnerability reporting if enabled, or directly to the repository owner. Do not publish credentials or exploit details in public issues. Rotate any accidentally exposed credential immediately.

The identity milestone adds real Supabase sessions, profile writes and private preferences, with default-deny RLS and column-restricted writes. Configuration rejects secret keys in the public Supabase key slot; runtime errors return safe messages. Secret patterns and environment files are ignored. HTTP headers deny framing and content sniffing and restrict device permissions.

Before authentication release: verified SSR identity, callback allowlist, secure session handling, server validation and rate limits. Before database release: explicit grants, default-deny RLS, ownership and private-content policies, two-user/outsider tests. Before media release: restricted buckets, content types, size and ownership paths. Never authorize from browser roles or user_metadata, expose service-role keys, or render untrusted HTML.

Dependency audit and full security review are release gates. Foundation protections alone do not establish production readiness.

Identity verification includes clean migration replay, two-user/anonymous permission tests and email confirmation/recovery browser journeys. Provider-native auth limits are enabled; production SMTP, OAuth credentials, CAPTCHA and deployment-specific abuse controls require hosted configuration. The local CLI start wrapper withholds output because Supabase prints generated credentials.

Social persistence enforces author identity, visibility and ownership in PostgreSQL. Trigger helpers are not directly callable, internal counters are inaccessible, and a private aggregate helper exposes only authenticated sports follow totals. Rate budgets serialize concurrent writes and survive content deletion. Direct PostgREST adversarial tests cover these boundaries; UI and server validation are implemented; two-user browser tests also verify private text is absent from rendered and complete streamed responses. Public interaction counts are visibility-filtered, not an unrestricted total.
