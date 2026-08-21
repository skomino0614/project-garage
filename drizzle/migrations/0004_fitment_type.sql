ALTER TABLE "product_vehicle_compatibilities" ADD COLUMN "fitment_type" text;
--> statement-breakpoint
UPDATE "product_vehicle_compatibilities"
SET "fitment_type" = 'reference'
WHERE "product_id" = '6db66b2d-3c44-47c9-881f-2a1d60d07e8c'
  AND "maker" = 'Toyota'
  AND "model" = 'Voxy'
  AND "series" = '90 Series';
