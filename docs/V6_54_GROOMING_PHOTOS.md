# PetDay V6.54 — Tắm & Chăm sóc lông

- 15 grooming-related product entries have **separate local photographic illustrations** (`public/shop/products/`).
- Replaces local photographs for equivalent grooming products with older names.
- Category cover updated: `public/shop/categories/tam-cham-soc-long.webp`.
- Images are realistic-looking AI-created illustrations, NOT proof of manufacturer-branded SKUs or official package imagery.
- Existing backend routes, booking, cart, payments, delivery, and orders remain as V6.53.
- PostgreSQL TEST only (optional): run `database/033_v654_grooming_15_optional_seed.sql` after a backup to add missing entries without replacing prices/stocks of existing products. V6.53 migration 032 should already be applied.
- Existing variant products may cause more than 15 entries in category. No deletion or automatic consolidation of products with distinct names.
- Run backend and frontend from `PETDAY_OFFICIAL`, using your existing `server/.env` (not included in ZIP).
