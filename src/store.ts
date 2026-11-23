import { randomUUID } from "node:crypto";
import { filterExpenses } from "./calculator.js";
import type { ExpenseStorage } from "./storage.js";
import type { Expense, ExpenseFilter, NewExpenseInput } from "./types.js";
import { buildExpense } from "./validation.js";

export class ExpenseStore {
  private expenses: Expense[];

  constructor(private readonly storage: ExpenseStorage) {
    this.expenses = storage.load();
  }

  add(input: NewExpenseInput): Expense {
    const expense = buildExpense(input, randomUUID());
    this.commit([...this.expenses, expense]);
    return { ...expense };
  }

  /** Lists matching expenses ordered by date (stable for equal dates). */
  list(filter: ExpenseFilter = {}): Expense[] {
    return filterExpenses(this.expenses, filter)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ ...e }));
  }

  remove(id: string): boolean {
    if (!this.expenses.some((e) => e.id === id)) return false;
    this.commit(this.expenses.filter((e) => e.id !== id));
    return true;
  }

  /** Persist first, then update memory, so a failed save leaves state unchanged. */
  private commit(next: Expense[]): void {
    this.storage.save(next);
    this.expenses = next;
  }
}
