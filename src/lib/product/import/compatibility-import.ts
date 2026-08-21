import { z } from "zod";

import { FITMENT_TYPES } from "@/lib/product/constants";

import { parseCsv, rowToRecord } from "./csv";

export const COMPATIBILITY_CSV_HEADERS = [
  "product_id",
  "maker",
  "model",
  "series",
  "note",
  "fitment_type",
] as const;

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const CompatibilityCsvRowSchema = z.object({
  product_id: z.string().uuid(),
  maker: z.string().trim().min(1),
  model: z.string().trim().min(1),
  series: z.string().trim().min(1),
  note: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  fitment_type: z.preprocess(
    emptyToUndefined,
    z.enum(FITMENT_TYPES, { message: "fitment_type must be confirmed or reference" }).optional(),
  ),
});

export type CompatibilityCsvRow = z.infer<typeof CompatibilityCsvRowSchema>;

export type ParsedCompatibilityImportRow = {
  lineNumber: number;
  row: CompatibilityCsvRow;
};

export type CompatibilityImportValidationError = {
  lineNumber: number;
  message: string;
};

export type CompatibilityImportValidationResult =
  | { ok: true; rows: ParsedCompatibilityImportRow[] }
  | { ok: false; errors: CompatibilityImportValidationError[] };

function validateHeader(headers: string[]): CompatibilityImportValidationError | null {
  const required = ["product_id", "maker", "model", "series"];
  const missing = required.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      lineNumber: 1,
      message: `Missing required CSV headers: ${missing.join(", ")}`,
    };
  }

  return null;
}

export function validateCompatibilityCsv(text: string): CompatibilityImportValidationResult {
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

  const rows: ParsedCompatibilityImportRow[] = [];
  const errors: CompatibilityImportValidationError[] = [];

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

    const parsed = CompatibilityCsvRowSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        lineNumber: csvRow.lineNumber,
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      continue;
    }

    rows.push({
      lineNumber: csvRow.lineNumber,
      row: parsed.data,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, rows };
}

export function toCompatibilityInsertValues(parsed: ParsedCompatibilityImportRow) {
  return {
    productId: parsed.row.product_id,
    maker: parsed.row.maker,
    model: parsed.row.model,
    series: parsed.row.series,
    note: parsed.row.note ?? null,
    fitmentType: parsed.row.fitment_type ?? null,
    carMasterId: null as string | null,
  };
}

export type CompatibilityImportDb = {
  transaction<T>(fn: (tx: CompatibilityImportTx) => Promise<T>): Promise<T>;
  findExistingProductIds: (productIds: string[]) => Promise<Set<string>>;
};

export type CompatibilityImportTx = {
  insertCompatibility: (values: ReturnType<typeof toCompatibilityInsertValues>) => Promise<void>;
};

export type CompatibilityImportResult = {
  insertedCount: number;
};

export async function importCompatibilitiesFromValidatedRows(
  db: CompatibilityImportDb,
  rows: ParsedCompatibilityImportRow[],
): Promise<CompatibilityImportResult> {
  const uniqueProductIds = [...new Set(rows.map((row) => row.row.product_id))];
  const existingProductIds = await db.findExistingProductIds(uniqueProductIds);
  const missingProductIds = uniqueProductIds.filter((productId) => !existingProductIds.has(productId));

  if (missingProductIds.length > 0) {
    throw new CompatibilityImportError([
      {
        lineNumber: 0,
        message: `Unknown product_id values: ${missingProductIds.join(", ")}`,
      },
    ]);
  }

  await db.transaction(async (tx) => {
    for (const parsedRow of rows) {
      await tx.insertCompatibility(toCompatibilityInsertValues(parsedRow));
    }
  });

  return {
    insertedCount: rows.length,
  };
}

export async function importCompatibilitiesFromCsv(
  db: CompatibilityImportDb,
  csvText: string,
): Promise<CompatibilityImportResult> {
  const validation = validateCompatibilityCsv(csvText);
  if (!validation.ok) {
    throw new CompatibilityImportError(validation.errors);
  }

  return importCompatibilitiesFromValidatedRows(db, validation.rows);
}

export class CompatibilityImportError extends Error {
  readonly errors: CompatibilityImportValidationError[];

  constructor(errors: CompatibilityImportValidationError[]) {
    super(errors.map((entry) => `Line ${entry.lineNumber}: ${entry.message}`).join("\n"));
    this.name = "CompatibilityImportError";
    this.errors = errors;
  }
}
