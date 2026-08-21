import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { carMasters } from "./car-masters";
import { products } from "./products";

export const productVehicleCompatibilities = pgTable(
  "product_vehicle_compatibilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    carMasterId: uuid("car_master_id").references(() => carMasters.id, {
      onDelete: "set null",
    }),
    maker: text("maker").notNull(),
    model: text("model").notNull(),
    series: text("series"),
    /** confirmed = manufacturer evidence; reference = dealer/reference fitment. Null = unclassified. */
    fitmentType: text("fitment_type"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_vehicle_compatibilities_product_id_idx").on(table.productId),
    index("product_vehicle_compatibilities_vehicle_idx").on(table.maker, table.model),
  ],
);
