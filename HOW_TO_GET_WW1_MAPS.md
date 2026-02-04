# How to Get WW1 and Pre-WW1 Historical Map Files

## What You Need

You need **GeoJSON files** with historical country borders for:
1. **Pre-World War I (1900-1913)** - `countries-pre-ww1.geojson`
2. **World War I Era (1914-1918)** - `countries-ww1.geojson`

## Where to Find Historical GeoJSON Files

### Option 1: Historical Basemaps Repository (Recommended)
**GitHub Repository:** https://github.com/aourednik/historical-basemaps

This repository has historical world maps for different years. You can:
1. Go to the repository
2. Look for files like:
   - `world_1910.geojson` or `world_1913.geojson` (for pre-WW1)
   - `world_1914.geojson` or `world_1918.geojson` (for WW1)
3. Download the files directly

**Direct download links (if available):**
- Pre-WW1: Look for files around 1910-1913
- WW1: Look for files around 1914-1918

### Option 2: Natural Earth Historical Vectors
**Website:** https://www.naturalearthdata.com/downloads/

1. Go to the downloads page
2. Look for "Historical Vectors" or "Historical Country Boundaries"
3. Download the appropriate time period data
4. Convert to GeoJSON if needed (see conversion section below)

### Option 3: GeaCron
**Website:** http://geacron.com/

1. Navigate to the interactive map
2. Select the year (1910-1913 for pre-WW1, 1914-1918 for WW1)
3. Export the data if available
4. Convert to GeoJSON format

### Option 4: OpenHistoricalMap
**Website:** https://www.openhistoricalmap.org/

Community-driven historical map data. May require extraction and conversion.

## File Format Requirements

The files must be:
- **Format:** GeoJSON (`.geojson` extension)
- **Structure:** Standard GeoJSON FeatureCollection
- **Properties:** Should include country names in properties (like `name`, `NAME`, `NAME_EN`, etc.)

## What to Provide Me

Once you have the files, provide me with:

### Option A: Direct File Paths (Easiest)
If you download the files to your computer, tell me:
1. **File paths** where you saved them (e.g., `C:\Users\ibrah\Downloads\world_1910.geojson`)
2. I'll copy them to the correct location and rename them

### Option B: File Contents
If you have the files ready, you can:
1. Open the `.geojson` files in a text editor
2. Copy the file paths or let me know where they are
3. I'll handle the integration

### Option C: Download Links
If you find direct download links:
1. Share the URLs with me
2. I can help you download and integrate them

## Quick Start: Using aourednik/historical-basemaps

### Step 1: Visit the Repository
Go to: https://github.com/aourednik/historical-basemaps

### Step 2: Find the Files
Look in the repository for files like:
- `world_1910.geojson` or `world_1913.geojson` (for pre-WW1: 1900-1913)
- `world_1914.geojson` or `world_1918.geojson` (for WW1: 1914-1918)

### Step 3: Download
- Click on the file
- Click "Raw" button
- Save the file (or right-click → Save As)

### Step 4: Tell Me Where You Saved It
Provide the file path, for example:
- `C:\Users\ibrah\Downloads\world_1910.geojson`
- `C:\Users\ibrah\Downloads\world_1914.geojson`

I'll then:
1. Copy them to `public/geo/` folder
2. Rename them to:
   - `countries-pre-ww1.geojson`
   - `countries-ww1.geojson`
3. Verify they work correctly

## Converting Other Formats to GeoJSON

If you find files in other formats (Shapefile, KML, etc.):

### Online Converters:
1. **Mapshaper:** https://mapshaper.org/
   - Drag and drop your file
   - Export as GeoJSON

2. **OGR2OGR Online:** https://ogre.adc4gis.com/
   - Upload your file
   - Convert to GeoJSON

### Command Line (if you have GDAL):
```bash
ogr2ogr -f GeoJSON output.geojson input.shp
```

## File Size Considerations

Historical GeoJSON files can be large (1-5 MB). That's normal and fine for our use case.

## Verification

After I add the files, I'll verify:
1. ✅ Files are valid GeoJSON
2. ✅ Files are in the correct location (`public/geo/`)
3. ✅ Files have proper country name properties
4. ✅ The system can load and display them

## Summary

**What I need from you:**
1. The file paths where you saved the GeoJSON files, OR
2. The download links if you found them, OR
3. Let me know if you need help finding/downloading them

**Example:**
```
I downloaded:
- C:\Users\ibrah\Downloads\world_1910.geojson (for pre-WW1)
- C:\Users\ibrah\Downloads\world_1914.geojson (for WW1)
```

Then I'll handle the rest! 🗺️
