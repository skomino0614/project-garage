import { z } from "zod";

import {
  PRIORITY_LEVELS,
  PRODUCT_CATEGORIES,
  PRODUCT_STYLES,
} from "@/lib/product/constants";
import { getSafeExternalUrl } from "@/lib/product/external-url";

import { parseCsv, rowToRecord } from "./csv";

export const PRODUCT_CSV_HEADERS = [
  "category",
  "name",
  "brand",
  "price_min_yen",
  "price_max_yen",
  "description",
  "image_url",
  "product_url",
  "purchase_url",
  "appearance",
  "comfort",
  "practicality",
  "resale",
  "style",
  "tags",
] as const;

const PriorityLevelSchema = z.enum(PRIORITY_LEVELS);
const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);
const ProductStyleSchema = z.enum(PRODUCT_STYLES);

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const optionalUrlSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) {
        return null;
      }
      const safe = getSafeExternalUrl(value);
      if (!safe) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL must use http or https",
        });
        return z.NEVER;
      }
      return safe;
    }),
);

const optionalPrioritySchema = z.preprocess(
  emptyToUndefined,
  PriorityLevelSchema.optional().default("unknown"),
);

const optionalStyleSchema = z.preprocess(
  emptyToUndefined,
  ProductStyleSchema.optional().default("その他"),
);

const yenSchema = z.coerce.number().int();

export const ProductCsvRowSchema = z
  .object({
    category: ProductCategorySchema,
    name: z.string().trim().min(1),
    brand: z.string().trim().min(1),
    price_min_yen: yenSchema,
    price_max_yen: yenSchema,
    description: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    image_url: optionalUrlSchema,
    product_url: optionalUrlSchema,
    purchase_url: optionalUrlSchema,
    appearance: optionalPrioritySchema,
    comfort: optionalPrioritySchema,
    practicality: optionalPrioritySchema,
    resale: optionalPrioritySchema,
    style: optionalStyleSchema,
    tags: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  })
  .superRefine((data, ctx) => {
    if (data.price_min_yen <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "price_min_yen must be greater than 0",
        path: ["price_min_yen"],
      });
    }

    if (data.price_max_yen < data.price_min_yen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "price_max_yen must be greater than or equal to price_min_yen",
        path: ["price_max_yen"],
      });
    }
  });

export type ProductCsvRow = z.infer<typeof ProductCsvRowSchema>;

export type ParsedProductImportRow = {
  lineNumber: number;
  row: ProductCsvRow;
  tags: string[];
};

export type ProductImportValidationError = {
  lineNumber: number;
  message: string;
};

export type ProductImportValidationResult =
  | { ok: true; rows: ParsedProductImportRow[] }
  | { ok: false; errors: ProductImportValidationError[] };

export function parseTags(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("tags JSON must be an array");
      }
      const tags = parsed.map((entry) => {
        if (typeof entry !== "string" || !entry.trim()) {
          throw new Error("tags JSON must contain non-empty strings");
        }
        return entry.trim();
      });
      return tags;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Invalid tags JSON array");
    }
  }

  return trimmed
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function validateHeader(headers: string[]): ProductImportValidationError | null {
  const required = ["category", "name", "brand", "price_min_yen", "price_max_yen"];
  const missing = required.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      lineNumber: 1,
      message: `Missing required CSV headers: ${missing.join(", ")}`,
    };
  }

  return null;
}

function validateRow(lineNumber: number, record: Record<string, string>): ProductImportValidationResult {
  const parsed = ProductCsvRowSchema.safeParse(record);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return {
      ok: false,
      errors: [{ lineNumber, message }],
    };
  }

  let tags: string[];
  try {
    tags = parseTags(record.tags);
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          lineNumber,
          message: error instanceof Error ? error.message : "Invalid tags",
        },
      ],
    };
  }

  return {
    ok: true,
    rows: [
      {
        lineNumber,
        row: parsed.data,
        tags,
      },
    ],
  };
}

export function validateProductCsv(text: string): ProductImportValidationResult {
  let parsedCsv;
  try {
    parsedCsv = parseCsv(text);
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          lineNumber: 1,
          message: error instanceof Error ? error.message : "Invalid CSV",
        },
      ],
    };
  }

  const headerError = validateHeader(parsedCsv.headers);
  if (headerError) {
    return { ok: false, errors: [headerError] };
  }

  const rows: ParsedProductImportRow[] = [];
  const errors: ProductImportValidationError[] = [];

  for (const csvRow of parsedCsv.rows) {
    let record: Record<string, string>;
    try {
      record = rowToRecord(parsedCsv.headers, csvRow);
    } catch (error) {
      errors.push({
        lineNumber: csvRow.lineNumber,
        message: error instanceof Error ? error.message : "Invalid CSV row",
      });
      continue;
    }

    const result = validateRow(csvRow.lineNumber, record);
    if (!result.ok) {
      errors.push(...result.errors);
      continue;
    }

    rows.push(...result.rows);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, rows };
}

export function toProductInsertValues(parsed: ParsedProductImportRow) {
  const { row, tags } = parsed;
  return {
    category: row.category,
    name: row.name,
    brand: row.brand,
    description: row.description ?? null,
    priceMinYen: row.price_min_yen,
    priceMaxYen: row.price_max_yen,
    imageUrl: row.image_url,
    productUrl: row.product_url,
    purchaseUrl: row.purchase_url,
    appearance: row.appearance,
    comfort: row.comfort,
    practicality: row.practicality,
    resale: row.resale,
    style: row.style,
    tags,
    isActive: true,
    isDemo: false,
  };
}

/** Phase 8-1 import is insert-only — no natural unique key exists on the current schema. */
export const PRODUCT_IMPORT_MODE = "insert-only" as const;

export type ProductImportDb = {
  transaction<T>(fn: (tx: ProductImportTx) => Promise<T>): Promise<T>;
};

export type ProductImportTx = {
  insertProduct: (values: ReturnType<typeof toProductInsertValues>) => Promise<{ id: string }>;
};

export type ProductImportResult = {
  mode: typeof PRODUCT_IMPORT_MODE;
  insertedCount: number;
  productIds: string[];
};

export async function importProductsFromValidatedRows(
  db: ProductImportDb,
  rows: ParsedProductImportRow[],
): Promise<ProductImportResult> {
  const productIds: string[] = [];

  await db.transaction(async (tx) => {
    for (const parsedRow of rows) {
      const inserted = await tx.insertProduct(toProductInsertValues(parsedRow));
      productIds.push(inserted.id);
    }
  });

  return {
    mode: PRODUCT_IMPORT_MODE,
    insertedCount: productIds.length,
    productIds,
  };
}

export async function importProductsFromCsv(
  db: ProductImportDb,
  csvText: string,
): Promise<ProductImportResult> {
  const validation = validateProductCsv(csvText);
  if (!validation.ok) {
    throw new ProductImportError(validation.errors);
  }

  return importProductsFromValidatedRows(db, validation.rows);
}

export class ProductImportError extends Error {
  readonly errors: ProductImportValidationError[];

  constructor(errors: ProductImportValidationError[]) {
    super(errors.map((entry) => `Line ${entry.lineNumber}: ${entry.message}`).join("\n"));
    this.name = "ProductImportError";
    this.errors = errors;
  }
}
