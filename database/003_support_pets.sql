-- Run ONCE on existing petday database; preserves existing data.
BEGIN;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS consultation_requests (
 id BIGSERIAL PRIMARY KEY,
 customer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
 contact_name VARCHAR(120) NOT NULL,
 contact_email VARCHAR(200) NOT NULL,
 question TEXT NOT NULL CHECK(length(trim(question)) BETWEEN 10 AND 2000),
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','closed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consultation_requests_status_idx ON consultation_requests(status,created_at);
COMMIT;
