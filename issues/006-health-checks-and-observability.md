# Issue #006: Health Checks and Basic Observability

## Status

Completed on 2026-07-27.

## Summary

Give a hosting platform a safe way to determine whether StockSprout is running and ready to serve requests.

## Scope

- [x] Add a minimal Spring Boot Actuator health endpoint.
- [x] Expose only production-safe health information publicly.
- [x] Include database availability in the overall health result.
- [x] Review application logging for secrets and excessive response-body output.
- [x] Document the health-check path and expected responses.

## Acceptance Criteria

- [x] `GET /actuator/health` returns HTTP `200` and `{"status":"UP"}` when ready.
- [x] The endpoint does not expose credentials, internal paths, component names, or unnecessary system details.
- [x] An unavailable database returns HTTP `503` and `{"status":"DOWN"}`; a failed startup never reports healthy.
- [x] Healthy, database-down, information-exposure, and management-endpoint behavior is covered by automated tests.

## Implementation Notes

- Only the Actuator `health` endpoint is exposed over HTTP; JMX exposure is disabled.
- Only the exact `/actuator/health` path is public through Spring Security.
- PostgreSQL readiness is included because authentication, refresh tokens, and portfolios depend on it.
- The external market-data provider is excluded so a temporary third-party outage does not cause unnecessary application restarts or traffic removal.
- Health details and components are always hidden.
- Market-data response bodies, full request URLs, and stack traces are no longer printed. Safe structured logs contain only the operation, HTTP status, or exception type.
- `APP_LOG_LEVEL` can tune application logging per environment and defaults to `INFO`.

## Verification

- `mvn clean test`: 36 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed with the existing non-failing asset-resolution and chunk-size warnings.

## Priority

High - required for reliable hosting.

## Labels

backend, monitoring, health-check, production

## Created

2026-07-26
