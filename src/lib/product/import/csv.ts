/**
 * Minimal RFC 4180-style CSV parser.
 * Supports quoted fields, escaped quotes (""), UTF-8, and comma separators.
 */

export type CsvRow = {
  lineNumber: number;
  values: string[];
};

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

function stripUtf8Bom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inQuotes) {
      if (char === '"') {
        const next = line[index + 1];
        if (next === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new Error("Unclosed quoted field");
  }

  values.push(current);
  return values;
}

export function parseCsv(text: string): ParsedCsv {
  const normalized = stripUtf8Bom(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
  const lines = normalized.split("\n");

  let headerLineNumber = 0;
  let headerValues: string[] | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim()) {
      continue;
    }

    headerLineNumber = index + 1;
    headerValues = parseCsvLine(rawLine).map((value) => value.trim());
    break;
  }

  if (!headerValues || headerValues.length === 0) {
    throw new Error("CSV header row is required");
  }

  const rows: CsvRow[] = [];

  for (let index = headerLineNumber; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim()) {
      continue;
    }

    const values = parseCsvLine(rawLine);
    rows.push({
      lineNumber: index + 1,
      values,
    });
  }

  return {
    headers: headerValues,
    rows,
  };
}

export function rowToRecord(headers: string[], row: CsvRow): Record<string, string> {
  const record: Record<string, string> = {};

  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index]?.trim();
    if (!header) {
      continue;
    }
    record[header] = row.values[index]?.trim() ?? "";
  }

  if (row.values.length > headers.length) {
    throw new Error(`Line ${row.lineNumber}: too many columns (expected ${headers.length}, got ${row.values.length})`);
  }

  return record;
}
