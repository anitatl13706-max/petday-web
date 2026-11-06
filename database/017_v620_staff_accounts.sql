-- PetDay V6.20: enable genuine least-privilege staff accounts.
-- Backup first. Requires migrations 001-016. No existing account is converted or deleted.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_role_check' AND conrelid='public.users'::regclass) THEN
  -- Existing deployments may use another constraint name; avoid guessing.
  NULL;
 END IF;
END $$;
-- Remove only CHECK constraints on role which prohibit staff; inspect names dynamically.
DO $$ DECLARE constraint_name TEXT; BEGIN
 FOR constraint_name IN
  SELECT con.conname FROM pg_constraint con
  JOIN pg_attribute att ON att.attrelid=con.conrelid
  WHERE con.conrelid='public.users'::regclass AND con.contype='c'
  AND pg_get_constraintdef(con.oid) LIKE '%role%' AND pg_get_constraintdef(con.oid) LIKE '%customer%'
 LOOP EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I',constraint_name); END LOOP;
END $$;
ALTER TABLE public.users ADD CONSTRAINT petday_users_role_v620 CHECK (role IN ('customer','admin','staff'));
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS user_id BIGINT UNIQUE REFERENCES public.users(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id) WHERE user_id IS NOT NULL;
COMMIT;
