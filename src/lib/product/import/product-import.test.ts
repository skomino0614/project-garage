import { describe, expect, it } from "vitest";

import {
  importProductsFromCsv,
  importProductsFromValidatedRows,
  parseTags,
  PRODUCT_IMPORT_MODE,
  ProductImportError,
  validateProductCsv,
  type ProductImportDb,
} from "./product-import";

const VALID_HEADER =
  "category,name,brand,price_min_yen,price_max_yen,description,image_url,product_url,purchase_url,appearance,comfort,practicality,resale,style,tags";

function csvBody(...rows: string[]): string {
  return [VALID_HEADER, ...rows].join("\n");
}

describe("validateProductCsv", () => {
  it("accepts a valid CSV row", () => {
    const result = validateProductCsv(
      csvBody("ホイール,Test Wheel,Brand A,150000,180000,,,,,,,,,高級感,18インチ"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.name).toBe("Test Wheel");
      expect(result.rows[0]?.tags).toEqual(["18インチ"]);
    }
  });

  it("accepts Japanese content", () => {
    const result = validateProductCsv(
      csvBody('ホイール,ヴォクシー向けホイール,ブランドA,150000,180000,説明文,,,,,,,,高級感,"18インチ,純正風"'),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts quoted CSV fields", () => {
    const result = validateProductCsv(
      csvBody('"ホイール","Wheel, 18","Brand, Inc.",150000,180000,"説明, 詳細",,,,,,,,高級感,"tag1,tag2"'),
    );
    expect(result.ok).toBe(true);
  });

  it("ignores empty lines", () => {
    const result = validateProductCsv(`${VALID_HEADER}\n\nホイール,Test,Brand,100000,120000\n`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
    }
  });

  it("reports missing required fields", () => {
    const result = validateProductCsv("category,name,brand,price_min_yen,price_max_yen\nホイール,,Brand,100000,120000");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.lineNumber).toBe(2);
    }
  });

  it("rejects invalid category", () => {
    const result = validateProductCsv(csvBody("存在しない,Test,Brand,100000,120000"));
    expect(result.ok).toBe(false);
  });

  it("rejects non-positive price_min_yen", () => {
    const result = validateProductCsv(csvBody("ホイール,Test,Brand,0,120000"));
    expect(result.ok).toBe(false);
  });

  it("rejects price_min greater than price_max", () => {
    const result = validateProductCsv(csvBody("ホイール,Test,Brand,200000,100000"));
    expect(result.ok).toBe(false);
  });

  it("normalizes invalid image_url to null instead of failing import", () => {
    const result = validateProductCsv(
      csvBody("ホイール,Test,Brand,100000,120000,,javascript:alert(1),,,"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.image_url).toBeNull();
    }
  });

  it("normalizes placeholder image_url to null", () => {
    const result = validateProductCsv(
      csvBody("ホイール,Test,Brand,100000,120000,,https://example.com/images/daytona.jpg,,,"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.image_url).toBeNull();
    }
  });

  it("rejects invalid product_url", () => {
    const result = validateProductCsv(
      csvBody("ホイール,Test,Brand,100000,120000,,,javascript:alert(1),,,"),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects invalid appearance values", () => {
    const result = validateProductCsv(csvBody("ホイール,Test,Brand,100000,120000,,,,,invalid,,,,"));
    expect(result.ok).toBe(false);
  });

  it("normalizes empty URLs to null", () => {
    const result = validateProductCsv(
      csvBody("ホイール,Test,Brand,100000,120000,, , , ,,,,,,"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.row.image_url).toBeNull();
      expect(result.rows[0]?.row.product_url).toBeNull();
      expect(result.rows[0]?.row.purchase_url).toBeNull();
    }
  });

  it("accepts https URLs", () => {
    const result = validateProductCsv(
      csvBody(
        "ホイール,Test,Brand,100000,120000,,https://img.example.com/a.jpg,https://example.com/p,https://shop.example.com/buy,,,,,高級感,",
      ),
    );
    expect(result.ok).toBe(true);
  });
});

describe("parseTags", () => {
  it("parses comma-separated tags", () => {
    expect(parseTags("18インチ, メッシュ")).toEqual(["18インチ", "メッシュ"]);
  });

  it("parses JSON array tags", () => {
    expect(parseTags('["18インチ","メッシュ"]')).toEqual(["18インチ", "メッシュ"]);
  });
});

describe("importProductsFromCsv", () => {
  const PRODUCT_URL = "https://example.com/products/wheel-a";
  const EXISTING_ID = "22222222-2222-4222-8222-222222222222";

  function createMockDb(handlers: {
    insertProduct?: ProductImportDb["transaction"] extends (
      fn: infer Tx,
    ) => unknown
      ? Tx extends (tx: infer T) => unknown
        ? T extends { insertProduct: infer I }
          ? I
          : never
        : never
      : never;
    findProductIdByProductUrl?: (url: string) => Promise<string | null>;
    updateProductById?: (productId: string, values: unknown) => Promise<void>;
  }) {
    return {
      transaction: async (fn: (tx: {
        insertProduct: (values: unknown) => Promise<{ id: string }>;
        findProductIdByProductUrl: (url: string) => Promise<string | null>;
        updateProductById: (productId: string, values: unknown) => Promise<void>;
      }) => Promise<void>) =>
        fn({
          insertProduct:
            handlers.insertProduct ??
            (async () => ({ id: "11111111-1111-4111-8111-111111111111" })),
          findProductIdByProductUrl:
            handlers.findProductIdByProductUrl ?? (async () => null),
          updateProductById: handlers.updateProductById ?? (async () => undefined),
        }),
    } satisfies ProductImportDb;
  }

  it("uses upsert-by-product-url mode", async () => {
    const inserts: Array<{ isDemo: boolean; name: string }> = [];
    const db = createMockDb({
      insertProduct: async (values) => {
        inserts.push({ isDemo: values.isDemo, name: values.name });
        return { id: "11111111-1111-4111-8111-111111111111" };
      },
    });

    const result = await importProductsFromCsv(
      db,
      csvBody("ホイール,Real Wheel,Brand A,150000,180000,,,,,,,,,高級感,"),
    );

    expect(result.mode).toBe(PRODUCT_IMPORT_MODE);
    expect(result.insertedCount).toBe(1);
    expect(result.updatedCount).toBe(0);
    expect(inserts[0]?.isDemo).toBe(false);
  });

  it("updates existing product when product_url matches", async () => {
    const inserts: unknown[] = [];
    const updates: Array<{ productId: string; name: string }> = [];
    const db = createMockDb({
      findProductIdByProductUrl: async (url) =>
        url === PRODUCT_URL ? EXISTING_ID : null,
      insertProduct: async (values) => {
        inserts.push(values);
        return { id: "11111111-1111-4111-8111-111111111111" };
      },
      updateProductById: async (productId, values) => {
        updates.push({ productId, name: (values as { name: string }).name });
      },
    });

    const result = await importProductsFromCsv(
      db,
      csvBody(
        `ホイール,Updated Wheel,Brand A,150000,180000,,,${PRODUCT_URL},,,,,,高級感,`,
      ),
    );

    expect(result.insertedCount).toBe(0);
    expect(result.updatedCount).toBe(1);
    expect(result.productIds).toEqual([EXISTING_ID]);
    expect(inserts).toHaveLength(0);
    expect(updates).toEqual([{ productId: EXISTING_ID, name: "Updated Wheel" }]);
  });

  it("inserts duplicate-looking rows when product_url is null", async () => {
    let insertCount = 0;
    const db = createMockDb({
      insertProduct: async () => {
        insertCount += 1;
        return { id: `11111111-1111-4111-8111-11111111111${insertCount}` };
      },
    });

    const result = await importProductsFromCsv(
      db,
      csvBody(
        "ホイール,Wheel One,Brand,150000,180000,,,,,,,,,高級感,",
        "ホイール,Wheel Two,Brand,150000,180000,,,,,,,,,高級感,",
      ),
    );

    expect(result.insertedCount).toBe(2);
    expect(result.updatedCount).toBe(0);
    expect(insertCount).toBe(2);
  });

  it("throws ProductImportError without inserting when validation fails", async () => {
    let inserted = false;
    const db = createMockDb({
      insertProduct: async () => {
        inserted = true;
        return { id: "11111111-1111-4111-8111-111111111111" };
      },
    });

    await expect(
      importProductsFromCsv(db, csvBody("ホイール,Bad,Brand,200000,100000")),
    ).rejects.toBeInstanceOf(ProductImportError);
    expect(inserted).toBe(false);
  });

  it("rolls back the transaction when a later insert fails", async () => {
    let insertCount = 0;
    const db = createMockDb({
      insertProduct: async () => {
        insertCount += 1;
        if (insertCount === 2) {
          throw new Error("Simulated DB failure");
        }
        return { id: `11111111-1111-4111-8111-11111111111${insertCount}` };
      },
    });

    await expect(
      importProductsFromValidatedRows(db, [
        {
          lineNumber: 2,
          tags: [],
          row: {
            category: "ホイール",
            name: "One",
            brand: "Brand",
            price_min_yen: 100000,
            price_max_yen: 120000,
            description: undefined,
            image_url: null,
            product_url: null,
            purchase_url: null,
            appearance: "unknown",
            comfort: "unknown",
            practicality: "unknown",
            resale: "unknown",
            style: "高級感",
            tags: undefined,
          },
        },
        {
          lineNumber: 3,
          tags: [],
          row: {
            category: "ホイール",
            name: "Two",
            brand: "Brand",
            price_min_yen: 100000,
            price_max_yen: 120000,
            description: undefined,
            image_url: null,
            product_url: null,
            purchase_url: null,
            appearance: "unknown",
            comfort: "unknown",
            practicality: "unknown",
            resale: "unknown",
            style: "高級感",
            tags: undefined,
          },
        },
      ]),
    ).rejects.toThrow("Simulated DB failure");

    expect(insertCount).toBe(2);
  });
});
