/**
 * Script to download historical map GeoJSON files from GitHub
 * 
 * This script downloads historical country border data from the
 * historical-basemaps repository and places them in the correct directory.
 * 
 * Usage:
 *   node scripts/download-historical-maps.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GEO_DIR = path.join(__dirname, '../public/geo');
const BASE_URL = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson';

// Ensure geo directory exists
if (!fs.existsSync(GEO_DIR)) {
  fs.mkdirSync(GEO_DIR, { recursive: true });
}

// Historical periods and their corresponding years
const HISTORICAL_MAPS = [
  {
    name: 'countries-cold-war.geojson',
    year: 1950, // Representative year for Cold War era (1947-1991)
    description: 'Cold War Era (1947-1991)'
  },
  {
    name: 'countries-ww2.geojson',
    year: 1940, // Representative year for WW2 era (1939-1945)
    description: 'World War II Era (1939-1945)'
  },
  {
    name: 'countries-interwar.geojson',
    year: 1930, // Representative year for Interwar period (1918-1939)
    description: 'Interwar Period (1918-1939)'
  },
  {
    name: 'countries-post-cold-war.geojson',
    year: 2000, // Representative year for post-Cold War (1991-2023)
    description: 'Post-Cold War (1991-2023)'
  }
];

/**
 * Download a file from a URL
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        console.log(`✓ Downloaded: ${path.basename(filepath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

/**
 * Check if a file exists and get its size
 */
function checkFile(filepath) {
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);
    return {
      exists: true,
      size: stats.size,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2)
    };
  }
  return { exists: false };
}

/**
 * Main function
 */
async function main() {
  console.log('Historical Map Downloader');
  console.log('==========================\n');
  
  // Check which files already exist
  console.log('Checking existing files...\n');
  for (const map of HISTORICAL_MAPS) {
    const filepath = path.join(GEO_DIR, map.name);
    const status = checkFile(filepath);
    if (status.exists) {
      console.log(`✓ ${map.name} already exists (${status.sizeMB} MB)`);
    } else {
      console.log(`✗ ${map.name} not found`);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('To download historical map files:');
  console.log('\n1. Visit: https://github.com/aourednik/historical-basemaps');
  console.log('2. Navigate to the "geojson" folder');
  console.log('3. Download the appropriate year files:');
  console.log('   - For Cold War: world_1950.geojson (or similar)');
  console.log('   - For WW2: world_1940.geojson (or similar)');
  console.log('   - For Interwar: world_1930.geojson (or similar)');
  console.log('4. Save them to public/geo/ with the names listed above');
  console.log('\nAlternatively, you can manually download from:');
  console.log('https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/');
  console.log('\nNote: The repository may have different year files available.');
  console.log('Check the index.json file in the repository for all available years.');
  console.log('\nAfter downloading, the files will be automatically used by the application.');
}

// Run the script
main().catch(console.error);
