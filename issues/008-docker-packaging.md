# Issue #008: Provider-Neutral Docker Packaging

## Status

Open.

## Summary

Package StockSprout into reproducible containers without selecting or configuring a hosting provider.

## Scope

- Add an optimized backend Dockerfile.
- Add an appropriate frontend production image or static-build strategy.
- Add `.dockerignore` files.
- Pass configuration at runtime or build time without copying secrets into images.
- Optionally add Docker Compose for local application and PostgreSQL development.
- Document image build and run commands.

## Acceptance Criteria

- [ ] Images build from a clean checkout.
- [ ] Containers run with externally supplied configuration.
- [ ] Images contain no local configuration files or credentials.
- [ ] Containerized health checks use issue #006's endpoint.
- [ ] Docker remains optional for normal local Maven and Vite development.

## Priority

Medium - useful for portability but not required by every hosting platform.

## Labels

docker, containers, deployment, infrastructure

## Created

2026-07-26
