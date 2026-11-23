# AGENTS.md — Expense Calculator

## 1. Purpose

`expense-calculator` is a small, self-contained TypeScript command-line and library project for tracking expenses, computing totals and category breakdowns, and evaluating monthly or category budgets using integer cents.

The application stores expense information locally in a JSON file. The repository must not contain real personal financial information, passwords, API keys, or other sensitive data.

The main goal of an AI coding agent is to improve and maintain the project without breaking existing functionality or violating the acceptance criteria.

## 2. Architecture

The codebase is divided into small, focused TypeScript modules:

- `src/types.ts`: Shared interfaces and types (`Expense`, `NewExpenseInput`, `ExpenseFilter`, `Budget`, `BudgetStatus`, etc.).
- `src/validation.ts`: Input normalization and validation (`toCents`, `normalizeCategory`, `normalizeCurrency`, `validateDate`, `buildExpense`, `validateStoredExpense`) throwing `ValidationError` on invalid input.
- `src/calculator.ts`: Pure functions for filtering (`filterExpenses`), currency checking (`currencyOf` → `MixedCurrencyError`), totals (`totalCents`), category breakdown (`breakdownByCategory`), budget evaluation (`budgetStatus`), and formatting (`formatMoney`).
- `src/storage.ts`: `ExpenseStorage` interface with `InMemoryStorage` and `JsonFileStorage` (validating loaded records and saving via a temporary file and atomic rename).
- `src/store.ts`: `ExpenseStore` (`add`, `list`, `remove`) coordinating validation, storage persistence, and defensive copies.
- `src/cli.ts`: CLI entry point (`add`, `list`, `delete`, `summary`) using `EXPENSE_FILE` or defaulting to `data/expenses.json`.
- `src/index.ts`: Public exports for library consumers.
- `tests/`: Vitest unit tests (`validation.test.ts`, `calculator.test.ts`, `store.test.ts`, `storage.test.ts`, `helpers.ts`).

Keep responsibilities separated. Do not move unrelated functionality between modules without a clear reason.

## 3. Setup

1. Check the installed Node.js and npm versions:

   ```bash
   node -v
   npm -v
   ```

2. The `package.json` specifies Node.js `>=20`. Use a compatible Node.js version when possible. If the environment uses an older version, report the mismatch instead of silently changing the project requirements.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Check available npm scripts:

   ```bash
   npm run
   ```

Do not modify dependency versions or the lockfile unless the task explicitly requires it and the changes have been reviewed.

When a task requires it, report the outcome of `npm audit` in context: state which advisories affect runtime (`npm audit --omit=dev`) versus dev/test tooling (`npm audit`). Never run `npm audit fix --force`; it forces breaking major upgrades (for example vitest 2.x to 5.x) and is prohibited under Section 8. If audit findings touch only dev/test dependencies and the current tests pass, keep the pinned versions, note the known advisories and the planned upgrade window, and let a human approve the upgrade as a separate reviewed task.

## 4. Safe Commands

The following commands are allowed for normal development and verification:

```bash
npm run lint
npm test
npm run build
npm run typecheck
npm run dev -- <command>
```

Any CLI verification run (`npm run dev -- ...`) must target a temporary data file so the real data is never touched by checks:

```bash
EXPENSE_FILE=/tmp/expense-calculator-test.json npm run dev -- summary 2026-11
```

Use `data/expenses.json` only when the task is explicitly about the user's real expense data.

Use the following commands to inspect the repository:

```bash
git status --short
git diff
git log --oneline -5
```

Before making changes, inspect the current Git status and relevant source files.

After making changes, review the diff and run the relevant checks.

Do not assume that a command succeeded. Record its actual output and exit status.

## 5. Coding Conventions

- Use TypeScript and follow the existing project structure.
- Keep functions and modules focused on one responsibility.
- Prefer clear names for variables, functions, types, and interfaces.
- Reuse existing validation and calculation helpers instead of duplicating logic.
- Preserve strict TypeScript settings.
- Avoid unnecessary dependencies.
- Keep calculation functions predictable and easy to test.
- Use integer cents for monetary calculations instead of floating-point arithmetic.
- Preserve existing error types, including `ValidationError`, `StorageError`, and `MixedCurrencyError`.
- Validate external input and stored data before using it.
- Preserve existing public interfaces unless a change is necessary and documented.
- Do not introduce unrelated refactoring or formatting changes.

## 6. Test Expectations

Every functional change must be supported by appropriate tests.

Use the existing Vitest test structure:

- `tests/validation.test.ts` for input validation and normalization.
- `tests/calculator.test.ts` for calculations, filtering, budgets, and currency handling.
- `tests/store.test.ts` for expense management and persistence behavior.
- `tests/storage.test.ts` for JSON file storage and corrupted data handling.

Before considering a change complete, run:

```bash
npm run lint
npm test
npm run build
```

Expected baseline results:

- Type checking completes without errors.
- All existing tests pass.
- The production build completes successfully.

The baseline currently contains 4 test files and 40 tests. If test counts change, explain why.

Never delete, weaken, or skip existing tests just to make a check pass.

If a test fails, report the failure and investigate its cause instead of hiding it.

## 7. Acceptance Criteria to Preserve

All changes must preserve the following requirements:

- **AC-1 — Valid Expense Creation and Normalization:** Valid expense inputs convert amounts into integer cents, normalize category and currency values, and persist correctly.
- **AC-2 — Input Validation and Storage Integrity:** Invalid inputs are rejected with appropriate errors. Corrupted JSON or invalid stored records must not silently overwrite valid data.
- **AC-3 — Accurate Calculations and Budget Management:** Calculations use integer cents, category grouping works correctly, date bounds are inclusive, budget states are correct, and mixed currencies raise `MixedCurrencyError`.
- **AC-4 — Reproducible Project Verification:** Installation, type checking, tests, and production build must be checked using actual commands and results.

Do not claim that an acceptance criterion is satisfied without checking the relevant behavior.

## 8. Forbidden Actions and Safety Restrictions

An AI agent must NOT:

- Read, expose, copy, or commit passwords, API keys, access tokens, or other secrets.
- Add real personal financial information to the repository or test fixtures.
- Deploy the application to production or publish releases without explicit human approval.
- Execute destructive commands such as `rm -rf`, `git reset --hard`, `git clean -fd`, or commands that delete project data.
- Delete or overwrite user files, expense records, tests, or configuration files without explicit approval.
- Run `npm audit fix --force` or make unreviewed dependency upgrades.
- Change `package.json`, `package-lock.json`, or Node.js engine requirements without explaining the reason and obtaining approval.
- Commit or push changes to the remote repository without explicit human approval.
- Disable tests, remove validation, or weaken error handling to make the build pass.
- Make unrelated changes outside the requested task.

If an action may delete data, expose sensitive information, change dependencies, or affect the remote repository, stop and ask the human for approval first.

## 9. AI Agent Workflow

For every task, follow this workflow:

1. Read this `AGENTS.md` file and inspect the relevant source code.
2. Check `git status --short` before editing.
3. Understand the existing behavior and acceptance criteria.
4. Make only the changes required by the task.
5. Review the changes using `git diff`.
6. Run relevant tests and verification commands.
7. Report modified files, executed commands, actual results, known limitations, and any unresolved issues.

Do not invent test results or claim that changes were verified when they were not.

## 10. Human Review

The human developer is responsible for reviewing and approving all changes.

An AI agent may suggest improvements and prepare code changes, but it must not independently approve its own work, perform production deployments, or make irreversible decisions.

When instructions are unclear or conflict with the acceptance criteria, ask for clarification before proceeding.