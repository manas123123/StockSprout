# Issue #005: Production Authentication Hardening

## Status

Open.

## Summary

Make cookie-based JWT authentication safe and predictable for the chosen production frontend/backend topology.

## Scope

- Decide whether production uses same-origin routing or cross-origin requests.
- Make appropriate cookie security settings configurable by environment.
- Make the access-token cookie HTTP-only if the browser code does not need direct access.
- Define and implement a CSRF protection strategy for cookie-authenticated requests.
- Review CORS, `SameSite`, `Secure`, cookie paths, and logout behavior together.
- Add authentication integration tests for the selected behavior.

## Acceptance Criteria

- [ ] Local HTTP development authentication works.
- [ ] Production HTTPS authentication works with the selected topology.
- [ ] Browser JavaScript cannot read tokens unless explicitly required and justified.
- [ ] State-changing requests have appropriate CSRF protection.
- [ ] Login, refresh, logout, and current-user tests cover cookie behavior.

## Priority

High - required before public deployment.

## Labels

authentication, security, cookies, csrf, production

## Created

2026-07-26
