-- PetDay V6.25: customer pre-arrival intake, no destructive operations.
-- Run only after migrations 001..018 have been applied and the DB is backed up.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_intake_forms (
 booking_id BIGINT PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
 emergency_phone VARCHAR(20) NOT NULL,
 health_alerts VARCHAR(600) NOT NULL DEFAULT '',
 care_instructions VARCHAR(600) NOT NULL DEFAULT '',
 owner_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT intake_phone_length CHECK (char_length(emergency_phone) BETWEEN 9 AND 20),
 CONSTRAINT intake_owner_confirmed CHECK (owner_confirmed = TRUE)
);
COMMIT;
