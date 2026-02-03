# Fix: Events Not Appearing in Supabase

## Problem
When you create a new event in the admin panel, it's not appearing in Supabase. This is usually caused by **Row Level Security (RLS) policies** blocking the insert.

## Solution: Enable RLS Policies for Events Table

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **theoria-platform**
3. Click on **"Table Editor"** in the left sidebar
4. Click on the **"events"** table

### Step 2: Check RLS Status
1. Look at the top toolbar - you should see a button like **"2 RLS policies"** or **"RLS enabled"**
2. If RLS is enabled but events aren't saving, the policies might be too restrictive

### Step 3: Fix RLS Policies

#### Option A: Disable RLS (Quick Fix - Not Recommended for Production)
1. Go to **"Authentication"** → **"Policies"** in the left sidebar
2. Find the **"events"** table
3. Click **"Disable RLS"** (only for testing - not secure for production)

#### Option B: Add Proper RLS Policies (Recommended)

1. Go to **"Authentication"** → **"Policies"** in the left sidebar
2. Click on the **"events"** table
3. Click **"+ New Policy"**

**Policy 1: Allow Public Reads**
- Policy name: `Allow public read access`
- Allowed operation: `SELECT`
- Policy definition:
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

**Policy 2: Allow Public Inserts**
- Policy name: `Allow public insert`
- Allowed operation: `INSERT`
- Policy definition:
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

**Policy 3: Allow Public Updates**
- Policy name: `Allow public update`
- Allowed operation: `UPDATE`
- Policy definition:
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

**Policy 4: Allow Public Deletes**
- Policy name: `Allow public delete`
- Allowed operation: `DELETE`
- Policy definition:
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

### Step 4: Test
1. Go back to your admin panel
2. Create a new event
3. Check the browser console (F12) for any errors
4. Go back to Supabase Table Editor
5. Refresh the events table - your event should appear!

## Alternative: Check Console for Errors

After the latest update, the system will now:
- Show detailed error messages in the browser console
- Detect RLS errors specifically
- Show a warning if events are saved to localStorage instead of Supabase

**To check:**
1. Open browser console (F12)
2. Create a new event
3. Look for messages starting with:
   - `❌ Error saving to Supabase:` - Shows the actual error
   - `🔒 RLS Policy Error:` - Indicates RLS is blocking
   - `⚠️ Falling back to localStorage` - Event saved locally, not in Supabase

## Security Note

The policies above allow **public** access (anyone can read/write). For production, you should:
- Use authentication and restrict to authenticated users
- Add more specific conditions (e.g., users can only edit their own events)
- Use service role key for admin operations

For now, public access is fine for development/testing.
