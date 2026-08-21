import { describe, expect, it } from "vitest";

import {
  CompatibilityImportError,
  importCompatibilitiesFromCsv,
  toCompatibilityInsertValues,
  validateCompatibilityCsv,
  type CompatibilityImportDb,
} from "./compatibility-import";

const VALID_HEADER = "product_id,maker,model,series,note,fitment_type";
const LEGACY_HEADER = "product_id,maker,model,series,note";
const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

describe("validateCompatibilityCsv", () => {
  it("accepts a valid row", () => {
    const result = validateCompatibilityCsv(
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,18インチ対応,reference`,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts legacy CSV without fitment_type column", () => {
    const result = validateCompatibilityCsv(
      `${LEGACY_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,18インチ対応`,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.fitment_type).toBeUndefined();
    }
  });

  it("accepts empty fitment_type as omitted", () => {
    const result = validateCompatibilityCsv(
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,18インチ対応,`,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.fitment_type).toBeUndefined();
    }
  });

  it("accepts confirmed fitment_type", () => {
    const result = validateCompatibilityCsv(
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,,confirmed`,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.fitment_type).toBe("confirmed");
    }
  });

  it("rejects invalid fitment_type", () => {
    const result = validateCompatibilityCsv(
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,,invalid`,
    );
    expect(result.ok).toBe(false);
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
    const inserted: Array<{ productId: string; fitmentType: string | null }> = [];
    const db: CompatibilityImportDb = {
      findExistingProductIds: async () => new Set([PRODUCT_ID]),
      transaction: async (fn) =>
        fn({
          insertCompatibility: async (values) => {
            inserted.push({
              productId: values.productId,
              fitmentType: values.fitmentType,
            });
          },
        }),
    };

    const result = await importCompatibilitiesFromCsv(
      db,
      `${VALID_HEADER}\n${PRODUCT_ID},Toyota,Voxy,90 Series,note,reference`,
    );

    expect(result.insertedCount).toBe(1);
    expect(inserted).toEqual([{ productId: PRODUCT_ID, fitmentType: "reference" }]);
  });

  it("stores null fitment_type when column is omitted", () => {
    const values = toCompatibilityInsertValues({
      lineNumber: 2,
      row: {
        product_id: PRODUCT_ID,
        maker: "Toyota",
        model: "Voxy",
        series: "90 Series",
      },
    });

    expect(values.fitmentType).toBeNull();
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
