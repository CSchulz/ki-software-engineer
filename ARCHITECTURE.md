# Architectural Assessment

## Executive Summary

This is a small Angular workshop application with one feature and roughly 250 application lines. Its current structure is understandable, but it is not yet an architecture that can absorb sustained feature or team growth.

The central problem is boundary weakness:

- The feature component owns UI state, request orchestration, debouncing, error handling, and response mutation.
- The API model, domain model, and view model are the same type.
- Feature boundaries exist as directories but are not enforced.
- Several competing architecture dependencies are installed without any adopted pattern.
- The test infrastructure does not test the application.

Overall architectural risk: **Moderate now, High under growth**.

## 1. Architectural Overview

### Architectural style

Observed style:

- Standalone Angular application.
- Shallow feature-folder organization.
- Component-driven UI with a thin HTTP gateway.
- Informal container/presentational split: `BookListComponent` is the smart component; `BookItemComponent` is presentational.
- No domain layer, application layer, store layer, or explicit infrastructure boundary.

This is not meaningfully layered or domain-driven. It is a feature-oriented Angular application with direct framework coupling.

### Implicit boundaries

```text
App shell
  └── books feature
        ├── list/container component
        ├── item/presentational component
        ├── API client
        └── shared API/domain/view model

Shared
  └── toast wrapper
```

The `books` directory is cohesive, but its internal layers are implicit. Nothing prevents future feature code from directly importing its API client or model.

The `shared` directory currently contains one unused, globally scoped Material adapter. It does not yet represent a coherent shared-kernel boundary.

### Dependency direction

```text
bootstrap
  → app configuration
  → router
  → BookListComponent
  → BookApiClient
  → Angular HttpClient
  → external HTTP API
```

There are no circular dependencies in the current import graph. That result is weak evidence of architectural health because there is only one feature and eight application TypeScript files.

Dependency inversion is absent:

- The component depends on the concrete `BookApiClient`.
- The client depends directly on `HttpClient`.
- The endpoint is embedded in the client.
- The `Book` interface is simultaneously transport, feature, and presentation data.

### State management and data flow

State is mutable and component-local: `books`, `loading`, `searchTerm`, and `searchTimeout`.

```text
User event → component method → HTTP service → subscription callback → component fields → template
```

Request ordering is not controlled. Multiple in-flight searches can complete out of order and overwrite newer results. The manual timeout only debounces request creation; it does not cancel previous HTTP requests.

The repository includes NgRx Signals, NgRx Toolkit, and TanStack Query, but none is used. The effective state strategy is plain mutable component fields plus manual RxJS subscription.

### Side effects

Side effects are handled in four places:

- Bootstrap errors go to `console.error`.
- HTTP requests originate from the component.
- Search scheduling uses raw `setTimeout`.
- Request failures go to `console.error`.

There is no user-visible error state, centralized error policy, retry strategy, cancellation, request caching, or environment-based endpoint configuration.

## 2. Critical Architectural Topics

| Topic | Risk | Assessment |
|---|---|---|
| Modularity | **Moderate** | The `books` folder is cohesive, but its boundaries are conventional only. API, domain, orchestration, and presentation are colocated without explicit internal contracts. |
| Dependency management | **Moderate** | The graph is currently acyclic, but dependencies point directly from UI to concrete infrastructure. No ports, tokens, facades, or boundary enforcement exist. |
| State management | **Moderate** | Local state is sufficient for this screen, but async state is manually coordinated and vulnerable to response races. Installed alternatives create future inconsistency risk. |
| Scalability | **High** | Each new data-driven screen is likely to duplicate loading, error, search, and subscription logic. Routes are eager and there is no feature-level extension contract. |
| Testability | **High** | No application tests exist. HTTP orchestration and timing logic are embedded in the component. The configured E2E test targets Playwright's website, not BookMonkey. |
| Build and tooling | **High** | The manifest contains multiple unused architectural stacks, incomplete unit-test dependencies, unused SSR dependencies, and no lint or application E2E script. |

### Modularity

Positive:

- `books` has high topical cohesion.
- `BookItemComponent` depends only on the book data it renders.
- No barrel exports obscure the import graph.

Risks:

- Directory placement is the only boundary mechanism.
- `BookApiClient` is feature-local but globally provided.
- `Book` is a shared representation across every implicit layer.
- There are no import restrictions or public feature entry points.
- `shared` has begun accumulating a globally available abstraction before a demonstrated cross-feature requirement.

Cross-feature leakage cannot yet be observed because only one feature exists.

### Dependency management

No circular dependencies were found. Separation remains incomplete: UI depends on a concrete API client, which depends directly on `HttpClient`. No mapper separates transport contracts from application models, and the endpoint is hard-coded in `book-api-client.service.ts`.

Introducing interfaces for every class would be premature at this scale. The immediate problem is not lack of interfaces; it is that async orchestration and infrastructure configuration have no stable boundary.

### State management

The current state volume does not justify a global store. The problem is predictability:

- Search uses `setTimeout` with `any`.
- Requests are subscribed independently.
- Older responses can replace newer search results.
- The timeout and active request are not canceled on component destruction.
- Failure clears `loading` but leaves no explicit error state.
- A failed search can leave previous results displayed as if they were current.

A feature-level observable or signal facade using `debounceTime`, `distinctUntilChanged`, and `switchMap` would address the actual issue. A global store would not inherently solve it.

### Scalability

New features can currently be added without modifying much existing code, but only because there is almost no shared architecture. The likely growth path is:

```text
New route
  → new smart component
  → new root service
  → manual loading/error fields
  → manual subscriptions
  → another hard-coded endpoint
```

That is an accidental monolith in formation: locally separated directories over a globally shared dependency-injection and configuration space.

### Testability

Current seams:

- `BookApiClient` can be replaced through Angular dependency injection.
- `BookItemComponent` is simple enough to test independently.

Major limitations:

- No `*.spec.ts` files exist.
- Timing and HTTP coordination are coupled to the component lifecycle.
- `console.error` is the only failure output.
- The Playwright suite under `tests` navigates to `playwright.dev`.
- The extensive TodoMVC example is under `tests-examples`, which is excluded by `testDir: './tests'`.
- `tsconfig.spec.json` requests Jasmine types, but the lockfile contains no installed Jasmine type package.
- The Karma builder is configured, but Karma and Jasmine are not root dependencies.

### Build and tooling architecture

The Angular build configuration itself is conventional and small. Strict TypeScript and strict Angular template checking are good controls.

Configuration drift is already visible:

- SSR, Express, platform-server, and Node types are installed, but there is no server entry point or SSR build target.
- Three server-state or state-management candidates are installed but unused.
- Material is present principally for an unused toast service.
- Tailwind and Material theming coexist without an explicit design-system boundary.
- Prettier has a write command but no check command.
- There is no lint command.
- There is no Playwright script in `package.json`.
- Unit and E2E testing use unrelated scaffold configurations.

## 3. Recurring Architectural Patterns

### Feature folders

- **Where:** `src/app/books`.
- **Consistency:** Consistent, but demonstrated by only one feature.
- **Appropriateness:** Appropriate.
- **Long-term risk:** Moderate, because the folder has no public API or import rules.

### Container/presentational split

- **Where:** `BookListComponent` versus `BookItemComponent`.
- **Consistency:** Applied once.
- **Appropriateness:** Appropriate.
- **Risk:** The container already owns page markup, mutable state, timing, HTTP orchestration, and error handling.

### Service as HTTP gateway

- **Where:** `BookApiClient`.
- **Consistency:** Applied to the only API.
- **Appropriateness:** Appropriate as a transport adapter.
- **Risk:** Moderate. It is globally scoped, hard-coded to one environment, and exposes transport objects directly.

### Root singleton services

- **Where:** `BookApiClient` and `ToastService`.
- **Consistency:** Consistent.
- **Appropriateness:** Acceptable for stateless adapters.
- **Risk:** Root scope makes feature infrastructure globally addressable and encourages cross-feature imports as the system grows.

### Inline component templates

- **Where:** Both book components.
- **Consistency:** Consistent inside the feature.
- **Appropriateness:** Fine for `BookItemComponent`; questionable for the list template.
- **Risk:** Moderate. The list is already becoming a page-level God component.

Barrel exports, contexts, event buses, and hooks-as-services are not present.

## 4. Architectural Snowflakes

### Competing unused state/query stacks

- **Where:** `@ngrx/signals`, `@angular-architects/ngrx-toolkit`, and `@tanstack/angular-query-experimental`.
- **Likely origin:** Workshop experimentation or abandoned architectural trials.
- **Intentionality:** Probably intentional as workshop material; accidental from the production architecture's perspective.
- **Risk:** **High**.
- **Recommendation:** Select no state library until a concrete shared-state requirement exists. Remove all three from the baseline or document one as the mandated feature-state pattern.

### Unused SSR stack

- **Where:** `@angular/ssr`, `@angular/platform-server`, Express, and Express/Node types.
- **Likely origin:** Partial SSR setup.
- **Intentionality:** Incomplete intention.
- **Risk:** **Moderate**.
- **Recommendation:** Either add the server entry point, SSR target, deployment contract, and SSR-safe API configuration, or remove the dependencies.

### Shared toast abstraction without a consumer

- **Where:** `src/app/shared/toast.service.ts`.
- **Likely origin:** Planned error/notification handling.
- **Intentionality:** Intentional but unfinished.
- **Risk:** **Low currently; Moderate if copied**.
- **Recommendation:** Use it as the explicit user-facing failure channel or delete it until required.

### Two unrelated test worlds

- **Where:** Karma/Jasmine configuration versus Playwright tests of external demo sites.
- **Likely origin:** Angular and Playwright scaffolding retained without integration.
- **Intentionality:** Accidental.
- **Risk:** **High**.
- **Recommendation:** Add book-list unit or integration tests and replace the external Playwright example with one local BookMonkey smoke path. Move or delete `tests-examples`.

### Mixed UI systems

- **Where:** Tailwind drives the application templates; Angular Material appears through the toast service and theme file.
- **Likely origin:** Incremental adoption.
- **Intentionality:** Unclear.
- **Risk:** **Moderate**.
- **Recommendation:** Define Material as a limited behavioral-component dependency or standardize on it. Otherwise remove its global theme and toast wrapper.

## 5. Known and Latent Architectural Issues

### Structural risks

- No enforceable feature boundaries.
- UI directly controls infrastructure side effects.
- Transport, domain, and presentation models are collapsed into `Book`.
- Root-provided feature infrastructure is globally importable.
- API configuration is embedded in source code.
- Routes eagerly import feature components.

### Maintainability risks

- `BookListComponent` is the first emerging God component.
- Loading, empty, and error semantics are inconsistent.
- Manual debounce and cancellation logic will be duplicated.
- Unused dependencies obscure the intended architecture.
- `RouterModule` is imported by `BookItemComponent` without router usage.

### Performance risks

- Search requests are not canceled.
- Out-of-order responses can render stale data.
- No cache or request deduplication exists.
- Future routes following the current pattern will be eagerly loaded.
- Global Material and Tailwind styling increases baseline surface for minimal current use.

### Organizational risks

- Parallel feature teams can establish incompatible state patterns immediately.
- No architectural tests or import constraints define ownership.
- No application-facing test suite protects feature behavior.
- `shared` has no admission rule.
- No ADR explains the intended use of SSR, Material, NgRx, or TanStack Query.

## 6. Architectural Smell Detection

### Over-engineering

- Three advanced state/query libraries exist for four mutable fields.
- SSR dependencies exist without an SSR architecture.
- The toast wrapper abstracts a single unused Material call.

### Premature abstraction

- `ToastService` is premature unless it becomes the documented notification boundary.
- The package stack anticipates architectures the source code has not adopted.

### Excessive indirection

Not currently present in source code.

### Under-abstracted duplication

There is not enough feature code to demonstrate repeated duplication. The first likely duplication point is data-loading orchestration. Extracting that behavior before the second data-driven feature is justified; introducing a generalized repository framework is not.

### Accidental monolith

Risk is **Moderate and rising**. The application is physically split into files but logically centered on components and root services. Without feature-scoped providers and import rules, future features will share one global dependency space.

### Framework lock-in

Angular coupling is expected and not itself problematic. More concerning is direct coupling of feature behavior to Angular lifecycle hooks, Angular `HttpClient`, template-driven forms, Material snackbar, zone-based change detection, and raw RxJS subscriptions.

## 7. Long-Term Evolution Assessment

### Can it support 2x team size?

**Not safely without ownership and pattern decisions.**

With two parallel feature teams, divergence is likely around state management, template organization, Material versus Tailwind, feature-local versus shared services, and error/loading semantics.

### Can it support 3x feature growth?

**Functionally yes, architecturally no.**

Three more features can be added quickly, but they will likely duplicate component-owned orchestration and expand the root service graph. Refactoring after that point will require changing multiple live features simultaneously.

### Where will entropy accumulate?

1. Smart route components.
2. `shared`.
3. API endpoint and transport-model handling.
4. Loading, error, and request-state conventions.
5. Package and build configuration.
6. Root-level dependency injection.

### What will break first?

- **Behavior:** stale search results from out-of-order HTTP responses.
- **Architecture:** multiple incompatible state-fetching patterns.
- **Scaling:** `shared` becomes a collection of unrelated UI, infrastructure, and domain utilities.
- **Confidence:** test infrastructure exists, but no test verifies the application.

## Priority Corrections

1. Move search/query orchestration behind a feature facade using one cancellation-aware stream or signal pipeline.
2. Add explicit `idle`, `loading`, `success`, and `error` feature state and surface failures in the UI.
3. Inject API base configuration rather than embedding `localhost:4730`.
4. Choose and document one server-state approach; remove the unused alternatives.
5. Replace the external Playwright example with a local BookMonkey test and add component/API-client tests.
6. Repair or remove the incomplete Karma/Jasmine setup.
7. Make the books route lazy and scope feature infrastructure at the route boundary.
8. Establish import rules: the app shell may import feature entry points; features may not import each other; `shared` must not contain feature-specific behavior.
9. Either complete SSR as an operational capability or remove its dependency stack.
10. Split the list page into page orchestration, search control, result state, and book grid only when those pieces gain independent behavior.

## Verification Limits

Repository inspection covered all application and test files. Build and test execution were not verified during the assessment because dependencies were not installed in the reviewed worktree (`ng: command not found`).
