# Deployment & Backend Setup Guide

## 🚀 Pushing to GitHub

### Step 1: Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Theoria platform with admin dashboard and authentication"
```

### Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "theoria-platform")
3. **Don't** initialize with README, .gitignore, or license

### Step 3: Connect and Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/theoria-platform.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Backend Services Needed

To store data and track who added it, you need:

### **Option 1: Supabase (Recommended - Easiest) ⭐**

**What it provides:**
- ✅ PostgreSQL database (free tier: 500MB)
- ✅ Automatic REST API
- ✅ Real-time subscriptions
- ✅ Built-in authentication
- ✅ Row-level security
- ✅ Free tier available

**Setup Steps:**
1. Go to https://supabase.com
2. Create a free account
3. Create a new project
4. Get your API keys from Settings > API

**Installation:**
```bash
npm install @supabase/supabase-js
```

**Database Schema:**
```sql
-- Events table
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  description TEXT,
  full_description TEXT,
  theory TEXT,
  highlighted_countries JSONB,
  timeline_points JSONB,
  country_icons JSONB,
  connections JSONB,
  unified_areas JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_name TEXT,
  created_by_username TEXT,
  last_modified_by_name TEXT,
  last_modified_by_username TEXT
);

-- Users table (for tracking)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cost:** Free tier includes 500MB database, 2GB bandwidth/month

---

### **Option 2: Firebase (Google)**

**What it provides:**
- ✅ NoSQL database (Firestore)
- ✅ Real-time updates
- ✅ Authentication
- ✅ Free tier: 1GB storage, 10GB/month transfer

**Setup Steps:**
1. Go to https://firebase.google.com
2. Create a project
3. Enable Firestore Database
4. Get your config keys

**Installation:**
```bash
npm install firebase
```

**Cost:** Free tier includes 1GB storage, 10GB/month network

---

### **Option 3: Self-Hosted (PostgreSQL + Node.js)**

**What you need:**
- PostgreSQL database (can use free services like Railway, Render, or Supabase)
- Node.js API server (Express.js)
- Hosting (Vercel, Railway, Render, or your own server)

**Components:**
1. **Database:** PostgreSQL (free on Railway.app or Render.com)
2. **API Server:** Express.js with REST endpoints
3. **Hosting:** Vercel (for Next.js frontend) + Railway/Render (for API)

**Cost:** Free tiers available on Railway/Render

---

## 📋 Recommended Setup: Supabase

### Why Supabase?
- ✅ Easiest to set up
- ✅ Automatic API generation
- ✅ Built-in user tracking
- ✅ Real-time updates
- ✅ Free tier is generous
- ✅ Works perfectly with Next.js

### Implementation Steps:

1. **Create Supabase Project**
   - Sign up at https://supabase.com
   - Create new project
   - Note your project URL and anon key

2. **Set Environment Variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

4. **Create Database Tables**
   - Go to Supabase Dashboard > SQL Editor
   - Run the SQL schema (provided above)

5. **Update Code**
   - Replace `saveEventToStorage` with Supabase calls
   - Replace `loadEventFromStorage` with Supabase queries
   - User tracking is automatic with `lastModifiedBy` fields

---

## 🔐 Authentication Options

### Current Setup (Local Storage)
- ✅ Already implemented
- ❌ Not secure for production
- ❌ No server-side validation

### With Supabase:
- ✅ Server-side authentication
- ✅ Row-level security
- ✅ User management dashboard
- ✅ Password reset, email verification

### With Firebase:
- ✅ Google authentication
- ✅ Email/password
- ✅ Social logins (Google, Facebook, etc.)

---

## 📊 What You'll See in the Dashboard

Once connected to a backend:

1. **All events** stored in database
2. **User tracking:**
   - Who created each event
   - Who last modified it
   - Timestamp of changes
3. **Real-time updates:** Changes appear instantly for all team members
4. **Audit log:** Full history of who did what

---

## 🎯 Quick Start Recommendation

**For fastest setup, use Supabase:**

1. Sign up: https://supabase.com (free)
2. Create project
3. Run database schema (provided above)
4. Add environment variables
5. Update `admin-utils.ts` to use Supabase instead of localStorage

**Time to set up:** ~15 minutes

**Cost:** Free for development, $25/month for production (if needed)

---

## 📝 Next Steps After Choosing a Service

I can help you:
1. Set up the database schema
2. Update the code to connect to your chosen service
3. Implement proper authentication
4. Add real-time updates
5. Set up deployment (Vercel for frontend)

Let me know which option you prefer, and I'll guide you through the setup!
