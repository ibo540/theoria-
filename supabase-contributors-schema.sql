-- Contributors Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the contributors table

CREATE TABLE IF NOT EXISTS contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  event_count INTEGER DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_event_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contributors_username ON contributors(username);
CREATE INDEX IF NOT EXISTS idx_contributors_event_count ON contributors(event_count DESC);
CREATE INDEX IF NOT EXISTS idx_contributors_role ON contributors(role);

-- Enable Row Level Security (RLS)
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read contributors (for public leaderboard)
CREATE POLICY "Contributors are viewable by everyone" ON contributors
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert/update their own data
-- Note: In production, you may want to restrict this further
CREATE POLICY "Users can insert contributors" ON contributors
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update contributors" ON contributors
  FOR UPDATE
  USING (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contributors_updated_at
  BEFORE UPDATE ON contributors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
