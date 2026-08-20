import { describe, expect, it } from "vitest";

import {
  CompatibilityImportError,
  importCompatibilitiesFromCsv,
  validateCompatibilityCsv,
  type CompatibilityImportDb,
} from "./compatibility-import";

const VALID_HEADER = "product_id,maker,model,series,note";
const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

describe("validateCompatibilityCsv", () => {
  it("accepts a valid row", () => {
    const result = validateCompatibilityCsv(
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,18インチ対応`,
    );
    expect(result.ok).toBe(true);
  });

  it("reports missing required fields", () => {
    const result = validateCompatibilityCsv(`${VALID_HEADER}\n${PRODUCT_ID},Toyota,,90 Series,`);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid product_id", () => {
    const result = validateCompatibilityCsv(`${VALID_HEADER}\nnot-a-uuid,Toyota,Voxy,90 Series,`);
    expect(result.ok).toBe(false);
  });
});

describe("importCompatibilitiesFromCsv", () => {
  it("inserts rows when product_id exists", async () => {
    const inserted: string[] = [];
    const db: CompatibilityImportDb = {
      findExistingProductIds: async () => new Set([PRODUCT_ID]),
      transaction: async (fn) =>
        fn({
          insertCompatibility: async (values) => {
            inserted.push(values.productId);
          },
        }),
    };

    const result = await importCompatibilitiesFromCsv(
      db,
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,note`,
    );

    expect(result.insertedCount).toBe(1);
    expect(inserted).toEqual([PRODUCT_ID]);
  });

  it("throws when product_id does not exist", async () => {
    const db: CompatibilityImportDb = {
      findExistingProductIds: async () => new Set(),
      transaction: async (fn) =>
        fn({
          insertCompatibility: async () => undefined,
        }),
    };

    await expect(
      importCompatibilitiesFromCsv(
        db,
        `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,note`,
      ),
    ).rejects.toBeInstanceOf(CompatibilityImportError);
  });

  it("does not insert when validation fails", async () => {
    let inserted = false;
    const db: CompatibilityImportDb = {
      findExistingProductIds: async () => new Set([PRODUCT_ID]),
      transaction: async (fn) => {
        inserted = true;
        return fn({
          insertCompatibility: async () => undefined,
        });
      },
    };

    await expect(
      importCompatibilitiesFromCsv(db, `${VALID_HEADER}\n${PRODUCT_ID},Toyota,,90 Series,`),
    ).rejects.toBeInstanceOf(CompatibilityImportError);
    expect(inserted).toBe(false);
  });
});
