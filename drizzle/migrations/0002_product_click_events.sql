CREATE TABLE "product_click_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_click_events" ADD CONSTRAINT "product_click_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_click_events_product_id_idx" ON "product_click_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_click_events_event_type_idx" ON "product_click_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "product_click_events_created_at_idx" ON "product_click_events" USING btree ("created_at");
