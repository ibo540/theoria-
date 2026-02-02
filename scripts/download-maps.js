/**
 * Download historical map GeoJSON files
 * Run with: node scripts/download-maps.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GEO_DIR = path.join(__dirname, '../public/geo');

// Create directory if it doesn't exist
if (!fs.existsSync(GEO_DIR)) {
  fs.mkdirSync(GEO_DIR, { recursive: true });
}

// Files to download with their GitHub raw URLs
// Note: These are example URLs - you may need to adjust the year based on what's available
const FILES_TO_DOWNLOAD = [
  {
    filename: 'countries-cold-war.geojson',
    url: 'https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/world_1950.geojson',
    description: 'Cold War era (1950)'
  },
  {
    filename: 'countries-ww2.geojson',
    url: 'https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/world_1940.geojson',
    description: 'WW2 era (1940)'
  },
  {
    filename: 'countries-interwar.geojson',
    url: 'https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/world_1930.geojson',
    description: 'Interwar period (1930)'
  },
  {
    filename: 'countries-post-cold-war.geojson',
    url: 'https://raw.githubusercontent.com/aourednik/historical-basemaps/main/geojson/world_2000.geojson',
    description: 'Post-Cold War (2000)'
  }
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`\nDownloading: ${url}`);
    console.log(`Saving to: ${filepath}`);
    
    const file = fs.createWriteStream(filepath);
    let downloadedBytes = 0;
    
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        console.log(`\n✓ Successfully downloaded: ${path.basename(filepath)}`);
        console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
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

async function main() {
  console.log('Historical Map Files Downloader');
  console.log('================================\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const fileInfo of FILES_TO_DOWNLOAD) {
    const filepath = path.join(GEO_DIR, fileInfo.filename);
    
    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log(`\n⏭ Skipping ${fileInfo.filename} (already exists, ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      successCount++;
      continue;
    }
    
    try {
      await downloadFile(fileInfo.url, filepath);
      successCount++;
    } catch (error) {
      console.error(`\n✗ Failed to download ${fileInfo.filename}:`);
      console.error(`  ${error.message}`);
      console.error(`\n  Manual download: ${fileInfo.url}`);
      console.error(`  Or visit: https://github.com/aourednik/historical-basemaps/tree/main/geojson`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\nDownload Summary:`);
  console.log(`  ✓ Successful: ${successCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log(`\nNote: Some files failed to download.`);
    console.log(`You can manually download them from:`);
    console.log(`https://github.com/aourednik/historical-basemaps/tree/main/geojson`);
    console.log(`\nCheck the index.json file in that repository for available years.`);
  } else {
    console.log(`\n✓ All files downloaded successfully!`);
    console.log(`The historical maps are now ready to use.`);
  }
}

main().catch(console.error);
