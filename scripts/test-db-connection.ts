import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { carMasters } from "../src/lib/server/db/schema/car-masters";

const url = process.env.MIGRATE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL");
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

const [{ value: ping }] = await client`SELECT 1 AS value`;
console.log(`connection: ok (SELECT ${ping})`);

const [{ value: total }] = await db.select({ value: count() }).from(carMasters);
console.log(`car_masters count: ${total}`);

await client.end();
