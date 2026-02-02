# Setup Historical Maps - Quick Guide

## Step 1: Download Historical GeoJSON Files

### Option A: Historical Basemaps Repository (Recommended)

1. **Visit**: https://github.com/aourednik/historical-basemaps
2. **Navigate to the `geojson` folder**
3. **Download** the following files (right-click → Save As, or use the raw GitHub URLs):

   **For Cold War (1947-1991):**
   - Look for files around 1950-1990
   - Example: `world_1950.geojson` or `world_1990.geojson`
   - Save as: `public/geo/countries-cold-war.geojson`

   **For WW2 (1939-1945):**
   - Look for files around 1939-1945
   - Example: `world_1940.geojson` or `world_1945.geojson`
   - Save as: `public/geo/countries-ww2.geojson`

   **For Interwar (1918-1939):**
   - Look for files around 1920-1938
   - Example: `world_1920.geojson` or `world_1930.geojson`
   - Save as: `public/geo/countries-interwar.geojson`

4. **Check the `index.json` file** in the repository to see all available years

### Option B: Direct Download URLs (if available)

You can use these raw GitHub URLs (replace `YEAR` with the specific year):

```
https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/world_YEAR.geojson
```

Example for 1950:
```
https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/world_1950.geojson
```

## Step 2: Place Files in Correct Location

After downloading, place the files in:
```
public/geo/
  ├── countries.geojson (already exists - modern borders)
  ├── countries-cold-war.geojson (new)
  ├── countries-ww2.geojson (new)
  └── countries-interwar.geojson (new)
```

## Step 3: Verify File Format

Each GeoJSON file should:
- Have a `type: "FeatureCollection"` at the root
- Contain features with `geometry` and `properties`
- Use `name` or `NAME` property for country names

## Step 4: Test the Maps

1. Start your dev server: `npm run dev`
2. Go to the admin panel
3. Select a historical period from the dropdown
4. Verify the borders change on the map

## Step 5: Commit and Push

```bash
git add public/geo/*.geojson
git commit -m "Add historical map GeoJSON files"
git push origin main
```

## Troubleshooting

- **File too large?** Use mapshaper.org to simplify the geometry
- **Country names don't match?** Update `countryNameMapping` in `src/lib/historical-maps.ts`
- **Map not loading?** Check browser console for errors
- **Files not deploying?** Ensure they're committed to Git and not in `.gitignore`
