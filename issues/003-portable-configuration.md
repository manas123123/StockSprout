# Issue #003: Portable Configuration and Secret Hygiene

## Status

Completed on 2026-07-26 in commit `6357d37`.

## Summary

Allow the same backend and frontend code to run locally or on a hosting platform by supplying environment-specific values externally.

## Completed Work

- [x] Replace current database and JWT values with environment-variable placeholders.
- [x] Remove hardcoded market-data API keys from backend Java code.
- [x] Make the backend port, CORS origins, and JPA settings configurable.
- [x] Add ignored local configuration patterns and safe example files.
- [x] Centralize frontend API URL construction.
- [x] Make the Vite development proxy configurable with a port 8080 default.
- [x] Remove hardcoded backend origins from frontend application requests.
- [x] Add a test-only H2 database so backend tests do not require PostgreSQL credentials.
- [x] Update the README and JWT guide.

## Verification

- `mvn clean test`: 23 tests passing.
- `npm run build`: passing.
- New API and Vite configuration lint: passing.
- No development server or deployment was started.

## Remaining Notes

- Previously exposed credentials should be rotated before a real deployment.
- Full frontend lint cleanup is tracked in [issue #004](004-frontend-quality-baseline.md).
- Cross-site cookie behavior is intentionally deferred to [issue #005](005-production-authentication-hardening.md).

## Labels

configuration, security, deployment, completed

## Created

2026-07-26
