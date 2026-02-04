-- Add missing historical_map_period column to events table
-- Run this in Supabase SQL Editor

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS historical_map_period TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'historical_map_period';
