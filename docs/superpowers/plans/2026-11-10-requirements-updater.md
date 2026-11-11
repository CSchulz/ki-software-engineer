# Requirements Updater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project-local skill that reconciles completed implementation with a GitHub issue, verifies delivery, updates the issue with evidence, and closes it safely.

**Architecture:** A self-contained `SKILL.md` defines the evidence and mutation gates; `agents/openai.yaml` provides discoverable UI metadata. No scripts or assets are needed because verification commands and issue structure must come from the target repository and issue.

**Tech Stack:** Codex skills Markdown, YAML UI metadata, GitHub connector or `gh`, repository-native test/build commands

**Spec:** `docs/superpowers/specs/2026-11-10-requirements-updater-design.md`

## Global Constraints

- Place the skill at `.agents/skills/requirements-updater/`.
- Require an unambiguous GitHub issue number and repository.
- Treat issue retrieval and local inspection as read-only until mutation approval.
- Never close while acceptance evidence, required tests, or build verification is incomplete.
- Require explicit approval of the proposed GitHub comment and closure.

## Review Focus

- Missing or ambiguous issue number must stop retrieval rather than trigger guessing.
- Issue comments that amend acceptance criteria must appear in reconciliation.
- Passing focused tests must not substitute for required full-suite and build verification.
- Environment or pre-existing failures must remain visible and block an unsupported completion claim.
- Full verification must still stop for mutation approval before commenting or closing.

---

### Task 1: Create and validate the Requirements Updater skill

**Files:**
- Create: `.agents/skills/requirements-updater/SKILL.md`
- Create: `.agents/skills/requirements-updater/agents/openai.yaml`
- Test: independent baseline and skill-enabled finalisation scenarios

**Interfaces:**
- Consumes: a GitHub issue number or URL, repository state, original acceptance criteria, implementation diff, and repository verification commands
- Produces: an acceptance-criterion traceability table, verification status, mutation preview and approval gate, optional GitHub update/closure, and completion summary

- [ ] **Step 1: Record the existing RED evidence**

Capture the baseline gap: unaided agents rely on supplied success claims rather than requiring fresh commands, do not consistently inspect the authoritative issue discussion, omit an explicit criterion-to-evidence matrix, and may proceed directly to GitHub mutation.

- [ ] **Step 2: Initialize the project-local skill**

Run the bundled skill initializer for `requirements-updater` under `.agents/skills` with UI metadata and no unused resource directories.

- [ ] **Step 3: Implement the minimal workflow guidance**

Define input resolution, authoritative issue retrieval, criterion reconciliation, fresh verification, blocking conditions, mutation preview/approval, GitHub update, closure, and final summary. Cross-reference `getting-github-issue-context` and `verification-before-completion` by skill name instead of duplicating them.

- [ ] **Step 4: Run skill-enabled behavioral scenarios**

Re-run the three baseline cases. Expected: incomplete criterion evidence blocks closure; failed full verification blocks completion; complete evidence produces a mutation preview and waits for approval.

- [ ] **Step 5: Validate structure and metadata**

Run `quick_validate.py` when its YAML dependency is available; otherwise report the dependency failure and run an equivalent local YAML/frontmatter check. Confirm there are no scaffold TODOs and the UI prompt references `$requirements-updater`.

- [ ] **Step 6: Run project verification**

Run `npm test -- --watch=false` and `npm run build`. If the browser runner cannot start, also run `./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit` and report the runner failure explicitly.
