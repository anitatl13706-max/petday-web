-- PetDay V6.16 staff roster and assignment. Back up petday before applying.
-- Depends on migration 001-012 (including blocked_slots/service_events).
-- No DROP/DELETE/UPDATE of existing operational data.
BEGIN;
CREATE TABLE IF NOT EXISTS staff_members (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 full_name TEXT NOT NULL CHECK(length(trim(full_name)) BETWEEN 2 AND 100),
 branch TEXT NOT NULL CHECK(branch IN ('PetDay Thảo Điền','PetDay Phú Mỹ Hưng')),
 active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_shifts (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 staff_id BIGINT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
 shift_date DATE NOT NULL,
 slot TEXT NOT NULL CHECK(slot IN ('08:30','10:00','13:30','15:00','17:30')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(staff_id,shift_date,slot)
);
CREATE TABLE IF NOT EXISTS booking_assignments (
 booking_id BIGINT PRIMARY KEY REFERENCES bookings(id) ON DELETE RESTRICT,
 staff_id BIGINT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
 booking_date DATE NOT NULL,
 slot TEXT NOT NULL CHECK(slot IN ('08:30','10:00','13:30','15:00','17:30')),
 assigned_by BIGINT NOT NULL REFERENCES users(id),
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(staff_id,booking_date,slot)
);
CREATE TABLE IF NOT EXISTS staff_assignment_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
 staff_id BIGINT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
 action TEXT NOT NULL CHECK(action IN ('assigned','released')),
 changed_by BIGINT NOT NULL REFERENCES users(id),
 note TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON staff_shifts(shift_date,slot);
CREATE INDEX IF NOT EXISTS idx_assignment_events_booking ON staff_assignment_events(booking_id,created_at);
COMMIT;
