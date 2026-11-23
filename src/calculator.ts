import type {
  Budget,
  BudgetState,
  BudgetStatus,
  CategoryBudgetStatus,
  CategoryTotal,
  Expense,
  ExpenseFilter,
} from "./types.js";
import {
  ValidationError,
  normalizeCategory,
  validateBudget,
  validateDate,
  validateMonth,
} from "./validation.js";

export const WARNING_THRESHOLD_PERCENT = 80;

export class MixedCurrencyError extends Error {
  constructor(currencies: string[]) {
    super(`Cannot combine multiple currencies: ${currencies.join(", ")}.`);
    this.name = "MixedCurrencyError";
  }
}

export function filterExpenses(
  expenses: readonly Expense[],
  filter: ExpenseFilter = {},
): Expense[] {
  const category = filter.category === undefined ? undefined : normalizeCategory(filter.category);
  const from = filter.from === undefined ? undefined : validateDate(filter.from);
  const to = filter.to === undefined ? undefined : validateDate(filter.to);
  if (from !== undefined && to !== undefined && from > to) {
    throw new ValidationError('"from" date must not be after "to" date.');
  }
  return expenses.filter(
    (e) =>
      (category === undefined || e.category === category) &&
      (from === undefined || e.date >= from) &&
      (to === undefined || e.date <= to),
  );
}

/** Returns the single currency in use, or undefined if empty. Throws if mixed. */
export function currencyOf(expenses: readonly Expense[]): string | undefined {
  const currencies = [...new Set(expenses.map((e) => e.currency))];
  if (currencies.length > 1) throw new MixedCurrencyError(currencies);
  return currencies[0];
}

export function totalCents(expenses: readonly Expense[]): number {
  currencyOf(expenses);
  return expenses.reduce((sum, e) => sum + e.amountCents, 0);
}

export function breakdownByCategory(expenses: readonly Expense[]): CategoryTotal[] {
  currencyOf(expenses);
  const map = new Map<string, CategoryTotal>();
  for (const e of expenses) {
    const entry = map.get(e.category) ?? { category: e.category, totalCents: 0, count: 0 };
    entry.totalCents += e.amountCents;
    entry.count += 1;
    map.set(e.category, entry);
  }
  return [...map.values()].sort(
    (a, b) => b.totalCents - a.totalCents || a.category.localeCompare(b.category),
  );
}

function stateFor(spentCents: number, limitCents: number): BudgetState {
  if (spentCents > limitCents) return "exceeded";
  if (spentCents * 100 >= limitCents * WARNING_THRESHOLD_PERCENT) return "warning";
  return "ok";
}

/** Budget status for one calendar month (YYYY-MM). */
export function budgetStatus(
  expenses: readonly Expense[],
  budget: Budget,
  month: string,
): BudgetStatus {
  const validMonth = validateMonth(month);
  const checked = validateBudget(budget);
  const inMonth = expenses.filter((e) => e.date.startsWith(`${validMonth}-`));
  const currency = currencyOf(inMonth);
  const total = totalCents(inMonth);
  const spentByCategory = new Map(
    breakdownByCategory(inMonth).map((c) => [c.category, c.totalCents]),
  );

  const categories: CategoryBudgetStatus[] = Object.entries(checked.categoryCapsCents ?? {})
    .map(([category, capCents]) => {
      const spentCents = spentByCategory.get(category) ?? 0;
      return {
        category,
        spentCents,
        capCents,
        remainingCents: capCents - spentCents,
        state: stateFor(spentCents, capCents),
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));

  const limit = checked.monthlyLimitCents;
  return {
    month: validMonth,
    currency,
    totalCents: total,
    monthlyLimitCents: limit,
    remainingCents: limit === undefined ? undefined : limit - total,
    state: limit === undefined ? "unset" : stateFor(total, limit),
    categories,
  };
}

export function formatMoney(cents: number, currency = "USD"): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}
