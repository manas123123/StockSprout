# Issue #001: Migrate Authentication to JWT

## Status

Completed on 2026-07-26.

## Summary

Replace the previous authentication flow with stateless JWT access tokens and database-backed refresh tokens.

## Completed Work

- [x] Generate signed JWT access tokens containing the user ID and role.
- [x] Validate access tokens on protected API requests.
- [x] Store refresh-token hashes and expiration data in PostgreSQL.
- [x] Add login, refresh, logout, and current-user endpoints.
- [x] Configure Spring Security for stateless authentication.
- [x] Add scheduled cleanup for expired and revoked refresh tokens.
- [x] Integrate authentication state into the React frontend.
- [x] Add JWT and refresh-token unit tests.
- [x] Document local JWT configuration.

## Verification

- `JwtServiceTest`: 12 tests passing.
- `RefreshTokenServiceTest`: 10 tests passing.
- The complete backend suite passes as part of issue #003.

## Follow-up

Production cookie and CSRF hardening is tracked separately in [issue #005](005-production-authentication-hardening.md).

## Labels

authentication, security, jwt, completed

## Created

2026-07-01
