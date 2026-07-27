# Issue #002: Production Readiness

## Status

In progress.

## Summary

Prepare StockSprout for a secure, repeatable production deployment while keeping the repository hosting-provider-agnostic until a provider is selected.

## Progress

- [x] Complete the JWT authentication migration in [issue #001](001-jwt-authentication-migration.md).
- [x] Externalize runtime configuration and remove current hardcoded credentials in [issue #003](003-portable-configuration.md).
- [x] Establish a green frontend quality baseline in [issue #004](004-frontend-quality-baseline.md).
- [ ] Harden cookie authentication and CSRF protection in [issue #005](005-production-authentication-hardening.md).
- [ ] Add health checks and production-safe observability in [issue #006](006-health-checks-and-observability.md).
- [ ] Add continuous integration in [issue #007](007-github-actions-ci.md).
- [ ] Add optional provider-neutral Docker packaging in [issue #008](008-docker-packaging.md).
- [ ] Select a provider and perform the first deployment in [issue #009](009-hosting-and-first-deployment.md).
- [ ] Revisit Kubernetes as an optional learning milestone in [issue #010](010-kubernetes-evaluation.md).

## Completion Criteria

- [ ] All local quality checks are green and automated in CI.
- [ ] Production authentication settings have been reviewed and tested.
- [ ] A safe health endpoint is available to the hosting platform.
- [ ] Production credentials are supplied externally and rotated before deployment.
- [ ] PostgreSQL is configured for the selected environment.
- [ ] The application is available through HTTPS at a public address.
- [ ] Deployment and rollback steps are documented and repeatable.

## Guardrails

- Do not create cloud resources or deploy without explicit approval.
- Do not commit real credentials or populated local configuration files.
- Keep provider-specific configuration out of the repository until a provider is selected.

## Priority

High - required for public availability.

## Labels

deployment, infrastructure, production

## Created

2026-07-01
