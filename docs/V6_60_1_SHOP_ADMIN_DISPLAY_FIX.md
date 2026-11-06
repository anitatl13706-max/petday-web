# PetDay V6.60.1 — Fix blank shop for administrator

## Root cause
`Portal.tsx` rendered `StandaloneRetailShop` only if `user.role === 'customer'`. Admin accounts got an empty page when visiting `#cua-hang`.

## Fix
- Render the standalone shop for both customer and admin roles.
- Staff role receives a clear navigation message rather than a blank page.
- No database migrations or new image assets required.
- Preserves roles, backend authorization, checkout, and admin workspace.

## Verification
Log in as an admin and visit `#cua-hang`: the product catalog should render. Check customer access separately.

## Note
Backend `/api/retail/products` and `/api/my/retail-orders` use `auth` and are available to authenticated admin accounts; live database behavior still needs testing on the user's machine.
