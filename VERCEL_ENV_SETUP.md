# Setting Environment Variables in Vercel

## Why This is Needed

When you deploy to Vercel, the `.env.local` file is NOT used. You must set environment variables in the Vercel dashboard.

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Sign in to your account
3. Select your project (theoria-xdpu or similar)

### 2. Navigate to Environment Variables
1. Click on your project
2. Go to **Settings** (in the top navigation)
3. Click on **Environment Variables** (in the left sidebar)

### 3. Add the Required Variables

Add these three environment variables:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://mteqbxpdmnismxgkdtjr.supabase.co`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZXFieHBkbW5pc214Z2tkdGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODI1NzQsImV4cCI6MjA4NTQ1ODU3NH0.KgH2tvl3gjN74tTypTFaASs81P5DpPg1hkwf9Umpu9A`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY (Optional but recommended)
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZXFieHBkbW5pc214Z2tkdGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg4MjU3NCwiZXhwIjoyMDg1NDU4NTc0fQ.HPjj9NTshV3LiQyZpqhRfoPW6b0chp42PLol0p1wtc8`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### 4. Redeploy Your Application

After adding the environment variables:

1. Go to the **Deployments** tab
2. Find your latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Make sure **"Use existing Build Cache"** is **UNCHECKED** (important!)
6. Click **Redeploy**

**OR** simply push a new commit to trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger redeploy with environment variables"
git push origin main
```

### 5. Verify It's Working

After the redeploy completes:

1. Visit your deployed site
2. Open browser console (F12)
3. Look for: `✅ Supabase client initialized successfully:`
4. Try creating an event
5. Check Supabase dashboard to see if the event appears

## Important Notes

- ⚠️ **Environment variables are case-sensitive** - make sure the names match exactly
- ⚠️ **You must redeploy** after adding/changing environment variables
- ⚠️ **Uncheck "Use existing Build Cache"** when redeploying to ensure new env vars are used
- ✅ Variables with `NEXT_PUBLIC_` prefix are exposed to the browser (this is needed for Supabase)
- 🔒 The service role key should be kept secret (but it's okay to use it server-side)

## Troubleshooting

If events still don't save after redeploying:

1. **Check Vercel Build Logs:**
   - Go to your deployment
   - Click on the deployment
   - Check the "Build Logs" tab
   - Look for any errors related to environment variables

2. **Verify Variables Are Set:**
   - Go to Settings → Environment Variables
   - Make sure all three variables are listed
   - Check that they're enabled for the correct environment (Production/Preview/Development)

3. **Check Browser Console:**
   - Open your deployed site
   - Open browser console (F12)
   - Look for Supabase initialization messages
   - Check for any error messages

4. **Test in Supabase Dashboard:**
   - Go to Supabase → Table Editor → events
   - Try manually inserting a test row to verify RLS policies are working
