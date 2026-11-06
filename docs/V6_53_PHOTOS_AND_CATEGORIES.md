# PetDay V6.53: six photo categories + 15 food photos

## Changes
- Six category cards with local photographed assets in `public/shop/categories/`.
- 15 named food/nutrition products with local `.webp` images in `public/shop/products/`.
- The source continues to work offline for local images (no Unsplash for these).
- Storefront groups older products into the new six categories without changing prices or stock.
- Admin category options and backend accepted categories use the same six names.

## TEST DB: optional sync
1. Back up PostgreSQL TEST. Verify `retail_products` exists and migrations 024/030 applied as needed.
2. Execute `database/032_v653_six_categories_food_seed.sql` in TEST only.
3. It updates existing legacy category labels and creates 15 food SKUs **if names not yet present**. It does not change prices or stock of existing rows.
4. Run `SELECT category, COUNT(*) FROM retail_products GROUP BY category ORDER BY category;`.
5. Be aware some previously named food products have different names; they remain separate test SKUs.

## Note on imagery
Images are realistic-looking **AI generated illustrative packaging**, not manufacturer-authenticated photos. Variant food products may use a similar package format. Do not claim precise branded SKUs. Six category photos are promotional photographs/illustrative still lifes.

## Run
Open `PETDAY_OFFICIAL` in VS Code, restore `server/.env` only from a working local copy.
Backend (terminal 1): `cd server; npm install; npm run dev`.
Frontend (terminal 2, PETDAY_OFFICIAL): `npm install; npm run dev`.
Refresh store with Ctrl+Shift+R.
