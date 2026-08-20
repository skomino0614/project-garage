# Phase 8-1 test CSV fixtures

## products

```bash
MIGRATE_URL=... npm run db:import:products -- test-data/test-products.csv
```

## compatibilities

Replace `product_id` with an ID returned from the product import, then run:

```bash
MIGRATE_URL=... npm run db:import:compatibilities -- test-data/test-compatibilities.csv
```
