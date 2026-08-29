-- Migration: Add auth support to opportunities table
-- Run this BEFORE deploying the new schema.sql
-- This preserves existing data when switching from single-user to multi-user

-- Step 1: Create a temporary column with UUID type
ALTER TABLE opportunities ADD COLUMN user_id_new UUID;

-- Step 2: Enable Supabase Auth if not already enabled
-- (This is usually done in Supabase dashboard, but here's the SQL)
-- Note: You may need to run this via Supabase SQL editor

-- Step 3: For existing data, you have two options:
-- Option A: Assign all existing data to a specific user (run after first signup)
-- UPDATE opportunities SET user_id_new = '<your-user-id-here>' WHERE user_id = 'single-user';

-- Option B: Delete old data (if you want a fresh start)
-- DELETE FROM opportunities WHERE user_id = 'single-user';

-- Step 4: Drop old column and rename new one (run after Step 3)
-- ALTER TABLE opportunities DROP COLUMN user_id;
-- ALTER TABLE opportunities RENAME COLUMN user_id_new TO user_id;

-- Step 5: Make user_id NOT NULL and add foreign key
-- ALTER TABLE opportunities ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE opportunities ADD CONSTRAINT fk_user_id
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOTE: This migration is commented out because it requires manual execution
-- after the first user signs up. Follow these steps:
--
-- 1. Deploy the new code with auth pages
-- 2. Sign up as the first user
-- 3. Copy your user ID from Supabase dashboard (Authentication > Users)
-- 4. Uncomment and run Step 3 Option A with your user ID
-- 5. Uncomment and run Steps 4-5
-- 6. Drop the old user_id column: ALTER TABLE opportunities DROP COLUMN user_id;
