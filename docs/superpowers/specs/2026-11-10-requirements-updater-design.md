# Requirements Updater Design

## Intent

Complete the agentic requirements workflow by proving an implemented feature against its original GitHub issue and acceptance criteria, recording traceable evidence, and closing the issue only when delivery is verified.

## Goals

- Load the authoritative issue, comments, and acceptance criteria.
- Map every criterion to implementation and fresh verification evidence.
- Run the repository's required tests and build.
- Keep the issue open when evidence is missing or verification fails.
- Preview the GitHub update and closure before requesting explicit mutation approval.
- Produce a concise completion summary after any approved GitHub update.

## Non-goals and anti-goals

- Do not repair implementation defects, rewrite acceptance criteria, or weaken tests during finalisation.
- Do not infer that focused tests, a demo, or a prior successful run proves delivery.
- Do not comment on or close an issue without explicit approval of the proposed mutation.
- Do not report completion while any criterion, required test, or build remains unresolved.

## Constraints

- The workflow requires an unambiguous GitHub issue number and repository.
- Original issue statements and later approved decisions remain distinct from agent inferences.
- GitHub mutations occur only after read-only reconciliation and fresh local verification.
- The skill is project-local and automatically discoverable.

## Approach

Use one self-contained `requirements-updater` skill with UI metadata. Its workflow is a strict evidence gate: retrieve, trace, verify, classify, preview, approve, mutate, summarize. A looser advisory checklist would not reliably prevent premature closure; scripts or templates add no value because repository commands and issue formats vary.
