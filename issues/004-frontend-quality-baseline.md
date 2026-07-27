# Issue #004: Frontend Quality Baseline

## Status

Completed on 2026-07-26.

## Summary

Make the existing frontend lint command pass before using it as a required CI quality gate.

## Scope

- Remove unused imports, variables, and callback parameters.
- Resolve React Fast Refresh export warnings without changing application behavior.
- Resolve or deliberately document React Hook dependency warnings.
- Correct the undefined Node environment reference in `ErrorBoundary.jsx`.
- Preserve current UI behavior while making mechanical cleanup changes.

## Acceptance Criteria

- [x] `npm run lint` exits successfully.
- [x] `npm run build` still succeeds.
- [x] Cleanup is limited to dead code, module organization, stable callbacks, and a case-sensitive import correction.
- [x] The narrow Framer Motion lint exception is documented in the ESLint configuration.

## Completed Work

- Removed genuinely unused state, variables, and callback parameters.
- Moved context objects and hooks out of component-only Fast Refresh modules.
- Stabilized effect callbacks with `useCallback` and explicit dependencies.
- Replaced the Node-only environment check with Vite's environment API.
- Corrected the `NotFoundpage.jsx` import casing for Linux builds.
- Preserved the reusable API error hook in its own hook module.

## Verification

- `npm run lint`: passing with no errors or warnings.
- `npm run build`: passing.
- The build still reports the existing bundle-size and unresolved `/grid.svg` warnings; these do not fail the build.

## Priority

Completed - CI can now enforce frontend lint and build checks.

## Labels

frontend, quality, lint, ci, completed

## Created

2026-07-26
