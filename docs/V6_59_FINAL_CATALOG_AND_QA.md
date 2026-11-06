# PetDay V6.59 — Unified catalog (6 × 15)

## What changed
- Combined the latest local product photos from V6.58 and all earlier groups (V6.53–V6.57).
- Added one canonical 90-item storefront catalog with six categories, 15 distinct names each.
- Added optional PostgreSQL TEST migration `database/037_v659_final_90_product_catalog.sql`.
- Migration inserts only missing names, corrects only the category of these 90 names, and preserves all prices, stock counts, historical products, orders, bookings and payments.
- When all 90 names are available, the storefront shows exactly the canonical 90 (not legacy duplicates); before that, it displays existing products.
- Admin can still see legacy product records and associated orders. It does not delete or merge product IDs. If legacy rows exist, the admin inventory total may be >90.
- Product photos are local AI illustrations; some are generated or cropped from image sheets, NOT supplier-authenticated SKU photos.

## Setup
1. Extract ZIP; open `PETDAY_OFFICIAL` in VS Code.
2. Copy your old `server/.env` into `PETDAY_OFFICIAL/server/.env`.
3. Back up PostgreSQL TEST, and verify core migrations (including 024) have been applied.
4. Run SQL 037 once on TEST to make sure the canonical 90 product names are present. SQL image changes are not needed.
5. Start backend and frontend in separate terminals; refresh browser.
6. Test filtering each category, product images, shopping cart, home delivery, and payment options.

## Caveats
- Not tested live against your PostgreSQL connection; never apply to production without staging QA.
- Name-based catalog mapping is curated. If Admin renames one of the 90 products, it will no longer match until the storefront list is updated.
- Existing duplicate names with different product IDs are not merged; first matching row is shown to avoid disturbing historical order records.
