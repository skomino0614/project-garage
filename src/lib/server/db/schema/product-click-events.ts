import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";

export const productClickEvents = pgTable(
  "product_click_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_click_events_product_id_idx").on(table.productId),
    index("product_click_events_event_type_idx").on(table.eventType),
    index("product_click_events_created_at_idx").on(table.createdAt),
  ],
);
