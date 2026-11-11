# Project Agent Guide

Read [`ARCHITECTURE.md`](ARCHITECTURE.md) before changing application structure. It is the baseline assessment for this repository; when code and that assessment diverge, update the documentation or explicitly record why the new direction is preferable.

## Project shape

- This is a small Angular 20 workshop application using standalone components, RxJS, Tailwind CSS, and Angular Material only where a Material behavior is deliberately used.
- Keep the architecture feature-oriented. The app shell may depend on a feature entry point; feature code must not reach into another feature's internals.
- Prefer the smallest Angular-native solution that makes async behavior predictable. Do not introduce NgRx, TanStack Query, a repository framework, or a generic domain layer without a demonstrated requirement.
- Treat `src/app/shared/` as a narrow cross-feature kernel. Feature-specific types and behavior stay in their feature directory.

## Required workflow

- Preserve user-visible behavior unless the task explicitly changes it.
- Add or adjust a focused test before fixing a behavior defect or changing async coordination.
- Run `npm test -- --watch=false` and `npm run build` before reporting completion. If the browser runner cannot start in the execution environment, also run `./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit` and report the runner failure explicitly.
- Keep API endpoints and transport concerns in API clients, not components or templates.
- Expected failures belong in explicit feature view state. Unexpected application failures go through the shared `ErrorHandler`; do not scatter `console.error` calls through components.

## Local instructions

- [`src/AGENTS.md`](src/AGENTS.md) defines shared Angular and TypeScript patterns.
- [`src/app/books/AGENTS.md`](src/app/books/AGENTS.md) defines the books feature boundary and its test expectations.
- [`REFACTORING.md`](REFACTORING.md) records the maintenance findings behind the current patterns.
