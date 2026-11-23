/** A stored expense. Amounts are integer cents to avoid floating-point errors. */
export interface Expense {
  id: string;
  amountCents: number;
  category: string;
  currency: string;
  note: string;
  date: string; // YYYY-MM-DD
}

/** Raw (untrusted) input for a new expense. Amount is in major units, e.g. 19.99. */
export interface NewExpenseInput {
  amount: number;
  category: string;
  date: string;
  currency?: string;
  note?: string;
}

export interface ExpenseFilter {
  category?: string;
  from?: string; // inclusive, YYYY-MM-DD
  to?: string; // inclusive, YYYY-MM-DD
}

export interface Budget {
  monthlyLimitCents?: number;
  categoryCapsCents?: Record<string, number>;
}

export type BudgetState = "unset" | "ok" | "warning" | "exceeded";

export interface CategoryTotal {
  category: string;
  totalCents: number;
  count: number;
}

export interface CategoryBudgetStatus {
  category: string;
  spentCents: number;
  capCents: number;
  remainingCents: number;
  state: BudgetState;
}

export interface BudgetStatus {
  month: string;
  currency: string | undefined;
  totalCents: number;
  monthlyLimitCents: number | undefined;
  remainingCents: number | undefined;
  state: BudgetState;
  categories: CategoryBudgetStatus[];
}
