# How to Download and Add Historical Map Files

## Quick Start

The historical map system is configured but needs the actual GeoJSON files. Here's how to get them:

## Option 1: Historical Basemaps (Recommended)

1. **Visit**: https://github.com/aourednik/historical-basemaps
2. **Download** the GeoJSON files for your needed periods:
   - For Cold War (1947-1991): Look for files covering 1950-1990
   - For WW2 (1939-1945): Look for files covering 1939-1945
   - For Interwar (1918-1939): Look for files covering 1920-1938

3. **Save files** to `public/geo/` with these names:
   - `countries-cold-war.geojson`
   - `countries-ww2.geojson`
   - `countries-interwar.geojson`

## Option 2: Natural Earth Historical Vectors

1. **Visit**: https://www.naturalearthdata.com/downloads/
2. **Download** historical boundary data
3. **Convert** to GeoJSON if needed (use mapshaper.org or ogr2ogr)
4. **Place** in `public/geo/` directory

## Option 3: Use Online Converters

If you have historical border data in other formats:

1. **Mapshaper**: https://mapshaper.org/
   - Upload your shapefile/KML
   - Export as GeoJSON
   - Simplify if needed (reduce file size)

2. **OGR2OGR** (command line):
   ```bash
   ogr2ogr -f GeoJSON output.geojson input.shp
   ```

## File Requirements

- **Format**: GeoJSON
- **Property names**: Should use `name` or `NAME` for country names
- **File size**: Try to keep under 10MB for web performance
- **Location**: `public/geo/` directory

## After Adding Files

1. **Update** `src/lib/historical-maps.ts`:
   ```typescript
   {
     id: "cold-war",
     geojsonPath: "/geo/countries-cold-war.geojson", // ← Update this
     // ...
   }
   ```

2. **Test** in the admin panel:
   - Select a historical period
   - Verify borders change correctly

3. **Commit and push**:
   ```bash
   git add public/geo/*.geojson
   git commit -m "Add historical map GeoJSON files"
   git push origin main
   ```

## Important Notes

- **File Size**: Large GeoJSON files can slow down the map. Consider simplifying geometry.
- **Country Names**: Ensure country names in GeoJSON match your event data, or update the `countryNameMapping` in `historical-maps.ts`.
- **Git LFS**: If files are very large (>50MB), consider using Git LFS or hosting them externally.

## Need Help?

If you can't find suitable historical border data:
- Start with one period (e.g., Cold War) and expand later
- Use simplified borders initially
- Consider hiring a GIS specialist to prepare the data
