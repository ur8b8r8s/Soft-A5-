import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonFileStorage, StorageError } from "../src/storage.js";
import { make } from "./helpers.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "expenses-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("JsonFileStorage", () => {
  it("returns an empty list when the file does not exist", () => {
    expect(new JsonFileStorage(join(dir, "none.json")).load()).toEqual([]);
  });

  it("round-trips expenses, creating folders as needed", () => {
    const storage = new JsonFileStorage(join(dir, "nested", "data.json"));
    const items = [make(12.34, "food", "2026-11-01")];
    storage.save(items);
    expect(storage.load()).toEqual(items);
  });

  it("throws StorageError on corrupted JSON", () => {
    const file = join(dir, "bad.json");
    writeFileSync(file, "{not json");
    expect(() => new JsonFileStorage(file).load()).toThrow(StorageError);
  });

  it("throws StorageError on structurally invalid records", () => {
    const file = join(dir, "invalid.json");
    writeFileSync(file, JSON.stringify([{ id: "a", amountCents: -5 }]));
    expect(() => new JsonFileStorage(file).load()).toThrow(StorageError);
  });
});
