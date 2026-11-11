# Books Feature Guide

These rules apply only to `src/app/books/`.

## Boundary and responsibilities

- `BookApiClient` is the HTTP transport adapter. It owns URLs, parameters, and transport calls, but not loading state or UI messages.
- Route components own feature orchestration through a single observable view model. They must represent loading, success, empty/not-found, and service-error outcomes explicitly.
- `BookItemComponent` is presentational. It receives a `Book` and renders navigation; it must not load data or mutate feature state.
- Keep book-only models, helpers, and state types in this directory. Do not move them into `shared/` merely for convenience.

## Request patterns

- Search input is debounced and uses `switchMap`; a newer term must cancel the subscription to the older request.
- Detail loading distinguishes a missing book (`404` or absent result) from a general service failure.
- Retry actions repeat the current request through the same observable pipeline rather than duplicating request code.

## Tests

- API-client tests assert the requested endpoint and relevant query parameters.
- Route-component tests cover loading, success, empty/not-found, and failure states.
- Search tests must prove that a superseded request is unsubscribed and cannot overwrite newer results.
- Presentational tests assert accessible navigation and meaningful fallback content, not Tailwind class strings.
