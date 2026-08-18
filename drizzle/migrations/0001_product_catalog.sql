CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"description" text,
	"price_min_yen" integer NOT NULL,
	"price_max_yen" integer NOT NULL,
	"image_url" text,
	"product_url" text,
	"purchase_url" text,
	"appearance" text DEFAULT 'unknown' NOT NULL,
	"comfort" text DEFAULT 'unknown' NOT NULL,
	"practicality" text DEFAULT 'unknown' NOT NULL,
	"resale" text DEFAULT 'unknown' NOT NULL,
	"style" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_vehicle_compatibilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"car_master_id" uuid,
	"maker" text NOT NULL,
	"model" text NOT NULL,
	"series" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_vehicle_compatibilities" ADD CONSTRAINT "product_vehicle_compatibilities_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_vehicle_compatibilities" ADD CONSTRAINT "product_vehicle_compatibilities_car_master_id_car_masters_id_fk" FOREIGN KEY ("car_master_id") REFERENCES "public"."car_masters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_is_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "products_price_min_yen_idx" ON "products" USING btree ("price_min_yen");--> statement-breakpoint
CREATE INDEX "product_vehicle_compatibilities_product_id_idx" ON "product_vehicle_compatibilities" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_vehicle_compatibilities_vehicle_idx" ON "product_vehicle_compatibilities" USING btree ("maker","model");
