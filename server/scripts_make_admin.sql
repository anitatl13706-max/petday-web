-- Development only: run manually after registering a dedicated admin account.
-- REPLACE the email. DO NOT run in public/production deployments.
UPDATE users SET role='admin' WHERE email='admin@example.test';
