import { getSafeExternalUrl } from "@/lib/product/external-url";

const BLOCKED_IMAGE_PATTERNS = [
  /ogp\.jpg/i,
  /favicon/i,
  /logo/i,
  /placeholder\.webp/i,
  /icon_/i,
  /\/common\//i,
  /loader_circle/i,
  /footer_link/i,
  /icon_drag/i,
];

const GENERIC_DESCRIPTION_PATTERNS = [
  /のページです/,
  /全車種対応/,
  /レーステクノロジーとメイドインジャパン/,
  /F1で鍛えたノウハウ/,
];

export function parseYen(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[,\s円¥]/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  return Math.round(Number(match[1]));
}

export function isBlockedProductImageUrl(url: string): boolean {
  return BLOCKED_IMAGE_PATTERNS.some((pattern) => pattern.test(url));
}

export function isGenericSiteDescription(description: string | null | undefined): boolean {
  if (!description?.trim()) {
    return true;
  }

  return GENERIC_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(description));
}

export function resolvePageUrl(sourceUrl: string, value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    return getSafeExternalUrl(new URL(value.trim(), sourceUrl).toString());
  } catch {
    return getSafeExternalUrl(value);
  }
}

export function extractBrandFromTitle(title: string | null | undefined): string | null {
  if (!title?.trim()) {
    return null;
  }

  const parts = title.split("｜").map((part) => part.trim());
  if (parts.length >= 2 && parts[1]) {
    return parts[1];
  }

  return null;
}

export function extractProductNameFromTitle(title: string | null | undefined): string | null {
  if (!title?.trim()) {
    return null;
  }

  const first = title.split("｜")[0]?.trim();
  return first || null;
}

function stripTags(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: string): string {
  return stripTags(value).replace(/\s+/g, "").toLowerCase();
}

export type ParsedHtmlTable = {
  headers: string[];
  rows: string[][];
};

export function parseHtmlTables(html: string): ParsedHtmlTable[] {
  const tables: ParsedHtmlTable[] = [];
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null = tablePattern.exec(html);

  while (tableMatch) {
    const tableHtml = tableMatch[1] ?? "";
    const headers: string[] = [];
    const rows: string[][] = [];

    const headMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    if (headMatch?.[1]) {
      const headerCells = headMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) ?? [];
      for (const cell of headerCells) {
        headers.push(stripTags(cell));
      }
    }

    const bodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    const rowSource = bodyMatch?.[1] ?? tableHtml;
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null = rowPattern.exec(rowSource);

    while (rowMatch) {
      const cells =
        rowMatch[1]?.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)?.map((cell) => stripTags(cell)) ?? [];
      if (cells.length > 0) {
        rows.push(cells);
      }
      rowMatch = rowPattern.exec(rowSource);
    }

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows });
    }

    tableMatch = tablePattern.exec(html);
  }

  return tables;
}

function isProductSpecTable(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  const hasSize = normalized.some((header) => header.includes("size"));
  const hasPcd = normalized.some((header) => header.includes("p.c.d") || header === "pcd");
  const hasPrice = normalized.some((header) => header.includes("price"));
  return hasSize && hasPcd && hasPrice;
}

function findTaxIncludedPriceColumnIndex(headers: string[]): number {
  const normalized = headers.map(normalizeHeader);
  const taxIncluded = normalized.findIndex(
    (header) => header.includes("price") && (header.includes("税込") || header.includes("税込み")),
  );
  if (taxIncluded >= 0) {
    return taxIncluded;
  }

  return normalized.findIndex((header) => header === "price" || header.endsWith("price"));
}

function isReasonableProductPrice(price: number): boolean {
  return price >= 1_000 && price <= 50_000_000;
}

export function extractTablePrices(html: string): number[] {
  const prices = new Set<number>();

  for (const table of parseHtmlTables(html)) {
    if (!isProductSpecTable(table.headers)) {
      continue;
    }

    const priceColumn = findTaxIncludedPriceColumnIndex(table.headers);
    if (priceColumn < 0) {
      continue;
    }

    for (const row of table.rows) {
      const price = parseYen(row[priceColumn]);
      if (price !== null && isReasonableProductPrice(price)) {
        prices.add(price);
      }
    }
  }

  return [...prices].sort((a, b) => a - b);
}

function normalizeInchTag(value: string): string | null {
  const match = value.match(/(\d{2})\s*inch/i);
  if (!match?.[1]) {
    return null;
  }

  return `${match[1]}インチ`;
}

function collectUniqueSorted(values: Iterable<string>): string[] {
  return [...new Set([...values].filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
}

export function extractSpecTags(html: string): string[] {
  const tags = new Set<string>();

  const specPattern =
    /<div class="specHead">([\s\S]*?)<\/div>[\s\S]*?<p class="specText">([\s\S]*?)<\/p>/gi;
  let specMatch: RegExpExecArray | null = specPattern.exec(html);

  while (specMatch) {
    const head = stripTags(specMatch[1] ?? "");
    const body = stripTags(specMatch[2] ?? "");

    if (head === "サイズ") {
      for (const part of body.split("/")) {
        const inchTag = normalizeInchTag(part.trim());
        if (inchTag) {
          tags.add(inchTag);
        }
      }
    }

    if (head === "工法" && body) {
      tags.add(body);
    }

    if (head === "カラー" && body) {
      tags.add(body);
    }

    specMatch = specPattern.exec(html);
  }

  for (const table of parseHtmlTables(html)) {
    if (!isProductSpecTable(table.headers)) {
      continue;
    }

    const normalizedHeaders = table.headers.map(normalizeHeader);
    const holeIndex = normalizedHeaders.findIndex((header) => header.includes("hole"));
    const pcdIndex = normalizedHeaders.findIndex((header) => header.includes("p.c.d") || header === "pcd");
    const sizeIndex = normalizedHeaders.findIndex((header) => header.includes("size"));

    for (const row of table.rows) {
      if (sizeIndex >= 0) {
        const sizeCell = row[sizeIndex] ?? "";
        const inchFromSize = sizeCell.match(/^(\d{2})x/i);
        if (inchFromSize?.[1]) {
          tags.add(`${inchFromSize[1]}インチ`);
        }
      }

      if (holeIndex >= 0) {
        const hole = row[holeIndex]?.trim();
        if (hole && /^\d+$/.test(hole)) {
          tags.add(`${hole}H`);
        }
      }

      if (pcdIndex >= 0) {
        const pcd = row[pcdIndex]?.trim();
        if (pcd && /^\d+(?:\.\d+)?$/.test(pcd)) {
          tags.add(`P.C.D.${pcd}`);
        }
      }
    }
  }

  return collectUniqueSorted(tags);
}

export function extractProductDescription(html: string): string | null {
  const leadMatch = html.match(/<h2[^>]*class=["'][^"']*leadText[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i);
  const detailMatch = html.match(/<p[^>]*class=["'][^"']*detailText[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);

  const lead = leadMatch?.[1] ? stripTags(leadMatch[1]) : null;
  const detail = detailMatch?.[1] ? stripTags(detailMatch[1]) : null;

  if (lead && detail) {
    return `${lead}\n\n${detail}`;
  }

  if (detail) {
    return detail;
  }

  if (lead) {
    return lead;
  }

  return null;
}

function collectImageCandidates(html: string, sourceUrl: string): string[] {
  const candidates: string[] = [];

  const pushCandidate = (value: string | null | undefined) => {
    const resolved = resolvePageUrl(sourceUrl, value);
    if (resolved && !isBlockedProductImageUrl(resolved)) {
      candidates.push(resolved);
    }
  };

  const dataImagePattern = /data-image-loader-src=["']([^"']+)["']/gi;
  let dataImageMatch: RegExpExecArray | null = dataImagePattern.exec(html);
  while (dataImageMatch) {
    pushCandidate(dataImageMatch[1]);
    dataImageMatch = dataImagePattern.exec(html);
  }

  const galleryPattern = /class=["'][^"']*gallery-path-list[^"']*["'][^>]*data-src=["']([^"']+)["']/gi;
  let galleryMatch: RegExpExecArray | null = galleryPattern.exec(html);
  while (galleryMatch) {
    pushCandidate(galleryMatch[1]);
    galleryMatch = galleryPattern.exec(html);
  }

  const productImgPattern =
    /<img[^>]+class=["'][^"']*js-product-slider-img[^"']*["'][^>]*>/gi;
  for (const imgTag of html.match(productImgPattern) ?? []) {
    const srcMatch = imgTag.match(/data-image-loader-src=["']([^"']+)["']/i);
    pushCandidate(srcMatch?.[1]);
  }

  const imgSrcPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch: RegExpExecArray | null = imgSrcPattern.exec(html);
  while (imgMatch) {
    const tag = imgMatch[0] ?? "";
    if (/productContents|product-slider|secGallery|wheel/i.test(tag)) {
      pushCandidate(imgMatch[1]);
    }
    imgMatch = imgSrcPattern.exec(html);
  }

  return candidates;
}

export function extractProductImageUrl(
  sourceUrl: string,
  options: {
    jsonLdImageUrl?: string | null;
    ogImage?: string | null;
    html: string;
  },
): string | null {
  const jsonLd = getSafeExternalUrl(options.jsonLdImageUrl);
  if (jsonLd && !isBlockedProductImageUrl(jsonLd)) {
    return jsonLd;
  }

  for (const candidate of collectImageCandidates(options.html, sourceUrl)) {
    return candidate;
  }

  const ogImage = getSafeExternalUrl(options.ogImage);
  if (ogImage && !isBlockedProductImageUrl(ogImage)) {
    return ogImage;
  }

  return null;
}

export function extractPricesFromHtml(html: string, jsonLdPrices: number[]): number[] {
  const tablePrices = extractTablePrices(html);
  const merged = new Set<number>([...jsonLdPrices, ...tablePrices]);
  return [...merged].sort((a, b) => a - b);
}
