# Environment Variables Setup

## Create `.env.local` file

Create a file named `.env.local` in the root directory of your project with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mteqbxpdmnismxgkdtjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZXFieHBkbW5pc214Z2tkdGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODI1NzQsImV4cCI6MjA4NTQ1ODU3NH0.KgH2tvl3gjN74tTypTFaASs81P5DpPg1hkwf9Umpu9A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZXFieHBkbW5pc214Z2tkdGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg4MjU3NCwiZXhwIjoyMDg1NDU4NTc0fQ.HPjj9NTshV3LiQyZpqhRfoPW6b0chp42PLol0p1wtc8
```

## Important Notes

- The `.env.local` file is already in `.gitignore` so it won't be committed to GitHub
- After creating this file, **restart your development server** (`npm run dev`)
- These environment variables are required for Supabase to work
