-- PetDay V6.15. Run ONCE after database/011. Backup first. No destructive operations.
BEGIN;
CREATE TABLE IF NOT EXISTS blocked_slots (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 branch TEXT NOT NULL CHECK (branch IN ('PetDay Thảo Điền','PetDay Phú Mỹ Hưng')),
 booking_date DATE NOT NULL,
 slot TEXT NOT NULL CHECK(slot IN ('08:30','10:00','13:30','15:00','17:30')),
 reason TEXT NOT NULL CHECK(length(trim(reason))>=5),
 created_by BIGINT NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(branch,booking_date,slot)
);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_day ON blocked_slots(booking_date,branch);
COMMIT;
