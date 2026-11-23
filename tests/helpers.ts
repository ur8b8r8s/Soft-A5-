import { buildExpense } from "../src/validation.js";
import type { Expense } from "../src/types.js";

let counter = 0;

export function make(amount: number, category: string, date: string, currency = "USD"): Expense {
  counter += 1;
  return buildExpense({ amount, category, date, currency }, `id-${counter}`);
}
