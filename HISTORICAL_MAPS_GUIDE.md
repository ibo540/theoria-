# Historical Maps Guide

## Overview

The Theoria platform now supports historical map borders! This allows you to display accurate country borders for different time periods (e.g., Cold War era, World War II, etc.).

## How It Works

1. **Auto-Detection**: The system automatically detects which historical period to use based on the event's date
2. **Manual Selection**: You can manually select a historical period in the admin panel
3. **Country Name Mapping**: Historical country names (like "Soviet Union", "Yugoslavia") are automatically mapped to modern equivalents for highlighting

## Current Implementation

Currently, all historical periods use the modern borders GeoJSON file (`/geo/countries.geojson`). To add true historical borders, you'll need to:

1. **Obtain Historical GeoJSON Files**: Find or create GeoJSON files with historical borders for different time periods
2. **Place Files in `/public/geo/`**: 
   - `countries-cold-war.geojson` (for 1947-1991)
   - `countries-ww2.geojson` (for 1939-1945)
   - `countries-interwar.geojson` (for 1918-1939)
   - etc.

3. **Update `src/lib/historical-maps.ts`**: Update the `geojsonPath` for each period to point to the correct file

## Adding Historical GeoJSON Files

### Option 1: Use Historical Map Data Sources

Several sources provide historical border data:

1. **Natural Earth Historical Vectors**: 
   - URL: https://www.naturalearthdata.com/downloads/
   - Provides historical boundaries for different time periods

2. **GeaCron**: 
   - URL: http://geacron.com/
   - Interactive historical atlas with downloadable data

3. **Historical Country Borders Dataset**:
   - Various academic and open-source projects provide historical GeoJSON

### Option 2: Create Custom Historical Maps

If you have historical border data:

1. Convert it to GeoJSON format
2. Ensure country names match the naming convention used in your system
3. Place the file in `/public/geo/`
4. Update the `geojsonPath` in `historical-maps.ts`

## Configuration

The historical map periods are defined in `src/lib/historical-maps.ts`:

```typescript
export const HISTORICAL_MAP_PERIODS: HistoricalMapConfig[] = [
  {
    id: "cold-war",
    name: "Cold War Era (1947-1991)",
    startYear: 1947,
    endYear: 1991,
    geojsonPath: "/geo/countries-cold-war.geojson", // Update this
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", ...],
      // ... more mappings
    },
  },
  // ... more periods
];
```

## Country Name Mapping

The system includes automatic mapping of historical country names to modern equivalents:

- **Soviet Union** → Maps to Russia, Ukraine, Belarus, etc.
- **Yugoslavia** → Maps to Serbia, Croatia, Bosnia, etc.
- **East/West Germany** → Maps to Germany
- **Czechoslovakia** → Maps to Czech Republic, Slovakia

This ensures that when you highlight "Soviet Union" in an event, the system highlights all the modern countries that were part of it.

## Admin Panel

In the admin panel's "Basic Information" tab, you'll find a "Historical Map Period" dropdown:

- **Auto-detect from date**: Automatically selects the period based on the event's date
- **Manual selection**: Choose a specific period (e.g., "Cold War Era", "WW2 Era")

## Next Steps

1. **For immediate use**: The system works with modern borders and country name mapping
2. **For historical accuracy**: Add historical GeoJSON files to `/public/geo/` and update the paths in `historical-maps.ts`
3. **For new periods**: Add new entries to `HISTORICAL_MAP_PERIODS` array

## Example: Adding Cold War Borders

1. Download or create `countries-cold-war.geojson` with 1947-1991 borders
2. Place it in `/public/geo/countries-cold-war.geojson`
3. Update `historical-maps.ts`:
   ```typescript
   {
     id: "cold-war",
     geojsonPath: "/geo/countries-cold-war.geojson", // Changed from default
     // ... rest of config
   }
   ```

The system will automatically use this file for events dated 1947-1991!
