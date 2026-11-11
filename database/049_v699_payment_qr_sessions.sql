-- V6.99: demo payment QR sessions, strictly separate from settlement.
-- Run only on backup/test database. No real bank account transactions.
CREATE TABLE IF NOT EXISTS public.payment_qr_sessions (
  kind VARCHAR(8) NOT NULL CHECK (kind IN ('booking','retail')),
  code VARCHAR(50) NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES public.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ,
  PRIMARY KEY (kind, code)
);
CREATE INDEX IF NOT EXISTS payment_qr_sessions_customer_idx
ON public.payment_qr_sessions(customer_id, expires_at);
