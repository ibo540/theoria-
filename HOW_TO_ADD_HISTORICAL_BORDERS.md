# How to Add Historical Map Borders

## Current Status

The historical map system is **fully implemented and working**, but all historical periods currently use the modern borders file (`/geo/countries.geojson`). To see actual historical borders, you need to add historical GeoJSON files.

## Quick Solution

### Step 1: Obtain Historical GeoJSON Files

You need GeoJSON files with historical country borders for each period. Here are some sources:

1. **Natural Earth Historical Vectors** (Recommended)
   - Website: https://www.naturalearthdata.com/downloads/
   - Provides historical boundaries for different time periods
   - Download the appropriate historical period data

2. **GeaCron**
   - Website: http://geacron.com/
   - Interactive historical atlas with downloadable data
   - May require conversion to GeoJSON format

3. **OpenHistoricalMap**
   - Community-driven historical map data
   - May have GeoJSON exports available

4. **Academic Sources**
   - Many universities and research institutions provide historical border data
   - Check for open-source historical GIS datasets

### Step 2: Convert to GeoJSON (if needed)

If you have historical border data in another format (Shapefile, KML, etc.), convert it to GeoJSON:

- **Online converters**: Use tools like https://mapshaper.org/ or https://ogre.adc4gis.com/
- **Command line**: Use `ogr2ogr` from GDAL:
  ```bash
  ogr2ogr -f GeoJSON output.geojson input.shp
  ```

### Step 3: Place Files in `/public/geo/`

Create historical GeoJSON files and place them in the `public/geo/` directory:

```
public/geo/
  ├── countries.geojson (modern borders - already exists)
  ├── countries-cold-war.geojson (for 1947-1991)
  ├── countries-ww2.geojson (for 1939-1945)
  ├── countries-interwar.geojson (for 1918-1939)
  └── countries-post-cold-war.geojson (for 1991-2023, if different from modern)
```

### Step 4: Update `src/lib/historical-maps.ts`

Update the `geojsonPath` for each period to point to the correct file:

```typescript
{
  id: "cold-war",
  name: "Cold War Era (1947-1991)",
  startYear: 1947,
  endYear: 1991,
  geojsonPath: "/geo/countries-cold-war.geojson", // ← Change this
  // ... rest of config
},
{
  id: "ww2-era",
  name: "World War II Era (1939-1945)",
  startYear: 1939,
  endYear: 1945,
  geojsonPath: "/geo/countries-ww2.geojson", // ← Change this
  // ... rest of config
},
{
  id: "interwar",
  name: "Interwar Period (1918-1939)",
  startYear: 1918,
  endYear: 1939,
  geojsonPath: "/geo/countries-interwar.geojson", // ← Change this
  // ... rest of config
},
```

### Step 5: Ensure Country Names Match

Make sure the country names in your historical GeoJSON files match the names used in your event data. The system uses the `name` or `NAME` property from the GeoJSON features.

If country names differ, you may need to:
- Update the GeoJSON file to use consistent naming
- Or update the `countryNameMapping` in `historical-maps.ts` to map historical names to GeoJSON names

## Testing

After adding historical GeoJSON files:

1. **In Admin Panel**: 
   - Select a historical period from the "Historical Map Period" dropdown
   - The map should reload and show the historical borders
   - Check the console for any loading errors

2. **On Main Page**:
   - Select an event with a historical date
   - The system should auto-detect the period and load the correct borders
   - The period indicator will show in the top-right corner

## Important Notes

- **File Size**: Historical GeoJSON files can be large. Consider simplifying the geometry if files are too big (>10MB).
- **Performance**: The map will reload when switching periods, which may take a moment for large files.
- **Country Name Consistency**: Ensure country names in GeoJSON match your event data, or update the mapping configuration.

## Example: Adding Cold War Borders

1. Download Cold War era border data (e.g., from Natural Earth)
2. Convert to GeoJSON if needed
3. Save as `/public/geo/countries-cold-war.geojson`
4. Update `historical-maps.ts`:
   ```typescript
   geojsonPath: "/geo/countries-cold-war.geojson"
   ```
5. Restart your dev server or redeploy
6. Select "Cold War Era" in the admin panel - borders should change!

## Need Help?

If you're having trouble finding or converting historical border data, consider:
- Using a GIS specialist to help prepare the data
- Starting with one period (e.g., Cold War) and expanding later
- Using simplified borders initially and refining later

The system is ready - you just need the historical border data files!
