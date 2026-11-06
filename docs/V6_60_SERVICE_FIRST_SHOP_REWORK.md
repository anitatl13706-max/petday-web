# PetDay V6.60 — Service-first shop UX

- Shop is a separate top-level navigation page; the shop entry was removed from the account dropdown.
- The shop no longer inherits the account header banner.
- Standalone cart: no 3-distinct-product limit. Up to 99 units per SKU, subject to stock and a request safety cap of 100 distinct SKUs.
- Database migration `038_v660_retail_cart_quantity.sql` is REQUIRED before testing independent orders exceeding three units of one SKU.
- Booking: replace 90-product list with up to three contextual recommendations (Grooming/Spa/Daycare); optional and pickup-only, while extra care services and taxi remain intact.
- Category image assets are at `public/services/{grooming,spa,daycare}.webp`; used in services listing and service category tabs.
- Existing payments, service availability, booking and past orders remain unchanged. Never run schema migrations without a TEST backup.
- AI-generated illustrative service photography, not actual PetDay premises or staff.
