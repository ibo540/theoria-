-- Create users table if it doesn't exist
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table

-- Allow public reads (so admins can see who created events)
CREATE POLICY IF NOT EXISTS "Allow public read access" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow public inserts (so users can be created on login)
CREATE POLICY IF NOT EXISTS "Allow public insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public updates (so user info can be updated)
CREATE POLICY IF NOT EXISTS "Allow public update" ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
