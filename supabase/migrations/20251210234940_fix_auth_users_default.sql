-- Ensure pgcrypto exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Fix auth.users so ID auto-generates
ALTER TABLE auth.users
ALTER COLUMN id SET DEFAULT gen_random_uuid();