import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Expense } from "./types.js";
import { validateStoredExpense } from "./validation.js";

export interface ExpenseStorage {
  load(): Expense[];
  save(expenses: readonly Expense[]): void;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class InMemoryStorage implements ExpenseStorage {
  private data: Expense[] = [];

  load(): Expense[] {
    return this.data.map((e) => ({ ...e }));
  }

  save(expenses: readonly Expense[]): void {
    this.data = expenses.map((e) => ({ ...e }));
  }
}

/** Stores expenses as a JSON array in a local file. Contents are re-validated on load. */
export class JsonFileStorage implements ExpenseStorage {
  constructor(private readonly filePath: string) {}

  load(): Expense[] {
    if (!existsSync(this.filePath)) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(this.filePath, "utf8"));
    } catch {
      throw new StorageError(`Could not parse JSON in ${this.filePath}.`);
    }
    if (!Array.isArray(parsed)) {
      throw new StorageError(`Expected a JSON array in ${this.filePath}.`);
    }
    try {
      return parsed.map(validateStoredExpense);
    } catch (err) {
      throw new StorageError(`Invalid data in ${this.filePath}: ${(err as Error).message}`);
    }
  }

  save(expenses: readonly Expense[]): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(expenses, null, 2), "utf8");
    renameSync(tmp, this.filePath); // atomic replace avoids half-written files
  }
}
