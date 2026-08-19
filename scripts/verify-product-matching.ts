/**
 * Verify demo product catalog and Phase 6-2 matching against Toyota Voxy 90 Series.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:verify:products
 */
import { count, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { consultationSummaryToMatchInput, rankProductMatches } from "../src/lib/product/match";
import { fetchActiveProductsWithCompatibilities } from "../src/lib/product/query";
import { productVehicleCompatibilities } from "../src/lib/server/db/schema/product-vehicle-compatibilities";
import { products } from "../src/lib/server/db/schema/products";

const url = process.env.MIGRATE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL or DATABASE_URL");
}

const normalizedUrl = url.replace(/^ppostgresql:/, "postgresql:");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizedUrl;
}

const client = postgres(normalizedUrl, { max: 1 });
const db = drizzle(client);

const [{ value: productTotal }] = await db.select({ value: count() }).from(products);
const [{ value: activeTotal }] = await db
  .select({ value: count() })
  .from(products)
  .where(eq(products.isActive, true));
const [{ value: compatTotal }] = await db
  .select({ value: count() })
  .from(productVehicleCompatibilities);
const [{ value: wheelTotal }] = await db
  .select({ value: count() })
  .from(products)
  .where(eq(products.category, "ホイール"));

console.log("--- DB counts ---");
console.log(`products total: ${productTotal}`);
console.log(`products active: ${activeTotal}`);
console.log(`product_vehicle_compatibilities total: ${compatTotal}`);
console.log(`wheel products: ${wheelTotal}`);

const catalog = await fetchActiveProductsWithCompatibilities();
console.log(`fetchActiveProductsWithCompatibilities: ${catalog.length}`);

const summary = {
  vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
  budget: { maxYen: 200_000, note: "20万円以内" },
  category: "ホイール",
  usage: null,
  stylePreference: "高級感",
  priorities: {
    appearance: "high" as const,
    comfort: "high" as const,
    practicality: "unknown" as const,
    resale: "unknown" as const,
  },
  direction: null,
};

const matches = rankProductMatches(
  catalog,
  consultationSummaryToMatchInput(summary),
  { limit: 3 },
);

console.log("--- rankProductMatches (Voxy 90 / 20万 / ホイール / 高級感) ---");
console.log(`matches returned: ${matches.length}`);
for (const match of matches) {
  console.log(
    `  - ${match.product.name} | score ${Math.round(match.score)} | ¥${match.product.priceMinYen.toLocaleString("ja-JP")}〜¥${match.product.priceMaxYen.toLocaleString("ja-JP")} | ${match.vehicleCompatibility}`,
  );
}

await client.end();
