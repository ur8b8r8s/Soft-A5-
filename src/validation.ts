import type { Budget, Expense, NewExpenseInput } from "./types.js";

export const MAX_AMOUNT = 1_000_000_000;
export const MAX_CATEGORY_LENGTH = 50;
export const MAX_NOTE_LENGTH = 200;
export const DEFAULT_CURRENCY = "USD";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Converts a major-unit amount (19.99) to integer cents (1999), rejecting bad input. */
export function toCents(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new ValidationError("Amount must be a finite number.");
  }
  if (amount <= 0) {
    throw new ValidationError("Amount must be greater than zero.");
  }
  if (amount > MAX_AMOUNT) {
    throw new ValidationError(`Amount must not exceed ${MAX_AMOUNT}.`);
  }
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 1e-6) {
    throw new ValidationError("Amount must have at most 2 decimal places.");
  }
  return cents;
}

export function normalizeCategory(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("Category must be a string.");
  }
  const category = value.trim().toLowerCase();
  if (category.length === 0) {
    throw new ValidationError("Category must not be empty.");
  }
  if (category.length > MAX_CATEGORY_LENGTH) {
    throw new ValidationError(`Category must be at most ${MAX_CATEGORY_LENGTH} characters.`);
  }
  return category;
}

export function normalizeCurrency(value: unknown = DEFAULT_CURRENCY): string {
  if (typeof value !== "string") {
    throw new ValidationError("Currency must be a string.");
  }
  const currency = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new ValidationError("Currency must be a 3-letter code such as USD.");
  }
  return currency;
}

export function normalizeNote(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value !== "string") {
    throw new ValidationError("Note must be a string.");
  }
  const note = value.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    throw new ValidationError(`Note must be at most ${MAX_NOTE_LENGTH} characters.`);
  }
  return note;
}

/** Accepts only real calendar dates in YYYY-MM-DD form. */
export function validateDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError("Date must be in YYYY-MM-DD format.");
  }
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    throw new ValidationError(`"${value}" is not a real calendar date.`);
  }
  return value;
}

export function validateMonth(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new ValidationError("Month must be in YYYY-MM format.");
  }
  return value;
}

export function validateLimitCents(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${label} must be a positive integer number of cents.`);
  }
  return value;
}

export function validateBudget(budget: Budget): Budget {
  const result: Budget = {};
  if (budget.monthlyLimitCents !== undefined) {
    result.monthlyLimitCents = validateLimitCents(budget.monthlyLimitCents, "Monthly limit");
  }
  if (budget.categoryCapsCents !== undefined) {
    const caps: Record<string, number> = {};
    for (const [category, cap] of Object.entries(budget.categoryCapsCents)) {
      caps[normalizeCategory(category)] = validateLimitCents(cap, `Cap for "${category}"`);
    }
    result.categoryCapsCents = caps;
  }
  return result;
}

/** Validates user input and builds an Expense with the given id. */
export function buildExpense(input: NewExpenseInput, id: string): Expense {
  return {
    id,
    amountCents: toCents(input.amount),
    category: normalizeCategory(input.category),
    currency: normalizeCurrency(input.currency),
    note: normalizeNote(input.note),
    date: validateDate(input.date),
  };
}

/** Re-validates an untrusted object read back from storage. */
export function validateStoredExpense(raw: unknown): Expense {
  if (typeof raw !== "object" || raw === null) {
    throw new ValidationError("Stored expense must be an object.");
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || r.id.length === 0) {
    throw new ValidationError("Stored expense has an invalid id.");
  }
  if (
    typeof r.amountCents !== "number" ||
    !Number.isInteger(r.amountCents) ||
    r.amountCents <= 0 ||
    r.amountCents > MAX_AMOUNT * 100
  ) {
    throw new ValidationError("Stored expense has an invalid amount.");
  }
  return {
    id: r.id,
    amountCents: r.amountCents,
    category: normalizeCategory(r.category),
    currency: normalizeCurrency(r.currency),
    note: normalizeNote(r.note),
    date: validateDate(r.date),
  };
}
