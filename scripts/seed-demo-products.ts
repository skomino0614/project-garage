/**
 * Idempotent seed for demo product catalog (Phase 6-5 / 6-6).
 * These are explicitly test/demo catalog entries — not real retail products.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:seed:products
 */
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { carMasters } from "../src/lib/server/db/schema/car-masters";
import { productVehicleCompatibilities } from "../src/lib/server/db/schema/product-vehicle-compatibilities";
import { products } from "../src/lib/server/db/schema/products";
import { ALL_DEMO_PRODUCT_ID_LIST, DEMO_PRODUCT_IDS } from "../src/lib/product/demo-product-ids";

const url = process.env.MIGRATE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL");
}

const DEMO_NOTE =
  "Project Garage 動作確認用のデモ商品です。実在の販売商品ではありません。";

/** Stable IDs so re-running the seed updates the same rows. */
const DEMO_IDS = DEMO_PRODUCT_IDS;

const DEMO_PRODUCT_ROWS = [
  {
    id: DEMO_IDS.wheel01,
    category: "ホイール",
    name: "[DEMO] Test Wheel Luxe 18",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 150_000,
    priceMaxYen: 175_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "メッシュ", "高級感"],
  },
  {
    id: DEMO_IDS.wheel02,
    category: "ホイール",
    name: "[DEMO] Test Wheel Comfort Mesh",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 165_000,
    priceMaxYen: 190_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "メッシュ", "高級感"],
  },
  {
    id: DEMO_IDS.wheel03,
    category: "ホイール",
    name: "[DEMO] Test Wheel Budget Line",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 140_000,
    priceMaxYen: 160_000,
    appearance: "high",
    comfort: "medium",
    practicality: "high",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "17インチ", "高級感"],
  },
  {
    id: DEMO_IDS.wheel04,
    category: "ホイール",
    name: "[DEMO] Test Wheel Premium Edge",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 180_000,
    priceMaxYen: 200_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "高級感"],
  },
  {
    id: DEMO_IDS.wheel05,
    category: "ホイール",
    name: "[DEMO] Test Wheel Max Budget",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 195_000,
    priceMaxYen: 200_000,
    appearance: "high",
    comfort: "high",
    practicality: "low",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "メッシュ"],
  },
  {
    id: DEMO_IDS.wheel06,
    category: "ホイール",
    name: "[DEMO] Test Wheel Over Budget",
    brand: "Project Garage Demo",
    description: `${DEMO_NOTE} 予算フィルタ確認用（20万円超）。`,
    priceMinYen: 250_000,
    priceMaxYen: 280_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "予算超過確認用"],
  },
] as const;

/** Stable IDs for demo dashcam products (Phase 6-6). */
const DEMO_DASHCAM_ROWS = [
  {
    id: DEMO_IDS.dashcam01,
    category: "ドラレコ",
    name: "[DEMO] Test Dashcam Compact",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 18_000,
    priceMaxYen: 22_000,
    appearance: "medium",
    comfort: "unknown",
    practicality: "high",
    resale: "medium",
    style: "シンプル",
    tags: ["demo", "test-data", "前後2カメラ", "シンプル"],
  },
  {
    id: DEMO_IDS.dashcam02,
    category: "ドラレコ",
    name: "[DEMO] Test Dashcam Safety Plus",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 28_000,
    priceMaxYen: 32_000,
    appearance: "low",
    comfort: "unknown",
    practicality: "high",
    resale: "high",
    style: "純正風",
    tags: ["demo", "test-data", "駐車監視", "純正風"],
  },
  {
    id: DEMO_IDS.dashcam03,
    category: "ドラレコ",
    name: "[DEMO] Test Dashcam Wide View",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 35_000,
    priceMaxYen: 42_000,
    appearance: "medium",
    comfort: "unknown",
    practicality: "high",
    resale: "medium",
    style: "シンプル",
    tags: ["demo", "test-data", "広角", "実用性"],
  },
  {
    id: DEMO_IDS.dashcam04,
    category: "ドラレコ",
    name: "[DEMO] Test Dashcam Premium Guard",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 44_000,
    priceMaxYen: 48_000,
    appearance: "high",
    comfort: "unknown",
    practicality: "high",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "高画質", "高級感"],
  },
  {
    id: DEMO_IDS.dashcam05,
    category: "ドラレコ",
    name: "[DEMO] Test Dashcam Max Budget",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 55_000,
    priceMaxYen: 60_000,
    appearance: "high",
    comfort: "unknown",
    practicality: "high",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "上限付近"],
  },
  {
    id: DEMO_IDS.dashcam06,
    category: "ドラレコ",
    name: "[DEMO] Test Dashcam Over Budget",
    brand: "Project Garage Demo",
    description: `${DEMO_NOTE} 予算フィルタ確認用（5万円超）。`,
    priceMinYen: 68_000,
    priceMaxYen: 75_000,
    appearance: "high",
    comfort: "unknown",
    practicality: "high",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "予算超過確認用"],
  },
] as const;

/** Stable IDs for demo tire products (Phase 6-6). */
const DEMO_TIRE_ROWS = [
  {
    id: DEMO_IDS.tire01,
    category: "タイヤ",
    name: "[DEMO] Test Tire Comfort Tour",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 120_000,
    priceMaxYen: 140_000,
    appearance: "medium",
    comfort: "high",
    practicality: "high",
    resale: "medium",
    style: "シンプル",
    tags: ["demo", "test-data", "低ノイズ", "乗り心地"],
  },
  {
    id: DEMO_IDS.tire02,
    category: "タイヤ",
    name: "[DEMO] Test Tire Quiet Line",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 135_000,
    priceMaxYen: 155_000,
    appearance: "medium",
    comfort: "high",
    practicality: "medium",
    resale: "medium",
    style: "純正風",
    tags: ["demo", "test-data", "静音", "純正風"],
  },
  {
    id: DEMO_IDS.tire03,
    category: "タイヤ",
    name: "[DEMO] Test Tire Premium Grip",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 150_000,
    priceMaxYen: 170_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "高級感", "グリップ"],
  },
  {
    id: DEMO_IDS.tire04,
    category: "タイヤ",
    name: "[DEMO] Test Tire Family Safe",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 165_000,
    priceMaxYen: 185_000,
    appearance: "medium",
    comfort: "high",
    practicality: "high",
    resale: "high",
    style: "シンプル",
    tags: ["demo", "test-data", "ファミリー", "実用性"],
  },
  {
    id: DEMO_IDS.tire05,
    category: "タイヤ",
    name: "[DEMO] Test Tire Max Budget",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 195_000,
    priceMaxYen: 220_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "上限付近"],
  },
  {
    id: DEMO_IDS.tire06,
    category: "タイヤ",
    name: "[DEMO] Test Tire Over Budget",
    brand: "Project Garage Demo",
    description: `${DEMO_NOTE} 予算フィルタ確認用（20万円超）。`,
    priceMinYen: 260_000,
    priceMaxYen: 290_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "予算超過確認用"],
  },
] as const;

const ALL_DEMO_PRODUCT_ROWS = [
  ...DEMO_PRODUCT_ROWS,
  ...DEMO_DASHCAM_ROWS,
  ...DEMO_TIRE_ROWS,
];

const demoProductIdList = ALL_DEMO_PRODUCT_ID_LIST;

const VEHICLE = {
  maker: "Toyota",
  model: "Voxy",
  series: "90 Series",
} as const;

const client = postgres(url, { max: 1 });
const db = drizzle(client);

const [voxyCarMaster] = await db
  .select({ id: carMasters.id })
  .from(carMasters)
  .where(and(eq(carMasters.maker, VEHICLE.maker), eq(carMasters.model, VEHICLE.model)))
  .limit(1);

const carMasterId = voxyCarMaster?.id ?? null;

for (const row of ALL_DEMO_PRODUCT_ROWS) {
  await db
    .insert(products)
    .values({
      id: row.id,
      category: row.category,
      name: row.name,
      brand: row.brand,
      description: row.description,
      priceMinYen: row.priceMinYen,
      priceMaxYen: row.priceMaxYen,
      imageUrl: null,
      productUrl: null,
      purchaseUrl: null,
      appearance: row.appearance,
      comfort: row.comfort,
      practicality: row.practicality,
      resale: row.resale,
      style: row.style,
      tags: [...row.tags],
      isActive: true,
      isDemo: true,
    })
    .onConflictDoUpdate({
      target: products.id,
      set: {
        category: row.category,
        name: row.name,
        brand: row.brand,
        description: row.description,
        priceMinYen: row.priceMinYen,
        priceMaxYen: row.priceMaxYen,
        appearance: row.appearance,
        comfort: row.comfort,
        practicality: row.practicality,
        resale: row.resale,
        style: row.style,
        tags: [...row.tags],
        isActive: true,
        isDemo: true,
        updatedAt: new Date(),
      },
    });
}

await db
  .delete(productVehicleCompatibilities)
  .where(inArray(productVehicleCompatibilities.productId, demoProductIdList));

const compatibilityRows = demoProductIdList.map((productId) => ({
  productId,
  carMasterId,
  maker: VEHICLE.maker,
  model: VEHICLE.model,
  series: VEHICLE.series,
  fitmentType: "confirmed" as const,
  note: "90系Voxy向けデモ適合データ",
}));

await db.insert(productVehicleCompatibilities).values(compatibilityRows);

const compatCount = await db
  .select({ id: productVehicleCompatibilities.id })
  .from(productVehicleCompatibilities)
  .where(inArray(productVehicleCompatibilities.productId, demoProductIdList));

console.log(`demo products upserted: ${ALL_DEMO_PRODUCT_ROWS.length}`);
console.log(`  wheel: ${DEMO_PRODUCT_ROWS.length}`);
console.log(`  dashcam: ${DEMO_DASHCAM_ROWS.length}`);
console.log(`  tire: ${DEMO_TIRE_ROWS.length}`);
console.log(`demo compatibilities inserted: ${compatCount.length}`);
console.log(`carMasterId linked: ${carMasterId ?? "none (maker/model text only)"}`);

await client.end();
