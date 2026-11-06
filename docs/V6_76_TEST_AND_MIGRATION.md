# PetDay V6.76 — Daycare eligibility & pet archive

Source based on V6.75. Changes:
- Daycare requires dogs to be **at least 1.0 year** according to the demo policy (not medical guidance). Server rejects younger dogs.
- Pets without bookings can be deleted. Pets with historical bookings can be archived and hidden from the customer's active pet list. Archive is refused while bookings are unfinished. History is retained.

## Required schema change
Back up PostgreSQL TEST, inspect the pets table, and apply `database/040_v676_pet_archive.sql` **once** if the column is missing. Do not rerun 001-039. The script contains only an additive nullable column and index.

## Manual acceptance
1. Register pet age 0.5; Daycare booking must fail validation; Grooming remains available if otherwise eligible.
2. Register dog age 1.0; Daycare may pass age rule, subject to weight/slots and other checks.
3. Delete a pet without bookings: record removed.
4. Archive pet with only completed/cancelled bookings: absent from active pet list; booked history remains.
5. Try archiving pet with a confirmed or ongoing booking: blocked.
6. Test app against PostgreSQL TEST with current migrations, Customer and Admin sessions.

Known limits: source tests do not prove E2E; /bookings 503 and retail delivery migration 039 must be diagnosed separately.
