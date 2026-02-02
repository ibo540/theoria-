# Quick Start: Adding Historical Map Files

## The Problem
The historical map system is configured, but the actual GeoJSON files with historical borders are missing. Currently, all periods show modern borders.

## The Solution

You need to download historical GeoJSON files and place them in `public/geo/`. Here's the fastest way:

### Step 1: Visit the Repository

Go to: **https://github.com/aourednik/historical-basemaps**

### Step 2: Navigate to GeoJSON Files

1. Click on the **`geojson`** folder
2. You'll see files like `world_XXXX.geojson` where XXXX is a year
3. Look for files close to these years:
   - **1950** (for Cold War: 1947-1991)
   - **1940** (for WW2: 1939-1945)  
   - **1930** (for Interwar: 1918-1939)
   - **2000** (for Post-Cold War: 1991-2023)

### Step 3: Download Files

For each file:
1. Click on the file (e.g., `world_1950.geojson`)
2. Click the **"Raw"** button (top right)
3. Right-click → **Save As**
4. Save with these exact names in `public/geo/`:
   - `world_1950.geojson` → Save as: `countries-cold-war.geojson`
   - `world_1940.geojson` → Save as: `countries-ww2.geojson`
   - `world_1930.geojson` → Save as: `countries-interwar.geojson`
   - `world_2000.geojson` → Save as: `countries-post-cold-war.geojson`

### Step 4: Verify Files

After downloading, you should have:
```
public/geo/
  ├── countries.geojson (already exists)
  ├── countries-cold-war.geojson (new)
  ├── countries-ww2.geojson (new)
  ├── countries-interwar.geojson (new)
  └── countries-post-cold-war.geojson (new)
```

### Step 5: Commit and Push

```bash
git add public/geo/*.geojson
git commit -m "Add historical map GeoJSON files"
git push origin main
```

### Step 6: Test

1. Go to admin panel
2. Select "Cold War Era" from the historical period dropdown
3. The map borders should change!

## Alternative: Use the Download Script

I've created a script that will attempt to download the files automatically:

```bash
node scripts/download-maps.js
```

**Note**: The script may fail if the exact year files don't exist. In that case, manually download from the repository as described above.

## Troubleshooting

- **Files too large?** Use https://mapshaper.org/ to simplify the geometry
- **Wrong borders?** Try a different year file (e.g., 1945 instead of 1940)
- **Not working?** Check browser console for errors and verify file paths in `src/lib/historical-maps.ts`

## What's Already Done

✅ Configuration updated to use correct file paths  
✅ System ready to load historical borders  
✅ Country name mapping configured  
✅ All you need is the actual GeoJSON files!
