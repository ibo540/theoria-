-- Complete fix for users table and RLS policies
-- Run this in Supabase SQL Editor

-- Step 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Step 3: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow public insert" ON users;
DROP POLICY IF EXISTS "Allow public update" ON users;
DROP POLICY IF EXISTS "Allow public delete" ON users;

-- Step 5: Create new RLS policies for anon role

-- Policy 1: Allow public reads
CREATE POLICY "Allow public read access" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Allow public inserts (for user creation on login)
CREATE POLICY "Allow public insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 3: Allow public updates (for updating user info)
CREATE POLICY "Allow public update" ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow public deletes (optional - for user management)
CREATE POLICY "Allow public delete" ON users
  FOR DELETE
  TO anon
  USING (true);

-- Step 6: Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Step 7: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Step 8: List all policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';
