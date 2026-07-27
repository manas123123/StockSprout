# Issue #010: Kubernetes Evaluation

## Status

Deferred until after issue #009.

## Summary

Evaluate Kubernetes as a learning or scaling exercise after StockSprout has a working simple deployment and Docker images.

## Scope

- Identify a concrete reason to use Kubernetes beyond learning.
- Compare its operational cost and complexity with the selected simple hosting platform.
- If approved, design deployments, services, configuration, secrets, health probes, and database connectivity.
- Keep PostgreSQL backups and persistence outside disposable application pods.

## Acceptance Criteria

- [ ] Docker packaging and a simple production deployment already work.
- [ ] The reason for adopting Kubernetes is documented.
- [ ] Expected infrastructure cost and maintenance effort are understood.
- [ ] No cluster or cloud resources are created without explicit approval.

## Priority

Low - optional learning milestone, not required for the first deployment.

## Labels

kubernetes, containers, learning, infrastructure, deferred

## Created

2026-07-26
