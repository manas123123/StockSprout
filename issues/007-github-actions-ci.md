# Issue #007: GitHub Actions Continuous Integration

## Status

Open.

## Summary

Automatically validate backend and frontend changes on pushes and pull requests without deploying anything.

## Scope

- Add a GitHub Actions workflow for the supported Java and Node versions.
- Run the backend Maven test suite.
- Install frontend dependencies reproducibly with `npm ci`.
- Run frontend lint and production build checks.
- Cache dependencies where safe and useful.
- Keep deployment credentials and continuous deployment out of this workflow.

## Acceptance Criteria

- [ ] The workflow runs on pull requests and appropriate branch pushes.
- [ ] Backend test failures fail the workflow.
- [ ] Frontend lint or build failures fail the workflow.
- [ ] The workflow does not require production secrets.
- [ ] Local documentation lists the same commands used by CI.

## Priority

High - required for repeatable quality checks.

## Labels

ci, github-actions, testing, automation

## Created

2026-07-26
