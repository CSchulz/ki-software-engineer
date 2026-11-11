# Refactoring Findings

This review applies the risks identified in [`ARCHITECTURE.md`](ARCHITECTURE.md) to the latest generated books feature.

## Concrete maintenance problems

1. **Request coordination lived in mutable component fields.** `BookListComponent` combined `books`, `loading`, `searchTerm`, a manually typed `any` timeout, and independent subscriptions. An older HTTP response could overwrite a newer search result, and cleanup depended on remembering timers and subscriptions.
2. **Expected failures were not modeled consistently.** The list logged errors and rendered the previous/empty result as though it were valid, while the detail page had its own bespoke error flags. Unexpected errors had no application-wide reporting boundary.
3. **Route components mixed too many concerns.** The list and detail classes contained page-sized inline templates alongside request orchestration, state mutation, error classification, and event handlers. This made the behavioral contract hard to see and made merge conflicts more likely.
4. **Async state could become invalid.** Separate `loading`, `book`, `books`, and `error` fields allowed combinations such as loading with stale data or neither data nor an actionable error.
5. **Patterns were undocumented.** The feature folder existed, but nothing told future agents where HTTP details, async state, shared code, template logic, or error policy belonged. The installed but unused state libraries made divergent solutions especially likely.
6. **Tests covered the generated detail feature but not the existing search race.** There was no regression test proving that a superseded search request is unsubscribed, and no list error-state test.

## Target patterns

- Represent each route's UI as one discriminated observable view model (`loading`, `success`, and explicit failure variants).
- Use `debounceTime`, `distinctUntilChanged`, and `switchMap` for search. This removes raw timers and guarantees cancellation of obsolete HTTP subscriptions.
- Render observable state with `AsyncPipe`; avoid manual component subscriptions and lifecycle cleanup where a declarative pipeline is sufficient.
- Keep expected HTTP failures in feature state. Route unexpected exceptions through one application `ErrorHandler` and the shared user-facing notification channel.
- Put page-sized markup in external templates. Component classes should make dependencies, state, and user events understandable without scrolling through HTML.
- Keep the architecture lightweight: no global store or generic repository abstraction is justified by this feature.
- Protect the patterns with behavior tests, especially request cancellation, error rendering, detail fallbacks, and accessible routing.

## Applied scope

- [ ] Replace manual list timeout/subscriptions with a cancellation-aware observable view model.
- [ ] Give the list an explicit service-error state and retry path.
- [ ] Convert detail loading to the same view-model pattern without changing its visible states.
- [ ] Move books page/card markup to external templates.
- [ ] Add a shared handler for unexpected application errors.
- [x] Add root, source, and books-feature agent guidance aligned with `ARCHITECTURE.md`.
- [ ] Run tests, compile test sources, run the production build, and review the final diff.
