# Issue #005: Production Authentication Hardening

## Status

Completed on 2026-07-27.

## Summary

Make cookie-based JWT authentication safe and predictable for the chosen production frontend/backend topology.

## Scope

- [x] Use same-origin production routing while keeping the hosting provider selectable.
- [x] Make appropriate cookie security settings configurable by environment.
- [x] Make both JWT cookies HTTP-only.
- [x] Implement Spring Security's cookie-to-header CSRF strategy for the React application.
- [x] Review CORS, `SameSite`, `Secure`, host-only cookies, paths, and logout behavior together.
- [x] Add authentication integration tests for the selected behavior.

## Acceptance Criteria

- [x] Local HTTP development uses non-Secure cookies through the Vite same-origin proxy.
- [x] Production HTTPS enables Secure cookies with `AUTH_COOKIE_SECURE=true`.
- [x] Browser JavaScript cannot read either JWT.
- [x] State-changing requests require the CSRF cookie and matching request header.
- [x] Login, refresh, logout, and current-user tests cover cookie behavior.

## Implementation Notes

- The supported browser topology serves the frontend and `/api` from one public origin. This can be implemented by any selected hosting provider or reverse proxy.
- Access tokens are host-only, HTTP-only, `SameSite=Lax`, and limited to `/api`.
- Refresh tokens are host-only, HTTP-only, `SameSite=Lax`, and limited to `/api/auth`.
- `AUTH_COOKIE_SECURE` defaults to `false` for local HTTP and must be `true` for hosted HTTPS.
- `AUTH_COOKIE_SAME_SITE` defaults to `Lax`. `None` is rejected unless Secure cookies are enabled.
- The separate `XSRF-TOKEN` cookie is readable because it is not an authentication credential. The frontend mirrors it into `X-XSRF-TOKEN` for unsafe methods.
- Login, refresh, and logout clear the current CSRF token so the next unsafe request obtains a new one.
- `/api/auth/me` now returns `401 Unauthorized` when the access cookie is missing or invalid.

## Verification

- `mvn clean test`: 32 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed with the existing non-failing asset-resolution and chunk-size warnings.

## Priority

High - required before public deployment.

## Labels

authentication, security, cookies, csrf, production

## Created

2026-07-26
