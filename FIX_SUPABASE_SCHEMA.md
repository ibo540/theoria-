# Fix: Missing Column Error in Supabase

## The Error
```
Could not find the 'historical_map_period' column of 'events' in the schema cache.
```

## The Problem
Your Supabase `events` table is missing the `historical_map_period` column that the code is trying to save.

## Solution: Add the Missing Column

### Step 1: Go to Supabase SQL Editor
1. Visit https://supabase.com/dashboard
2. Select your project: **theoria-platform**
3. Click on **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Run This SQL
Copy and paste this SQL into the editor:

```sql
-- Add missing historical_map_period column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS historical_map_period TEXT;

-- Verify the column was added (optional - to confirm it worked)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'historical_map_period';
```

### Step 3: Execute
1. Click **"Run"** or press `Ctrl+Enter`
2. You should see: "Success. No rows returned" or "Success. 1 row returned"

### Step 4: Verify
1. Go to **Table Editor** → **events**
2. Click on the table settings (gear icon) or view columns
3. You should now see `historical_map_period` in the column list

## Complete Schema Update (If You Need to Recreate the Table)

If you want to ensure all columns exist, here's the complete table schema:

```sql
-- First, check what columns you have
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Add missing columns (run these one by one if needed)
ALTER TABLE events ADD COLUMN IF NOT EXISTS historical_map_period TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS kind TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS domains JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS primary_location JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS zoom NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS actors JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS country_highlights JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS connections JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS unified_areas JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS country_icons JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS stats JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS overview_timeline JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timeline_points JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS interpretations JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS country_perspectives JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS related_scholars JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS related_scenarios JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS references JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by_username TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_modified_by_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_modified_by_username TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_modified_timestamp TIMESTAMP;
```

## After Adding the Column

1. **Test creating an event** on your deployed site
2. **Check the browser console** - you should see `✅ Event saved successfully to Supabase:`
3. **Check Supabase Table Editor** - the event should appear in the `events` table

## If You Still Get Errors

If you get errors about other missing columns, add them using the same pattern:

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS column_name DATA_TYPE;
```

Replace `column_name` with the missing column name and `DATA_TYPE` with the appropriate type (TEXT, JSONB, NUMERIC, TIMESTAMP, etc.).
