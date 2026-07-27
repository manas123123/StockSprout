# Issue #006: Health Checks and Basic Observability

## Status

Open.

## Summary

Give a hosting platform a safe way to determine whether StockSprout is running and ready to serve requests.

## Scope

- Add a minimal Spring Boot health endpoint.
- Expose only production-safe health information publicly.
- Decide whether database readiness should be included.
- Review application logging for secrets and excessive response-body output.
- Document the health-check path and expected responses.

## Acceptance Criteria

- [ ] A health endpoint returns success when the application is ready.
- [ ] The endpoint does not expose credentials, internal paths, or unnecessary system details.
- [ ] An unhealthy database or failed startup produces a useful failure signal.
- [ ] Health behavior is covered by an automated test.

## Priority

High - required for reliable hosting.

## Labels

backend, monitoring, health-check, production

## Created

2026-07-26
