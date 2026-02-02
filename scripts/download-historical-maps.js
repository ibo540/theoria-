/**
 * Script to download historical map GeoJSON files
 * 
 * This script helps download historical country border data from various sources
 * and places them in the correct directory for the Theoria platform.
 * 
 * Usage:
 *   node scripts/download-historical-maps.js
 * 
 * Sources:
 * 1. Historical Basemaps: https://github.com/aourednik/historical-basemaps
 * 2. Natural Earth Historical Vectors
 * 3. Other open-source historical GIS datasets
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GEO_DIR = path.join(__dirname, '../public/geo');

// Ensure geo directory exists
if (!fs.existsSync(GEO_DIR)) {
  fs.mkdirSync(GEO_DIR, { recursive: true });
}

console.log('Historical Map Downloader');
console.log('==========================\n');
console.log('This script will help you download historical GeoJSON files.');
console.log('Due to file size and licensing, you need to manually download these files.\n');

console.log('Recommended Sources:');
console.log('1. Historical Basemaps (GitHub):');
console.log('   https://github.com/aourednik/historical-basemaps');
console.log('   - Provides historical borders for various time periods');
console.log('   - Download the GeoJSON files for your needed periods\n');

console.log('2. Natural Earth Historical Vectors:');
console.log('   https://www.naturalearthdata.com/downloads/');
console.log('   - Look for historical boundary data\n');

console.log('3. Historic Country Borders App:');
console.log('   https://github.com/nrgapple/historic-country-borders-app');
console.log('   - May have GeoJSON exports available\n');

console.log('Required Files:');
console.log('After downloading, place these files in public/geo/:');
console.log('  - countries-cold-war.geojson (for 1947-1991)');
console.log('  - countries-ww2.geojson (for 1939-1945)');
console.log('  - countries-interwar.geojson (for 1918-1939)');
console.log('  - countries-post-cold-war.geojson (optional, for 1991-2023)\n');

console.log('Note:');
console.log('- Files should be in GeoJSON format');
console.log('- Country names should use the "name" or "NAME" property');
console.log('- Large files may need to be simplified for web use');
console.log('- Consider using mapshaper.org to simplify if files are >10MB\n');

console.log('After adding files, update src/lib/historical-maps.ts to point to the correct paths.');
