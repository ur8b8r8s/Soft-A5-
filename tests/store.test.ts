import { describe, expect, it } from "vitest";
import { InMemoryStorage, type ExpenseStorage } from "../src/storage.js";
import { ExpenseStore } from "../src/store.js";
import { ValidationError } from "../src/validation.js";

const input = { amount: 20, category: "food", date: "2026-11-10" };

describe("ExpenseStore", () => {
  it("adds, lists and deletes expenses", () => {
    const store = new ExpenseStore(new InMemoryStorage());
    const a = store.add(input);
    store.add({ ...input, category: "rent", date: "2026-11-01" });

    expect(store.list().map((e) => e.category)).toEqual(["rent", "food"]); // date order
    expect(store.list({ category: "food" })).toHaveLength(1);
    expect(store.remove(a.id)).toBe(true);
    expect(store.remove(a.id)).toBe(false);
    expect(store.list()).toHaveLength(1);
  });

  it("persists changes and reloads them", () => {
    const storage = new InMemoryStorage();
    new ExpenseStore(storage).add(input);
    expect(new ExpenseStore(storage).list()).toHaveLength(1);
  });

  it("does not store invalid expenses", () => {
    const storage = new InMemoryStorage();
    const store = new ExpenseStore(storage);
    expect(() => store.add({ ...input, amount: -1 })).toThrow(ValidationError);
    expect(() => store.add({ ...input, category: " " })).toThrow(ValidationError);
    expect(storage.load()).toHaveLength(0);
  });

  it("keeps state unchanged when saving fails", () => {
    const failing: ExpenseStorage = {
      load: () => [],
      save: () => {
        throw new Error("disk full");
      },
    };
    const store = new ExpenseStore(failing);
    expect(() => store.add(input)).toThrow("disk full");
    expect(store.list()).toHaveLength(0);
  });

  it("returns copies so callers cannot mutate internal state", () => {
    const store = new ExpenseStore(new InMemoryStorage());
    store.add(input);
    store.list()[0]!.amountCents = 1;
    expect(store.list()[0]!.amountCents).toBe(2000);
  });
});
