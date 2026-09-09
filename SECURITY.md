# Security

Report vulnerabilities privately through GitHub private vulnerability reporting if enabled, or directly to the repository owner. Do not publish credentials or exploit details in public issues. Rotate any accidentally exposed credential immediately.

Phase 0 is a public preview with no account writes or database connection. Configuration rejects secret keys in the public Supabase key slot; runtime errors return safe messages. Secret patterns and environment files are ignored. HTTP headers deny framing and content sniffing and restrict device permissions.

Before authentication release: verified SSR identity, callback allowlist, secure session handling, server validation and rate limits. Before database release: explicit grants, default-deny RLS, ownership and private-content policies, two-user/outsider tests. Before media release: restricted buckets, content types, size and ownership paths. Never authorize from browser roles or user_metadata, expose service-role keys, or render untrusted HTML.

Dependency audit and full security review are release gates. Foundation protections alone do not establish production readiness.
