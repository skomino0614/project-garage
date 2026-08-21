# Phase 8-1 / 8-2B test CSV fixtures

## products

```bash
MIGRATE_URL=... npm run db:import:products -- test-data/test-products.csv
```

Rows with `product_url` are upserted by URL on re-import.
Rows without `product_url` are always inserted as new rows.

## compatibilities

Replace `product_id` with an ID returned from the product import, then run:

```bash
MIGRATE_URL=... npm run db:import:compatibilities -- test-data/test-compatibilities.csv
```

### fitment_type column (optional, Phase 8-2B)

| Value | Meaning |
|---|---|
| `confirmed` | Manufacturer-documented fitment |
| `reference` | Dealer/reference fitment |
| *(empty)* | Unclassified (`NULL` in DB) |

Legacy CSV files without `fitment_type` remain valid; imported rows get `NULL`.

Invalid values (e.g. `invalid`) fail validation.
