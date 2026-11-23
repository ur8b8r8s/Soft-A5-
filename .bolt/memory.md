# Project memory

## Product intent & audience

- Expense Calculator: Node/TypeScript CLI app for tracking expenses and budget status.
- Audience includes AI coding agents governed by root-level `AGENTS.md`; human developers maintaining the app.

## Brand personality & voice

- Documentation tone (AGENTS.md, reports) is direct, checklist-driven, and explicit about boundaries/forbidden actions.
- Reports lead with verification status, then prioritize actionable issues.

## Visual design & UX direction

- CLI UX only; no UI/web layer inferred.
- CLI runs against a data file (default `data/expenses.json`), overridable via `EXPENSE_FILE` env var.
- Safe trial runs should target a non-user data file (e.g. `EXPENSE_FILE=/tmp/test.json`) to avoid mutating real data.

## Decisions, constraints & rationale

- Runtime: Node `>=20`; TypeScript with `tsc --noEmit` used for both `lint` and `typecheck`.
- Money is stored/processed as integer cents (avoid float errors).
- Three error classes include `MixedCurrencyError`; budget status uses an 80% warning threshold.
- Source modules/export names verified against AGENTS.md: `toCents`, `filterExpenses`, `budgetStatus`, `ExpenseStorage`, `MixedCurrencyError`, plus `cli.ts`.
- Tests: 4 files, 40 tests (29 `it` blocks + 11 from `it.each`: 6+5), all passing as baseline.
- npm scripts observed: `test`, `lint`, `typecheck`, `dev`, `start`, `test:watch`.
- `.gitignore` excludes `data/`; runtime expense data is untracked and should not be committed if a repo is initialized.
- Inspection-only constraints from this task: no source/dependency/lockfile changes, no installs/updates, no destructive commands, no commit/push, no deploy.

## Open questions & assumptions

- AGENTS.md inaccuracies flagged but not yet fixed pending user approval: (1) git workflow assumes a repo, but no `.git` exists; (2) `npm run dev -- <command>` lacks guidance on safe data-file usage; (3) `npm start`/`npm run test:watch` not covered in safe commands; (4) no `data/` handling note; (5) no single-file test command documented; (6) minor wording inconsistency re: JSON-file vs in-memory storage.
- Assumption: test runner is Vitest-style (uses `it`/`it.each`); confirm exact runner if needed.
- Assumption: user may later request AGENTS.md edits; no edits made without explicit request.