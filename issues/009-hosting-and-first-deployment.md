# Issue #009: Hosting Selection and First Deployment

## Status

Open and blocked by issues #005, #006, and #007.

## Summary

Select a suitable hosting provider and deploy StockSprout only after the provider-neutral preparation is complete.

## Scope

- Compare suitable providers based on cost, learning goals, PostgreSQL support, HTTPS, logs, and deployment method.
- Choose a frontend/backend routing topology.
- Create the application and PostgreSQL resources after explicit approval.
- Supply rotated production credentials through provider secret settings.
- Configure HTTPS, the public address, health checks, and database persistence.
- Document deployment, rollback, backup, and recovery steps.
- Add continuous deployment only after the first manual deployment is understood.

## Acceptance Criteria

- [ ] The provider and expected cost are explicitly approved.
- [ ] Production credentials have been rotated and are not stored in Git.
- [ ] The application is reachable through HTTPS.
- [ ] Authentication and database persistence work in production.
- [ ] Health checks and logs are available.
- [ ] Deployment and rollback are documented and repeatable.

## Priority

High - final delivery milestone for issue #002.

## Labels

hosting, deployment, database, https, cd

## Created

2026-07-26
