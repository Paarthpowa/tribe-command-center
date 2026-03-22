# GITHUB-COPILOT.md — Operational Playbook for GitHub Copilot (Repo SAFE Rules)

This file defines the guardrails, workflow, and minimal verification steps that GitHub Copilot-style agents must follow when making changes in this repository.

## Purpose
- Provide an always-available, repo-level contract describing what edits are safe for an automated assistant to make without additional approvals.
- Keep the project baseline intact and ensure small, testable changes are applied with proper checks.

## Scope
- Applies to automated edits performed by a coding assistant (suggesting patches, creating files, or producing PR-ready diffs).
- Does not grant permission to run commands on the user's machine or to change external infrastructure without approval.

## Baseline (must never regress)
1. The application builds and typechecks: `npm run typecheck` and `npm run build` should pass after changes.
2. Core application features must remain functional after any change.
3. No committed changes should introduce console errors in the startup path under normal data conditions.

## Quick rules (always follow)
- Make the smallest possible change to achieve the goal.
- Prefer non-invasive fixes: add small helper functions, guard clauses, tests, or comments rather than large refactors.
- Run static checks (typecheck/lint) locally before proposing the final patch. If you cannot run them, clearly state the commands and expected output.
- Do not add secrets, tokens, or external credentials to the repository.

## Approval tokens (explicit user instruction required)
- `CORE CHANGE OK` — You may change base rendering, camera, hit-detection, or selection logic in core application files.
- `SCHEMA CHANGE OK` — You may change DB schema, generated artifacts, or type definitions. If granted, include migration notes.
- `BUNDLE WORKER OK` — You may change worker bundling strategy or convert classic workers to module workers.

## Safe edit checklist (for any automated edit)
- [ ] Plan: Short summary (1–2 lines), files to touch, why this is safe.
- [ ] Touch list: Only the files required for the change.
- [ ] Typecheck: `npm run typecheck` (or `tsc -b`) — paste result if available.
- [ ] Build: `npm run build` — paste result if available.
- [ ] Smoke: Manual smoke test notes. If the author cannot run the smoke test, clearly mark it as `MANUAL-TEST-REQUIRED`.
- [ ] Decision log entry: Append a short entry to `docs/decision-log.md`.

## Anchors and protected regions
- Do not change code between anchor comments (e.g., `// ANCHOR: selection-logic`) unless the relevant approval token is provided.
- If a change must touch these anchors, ask for the appropriate token and include a rollback plan.

## Testing & verification
- **Unit tests:** Add small unit tests when changing testable logic. If tests are added, run them locally and include results.
- **Memory/smoke checks:** For changes touching rendering or workers, include a note about manual verification (open app, toggle feature 10x, confirm no errors and memory stability).

## Performance guidelines
- Avoid O(n²) loops over large arrays in render or interaction loops. Use maps/indices where appropriate.
- Prefer reusing data structures and calling update methods rather than recreating objects each frame/cycle.

## Worker & bundling rules
- Web workers that use `importScripts` (classic workers) must be created as classic workers and kept in `public/` or provided as static assets.
- Module workers should be instantiated with `new Worker(new URL('./path', import.meta.url), { type: 'module' })`.
- If changing a worker strategy, ask for `BUNDLE WORKER OK` and provide a short migration plan.

## Decision log (append only)
- For each accepted change, append to `docs/decision-log.md`:
```
## YYYY-MM-DD — Short title
- Summary: 1–2 lines
- Files: src/..., public/...
- Baseline checks: typecheck | build | smoke
- Risk: low/med/high
- Notes: (optional)
```

## PR checklist
- Description: Why and what changed.
- Files changed: minimal and relevant.
- Baseline status: typecheck/build results included or marked `MANUAL-TEST-REQUIRED`.
- Rollback plan: one-line (revert commit or branch).

## When to stop and ask
- If a change requires more than 3 files to be edited across core, modules, and types, stop and ask for explicit approval.
- If you are unsure whether a change affects the baseline, stop and request the appropriate approval token.
