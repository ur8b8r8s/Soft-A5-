import { describe, expect, it } from "vitest";
import {
  ValidationError,
  buildExpense,
  normalizeCategory,
  normalizeCurrency,
  toCents,
  validateDate,
  validateStoredExpense,
} from "../src/validation.js";

describe("toCents", () => {
  it("converts valid amounts to integer cents", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.01)).toBe(1);
    expect(toCents(100)).toBe(10000);
  });

  it.each([0, -5, NaN, Infinity, 1.005, 2_000_000_000])("rejects %s", (bad) => {
    expect(() => toCents(bad)).toThrow(ValidationError);
  });

  it("rejects non-number input", () => {
    expect(() => toCents("12" as unknown)).toThrow(ValidationError);
  });
});

describe("category and currency", () => {
  it("trims and lowercases categories", () => {
    expect(normalizeCategory("  Food ")).toBe("food");
  });

  it("rejects empty or whitespace-only categories", () => {
    expect(() => normalizeCategory("   ")).toThrow(ValidationError);
  });

  it("uppercases currency, defaults to USD, rejects bad codes", () => {
    expect(normalizeCurrency("eur")).toBe("EUR");
    expect(normalizeCurrency(undefined)).toBe("USD");
    expect(() => normalizeCurrency("EURO")).toThrow(ValidationError);
  });
});

describe("validateDate", () => {
  it("accepts real dates including leap days", () => {
    expect(validateDate("2026-02-28")).toBe("2026-02-28");
    expect(validateDate("2028-02-29")).toBe("2028-02-29");
  });

  it.each(["2026-02-30", "2026-13-01", "26-01-01", "2026/01/01", ""])("rejects %s", (bad) => {
    expect(() => validateDate(bad)).toThrow(ValidationError);
  });
});

describe("buildExpense / validateStoredExpense", () => {
  it("builds a normalized expense", () => {
    const e = buildExpense({ amount: 12.5, category: " Travel ", date: "2026-11-01", note: " taxi " }, "x");
    expect(e).toEqual({
      id: "x",
      amountCents: 1250,
      category: "travel",
      currency: "USD",
      note: "taxi",
      date: "2026-11-01",
    });
  });

  it("rejects tampered stored data", () => {
    expect(() => validateStoredExpense(null)).toThrow(ValidationError);
    expect(() =>
      validateStoredExpense({ id: "a", amountCents: -1, category: "x", currency: "USD", date: "2026-01-01" }),
    ).toThrow(ValidationError);
    expect(() =>
      validateStoredExpense({ id: "a", amountCents: 1.5, category: "x", currency: "USD", date: "2026-01-01" }),
    ).toThrow(ValidationError);
  });
});
