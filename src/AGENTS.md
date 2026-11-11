# Source Guidelines

These rules apply to everything under `src/` and refine the root `AGENTS.md`.

## Components and templates

- Use standalone components.
- Keep constructors limited to dependency injection. Express request orchestration as lazy observable or signal pipelines rather than starting work in a constructor.
- Use external HTML files for route/page components and for templates that are long enough to obscure the component's state and event API. Small, genuinely presentational templates may remain inline.
- Templates render state and emit user intent. Do not put request construction, error classification, or non-trivial data transformation in templates.
- Prefer a discriminated view-model state such as `loading | success | error` over loosely related `loading`, `data`, and `error` fields.

## Async behavior and errors

- Use `switchMap` for replaceable requests such as search and route-driven loading so obsolete HTTP requests are unsubscribed.
- Use RxJS timing operators instead of raw `setTimeout`; use `AsyncPipe` or Angular lifecycle-aware interop instead of unmanaged subscriptions.
- Handle expected HTTP outcomes at the feature boundary and expose user-visible states. Reserve the shared global error handler for unexpected exceptions.
- Do not hide failures by leaving stale success data on screen without an explicit stale-data design.

## Types and dependencies

- Keep strict TypeScript types; do not introduce `any` for timers, responses, or component state.
- Keep transport access behind a feature API client. Components must not inject `HttpClient` directly.
- Add code to `shared/` only after at least two consumers need the same stable concept, except for true application-wide infrastructure such as error handling.
