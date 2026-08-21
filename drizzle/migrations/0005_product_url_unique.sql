-- Partial unique index: non-null product_url must be unique (Phase 8-2B Workstream A).
-- NULL product_url rows are unaffected (demo catalog, legacy imports).
-- Migration fails if duplicate non-null product_url values already exist.
CREATE UNIQUE INDEX "products_product_url_unique" ON "products" ("product_url") WHERE "product_url" IS NOT NULL;
