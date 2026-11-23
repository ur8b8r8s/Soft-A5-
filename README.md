# Expense Calculator

A small TypeScript project for tracking expenses: add, list, filter and delete entries,
compute totals and per-category breakdowns, and check monthly or per-category budgets.
Built as a compact codebase for software engineering assignment review.

- No database, no network calls, no API keys, no personal data.
- Money is stored as integer cents to avoid floating-point errors.
- All input is validated; data loaded from disk is re-validated.

## Setup

Requires Node.js 20+.

```bash
npm install
```

## Commands

| Command | Purpose |
|---|---|
| `npm test` | Run Vitest unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` / `npm run typecheck` | TypeScript strict type check |
| `npm run build` | Compile to `dist/` |
| `npm run dev -- <args>` | Run the CLI directly from source |
| `npm start -- <args>` | Build, then run the compiled CLI |

## CLI usage

Data is saved to `data/expenses.json` (override with the `EXPENSE_FILE` env var).

```bash
npm run dev -- add 19.99 food 2026-11-05 lunch with team
npm run dev -- add 850 rent 2026-11-01 --currency USD
npm run dev -- list --category food --from 2026-11-01 --to 2026-11-30
npm run dev -- summary 2026-11 --limit 1000
npm run dev -- delete <id>
```

## Structure

```
src/types.ts        Shared types
src/validation.ts   Input validation and normalization
src/calculator.ts   Filtering, totals, breakdown, budget status (pure functions)
src/storage.ts      Storage interface, in-memory and JSON-file implementations
src/store.ts        ExpenseStore: add/list/remove with persistence
src/cli.ts          Thin command-line entry point
tests/              Vitest unit tests
```

## Design notes and known limitations

- A calculation never mixes currencies; mixed currencies throw `MixedCurrencyError`.
- Budget warning threshold is 80% of the limit.
- `JsonFileStorage` is not safe for concurrent writers (single-user, single-process design).
- The CLI treats the month range as `01`-`31`; the calculator itself filters by exact date.
