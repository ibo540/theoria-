# How to Verify RLS Policies in Supabase

## The Problem
Even with environment variables set, events aren't appearing in Supabase. This is almost certainly an RLS (Row Level Security) policy issue.

## Step-by-Step: Verify RLS Policies

### 1. Go to Supabase Dashboard
1. Visit https://supabase.com/dashboard
2. Select your project: **theoria-platform**
3. Click on **Authentication** in the left sidebar
4. Click on **Policies** (under Authentication)

### 2. Check the `events` Table Policies

1. In the policies page, find the **`events`** table
2. You should see a list of policies or a message saying "No policies"

### 3. Verify You Have These 4 Policies

You need **ALL 4** of these policies for the `events` table:

#### ✅ Policy 1: SELECT (Read)
- **Name:** `Allow public read access` (or similar)
- **Target roles:** Should include `anon` or `public`
- **Operation:** `SELECT`
- **Policy definition:** `true`

#### ✅ Policy 2: INSERT (Create)
- **Name:** `Allow public insert` (or similar)
- **Target roles:** Should include `anon` or `public`
- **Operation:** `INSERT`
- **Policy definition:** `true`

#### ✅ Policy 3: UPDATE (Modify)
- **Name:** `Allow public update` (or similar)
- **Target roles:** Should include `anon` or `public`
- **Operation:** `UPDATE`
- **Policy definition:** `true`

#### ✅ Policy 4: DELETE (Remove)
- **Name:** `Allow public delete` (or similar)
- **Target roles:** Should include `anon` or `public`
- **Operation:** `DELETE`
- **Policy definition:** `true`

### 4. If Policies Are Missing, Add Them

For each missing policy:

1. Click **"+ New Policy"** or **"Create Policy"**
2. Choose **"For full customization"** or **"Create policy from scratch"**
3. Fill in:
   - **Policy name:** e.g., "Allow public insert"
   - **Allowed operation:** Select the operation (INSERT, UPDATE, etc.)
   - **Target roles:** Type `anon` and press Enter (or select `public`)
   - **Policy definition:** Type `true`
4. Click **"Review"** then **"Save policy"**

### 5. Quick SQL Fix (Alternative Method)

If the UI is confusing, use SQL Editor:

1. Go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Enable RLS (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "Allow public read access" ON events;
DROP POLICY IF EXISTS "Allow public insert" ON events;
DROP POLICY IF EXISTS "Allow public update" ON events;
DROP POLICY IF EXISTS "Allow public delete" ON events;

-- Create new policies for anon role
CREATE POLICY "Allow public read access" ON events
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert" ON events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update" ON events
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete" ON events
  FOR DELETE
  TO anon
  USING (true);
```

4. Click **"Run"** or press `Ctrl+Enter`
5. You should see "Success. No rows returned"

### 6. Test the Policies

After setting up policies:

1. Go to **Table Editor** → **events**
2. Try to manually insert a test row:
   - Click **"Insert row"**
   - Fill in at least: `id` (e.g., "test-123") and `title` (e.g., "Test Event")
   - Click **"Save"**
3. If it works, policies are correct!
4. If you get an error, check the error message - it will tell you which policy is missing

### 7. Check Browser Console After Redeploy

After Vercel redeploys with the new code:

1. Go to your deployed site
2. Open browser console (F12)
3. Try creating an event
4. Look for these messages:
   - `✅ Event saved successfully to Supabase:` = Success!
   - `🔒 RLS Policy Error:` = RLS is still blocking
   - `❌ Error saving to Supabase:` = Check the error code and message

## Common Error Codes

- **42501** = Permission denied (RLS blocking)
- **PGRST301** = RLS violation
- **23505** = Unique constraint violation (event ID already exists)

## Still Not Working?

1. **Check Supabase Logs:**
   - Go to **Logs** → **API Logs**
   - Filter by table: `events`
   - Look for failed requests with error codes

2. **Verify Table Structure:**
   - Go to **Table Editor** → **events**
   - Make sure the table has these columns:
     - `id` (TEXT, PRIMARY KEY)
     - `title` (TEXT)
     - `created_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

3. **Test Direct API Call:**
   - In browser console, run:
   ```javascript
   fetch('https://mteqbxpdmnismxgkdtjr.supabase.co/rest/v1/events', {
     method: 'POST',
     headers: {
       'apikey': 'YOUR_ANON_KEY',
       'Authorization': 'Bearer YOUR_ANON_KEY',
       'Content-Type': 'application/json',
       'Prefer': 'return=representation'
     },
     body: JSON.stringify({
       id: 'test-' + Date.now(),
       title: 'Test Event',
       date: '2024-01-01',
       description: 'Test',
       full_description: 'Test description',
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString()
     })
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error);
   ```
