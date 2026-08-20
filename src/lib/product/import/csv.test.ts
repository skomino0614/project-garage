import { describe, expect, it } from "vitest";

import { parseCsv, rowToRecord } from "./csv";

describe("csv parser", () => {
  it("parses quoted fields with commas", () => {
    const parsed = parseCsv('name,description\n"Wheel, 18 inch","High quality, durable"');
    expect(parsed.headers).toEqual(["name", "description"]);
    expect(parsed.rows[0]?.values).toEqual(["Wheel, 18 inch", "High quality, durable"]);
  });

  it("ignores empty lines", () => {
    const parsed = parseCsv("category,name\n\nホイール,Test\n\n");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.lineNumber).toBe(3);
  });

  it("supports UTF-8 BOM", () => {
    const parsed = parseCsv("\uFEFFcategory,name\nホイール,テスト商品");
    expect(parsed.headers[0]).toBe("category");
    expect(parsed.rows[0]?.values[0]).toBe("ホイール");
  });
});

describe("rowToRecord", () => {
  it("maps headers to values", () => {
    const record = rowToRecord(["category", "name"], { lineNumber: 2, values: ["ホイール", "Test"] });
    expect(record).toEqual({ category: "ホイール", name: "Test" });
  });
});
