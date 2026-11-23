import { describe, expect, it } from "vitest";
import {
  MixedCurrencyError,
  breakdownByCategory,
  budgetStatus,
  expensesInMonth,
  filterExpenses,
  formatMoney,
  totalCents,
} from "../src/calculator.js";
import { ValidationError } from "../src/validation.js";
import { make } from "./helpers.js";

describe("totals and breakdown", () => {
  it("sums exactly without floating-point drift", () => {
    expect(totalCents([make(0.1, "a", "2026-11-01"), make(0.2, "a", "2026-11-01")])).toBe(30);
  });

  it("returns 0 for an empty list", () => {
    expect(totalCents([])).toBe(0);
  });

  it("groups by category, largest first", () => {
    const result = breakdownByCategory([
      make(10, "food", "2026-11-01"),
      make(50, "rent", "2026-11-02"),
      make(5, "food", "2026-11-03"),
    ]);
    expect(result).toEqual([
      { category: "rent", totalCents: 5000, count: 1 },
      { category: "food", totalCents: 1500, count: 2 },
    ]);
  });

  it("refuses to add different currencies", () => {
    expect(() => totalCents([make(1, "a", "2026-11-01", "USD"), make(1, "a", "2026-11-01", "EUR")])).toThrow(
      MixedCurrencyError,
    );
  });
});

describe("filterExpenses", () => {
  const data = [
    make(1, "food", "2026-11-01"),
    make(2, "food", "2026-11-15"),
    make(3, "rent", "2026-11-30"),
  ];

  it("filters by category (case-insensitive)", () => {
    expect(filterExpenses(data, { category: "FOOD" })).toHaveLength(2);
  });

  it("treats date range bounds as inclusive", () => {
    expect(filterExpenses(data, { from: "2026-11-15", to: "2026-11-30" })).toHaveLength(2);
  });

  it("rejects an inverted range", () => {
    expect(() => filterExpenses(data, { from: "2026-12-01", to: "2026-11-01" })).toThrow(ValidationError);
  });
});

describe("budgetStatus", () => {
  const data = [
    make(300, "food", "2026-11-05"),
    make(150, "rent", "2026-11-01"),
    make(999, "food", "2026-10-30"), // other month, must be ignored
  ];

  it("reports ok under 80% of the limit", () => {
    const s = budgetStatus(data, { monthlyLimitCents: 100_000 }, "2026-11");
    expect(s.totalCents).toBe(45_000);
    expect(s.state).toBe("ok");
    expect(s.remainingCents).toBe(55_000);
  });

  it("reports warning at 80% or more and exceeded above the limit", () => {
    expect(budgetStatus(data, { monthlyLimitCents: 50_000 }, "2026-11").state).toBe("warning");
    expect(budgetStatus(data, { monthlyLimitCents: 40_000 }, "2026-11").state).toBe("exceeded");
  });

  it("tracks category caps", () => {
    const s = budgetStatus(data, { categoryCapsCents: { Food: 20_000 } }, "2026-11");
    expect(s.state).toBe("unset");
    expect(s.categories[0]).toMatchObject({ category: "food", spentCents: 30_000, remainingCents: -10_000, state: "exceeded" });
  });

  it("rejects invalid months and limits", () => {
    expect(() => budgetStatus(data, {}, "2026-13")).toThrow(ValidationError);
    expect(() => budgetStatus(data, { monthlyLimitCents: -5 }, "2026-11")).toThrow(ValidationError);
  });
});

describe("expensesInMonth", () => {
  const data = [
    make(1, "food", "2026-02-27"),
    make(2, "food", "2026-02-28"),
    make(4, "rent", "2026-04-30"),
    make(8, "food", "2026-03-01"),
    make(16, "food", "2027-02-01"), // same month number, different year
  ];

  it("selects February without constructing day 31", () => {
    const result = expensesInMonth(data, "2026-02");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.date.startsWith("2026-02-"))).toBe(true);
  });

  it("selects a 30-day month", () => {
    const result = expensesInMonth(data, "2026-04");
    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe("2026-04-30");
  });

  it("excludes expenses outside the selected month", () => {
    expect(expensesInMonth(data, "2026-03")).toHaveLength(1);
    expect(expensesInMonth(data, "2027-02")).toHaveLength(1);
    expect(expensesInMonth([], "2026-02")).toHaveLength(0);
  });

  it("rejects invalid month input", () => {
    expect(() => expensesInMonth(data, "2026-13")).toThrow(ValidationError);
    expect(() => expensesInMonth(data, "2026-02-31")).toThrow(ValidationError);
    expect(() => expensesInMonth(data, "not-a-month")).toThrow(ValidationError);
  });
});

describe("formatMoney", () => {
  it("formats cents with currency", () => {
    expect(formatMoney(1999, "EUR")).toBe("19.99 EUR");
  });
});
