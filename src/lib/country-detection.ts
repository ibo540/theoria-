/**
 * Utility functions for detecting which countries are in shapes or connected by lines
 */

/**
 * Point-in-polygon test using ray casting algorithm
 */
function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if a point is inside a MultiPolygon
 */
function pointInMultiPolygon(point: [number, number], coordinates: number[][][][]): boolean {
  for (const polygon of coordinates) {
    if (polygon[0] && pointInPolygon(point, polygon[0])) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a point is inside a GeoJSON geometry
 */
function pointInGeometry(point: [number, number], geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === "MultiPolygon") {
    return pointInMultiPolygon(point, geometry.coordinates);
  }
  return false;
}

/**
 * Find which country a point is in
 */
export function findCountryAtPoint(
  point: [number, number],
  countriesGeoJSON: GeoJSON.FeatureCollection
): string | null {
  for (const feature of countriesGeoJSON.features) {
    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
      if (pointInGeometry(point, feature.geometry)) {
        return feature.properties?.name || feature.properties?.NAME || null;
      }
    }
  }
  return null;
}

/**
 * Check if a point is inside a circle
 */
function pointInCircle(point: [number, number], center: [number, number], radiusKm: number): boolean {
  const [lng1, lat1] = point;
  const [lng2, lat2] = center;
  
  // Haversine distance calculation
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radiusKm;
}

/**
 * Check if a point is inside a polygon
 */
function pointInPolygonShape(point: [number, number], polygon: [number, number][]): boolean {
  return pointInPolygon(point, polygon);
}

/**
 * Get sample points from a country's geometry
 */
function getCountrySamplePoints(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon, maxPoints: number = 20): [number, number][] {
  const points: [number, number][] = [];
  
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    // Add all vertices
    for (const coord of coords) {
      points.push([coord[0], coord[1]]);
    }
    // Add some interior points if needed
    if (points.length < maxPoints && coords.length > 3) {
      const step = Math.max(1, Math.floor(coords.length / (maxPoints - points.length)));
      for (let i = 0; i < coords.length; i += step) {
        if (points.length >= maxPoints) break;
        points.push([coords[i][0], coords[i][1]]);
      }
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      if (polygon[0]) {
        for (const coord of polygon[0]) {
          if (points.length >= maxPoints) break;
          points.push([coord[0], coord[1]]);
        }
      }
    }
  }
  
  return points;
}

/**
 * Find which countries are in a drawn shape
 * This checks if any part of each country intersects with the shape
 */
export async function detectCountriesInShape(
  shape: {
    type: "circle" | "polygon";
    center?: [number, number];
    radius?: number;
    coordinates?: [number, number][];
  }
): Promise<string[]> {
  try {
    // Load countries GeoJSON
    const response = await fetch("/geo/countries.geojson");
    const countriesGeoJSON: GeoJSON.FeatureCollection = await response.json();
    
    const detectedCountries = new Set<string>();
    
    // Iterate through all countries and check if they intersect with the shape
    for (const feature of countriesGeoJSON.features) {
      if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
        continue;
      }
      
      const countryName = feature.properties?.name || feature.properties?.NAME;
      if (!countryName) continue;
      
      // Get sample points from the country's geometry
      const countryPoints = getCountrySamplePoints(feature.geometry, 30);
      
      let intersects = false;
      
      if (shape.type === "circle" && shape.center && shape.radius) {
        const center = shape.center;
        // Radius is already in kilometers (from MapDrawingTools)
        const radiusKm = typeof shape.radius === "number" ? shape.radius : 100;
        
        // Check if any country point is inside the circle
        for (const point of countryPoints) {
          if (pointInCircle(point, center, radiusKm)) {
            intersects = true;
            break;
          }
        }
        
        // Also check if circle center is inside the country (for small circles)
        if (!intersects && pointInGeometry(center, feature.geometry)) {
          intersects = true;
        }
      } else if (shape.type === "polygon" && shape.coordinates && shape.coordinates.length >= 3) {
        // Check if any country point is inside the polygon
        for (const point of countryPoints) {
          if (pointInPolygonShape(point, shape.coordinates)) {
            intersects = true;
            break;
          }
        }
        
        // Also check if any shape vertex is inside the country
        if (!intersects) {
          for (const point of shape.coordinates) {
            if (pointInGeometry(point, feature.geometry)) {
              intersects = true;
              break;
            }
          }
        }
      }
      
      if (intersects) {
        detectedCountries.add(countryName);
      }
    }
    
    // Also do a dense grid sampling for the shape to catch any countries we might have missed
    if (shape.type === "circle" && shape.center && shape.radius) {
      const center = shape.center;
      // Radius is already in kilometers
      const radiusKm = typeof shape.radius === "number" ? shape.radius : 100;
      
      // Create a denser grid of sample points
      const gridSize = 20;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          // Convert grid coordinates to distance from center
          const dx = (i - gridSize / 2) / (gridSize / 2);
          const dy = (j - gridSize / 2) / (gridSize / 2);
          const r = Math.sqrt(dx * dx + dy * dy) * radiusKm;
          
          if (r <= radiusKm) {
            const angle = Math.atan2(dy, dx);
            const lat = center[1] + (r / 111) * Math.sin(angle);
            const lng = center[0] + (r / 111) * Math.cos(angle) / Math.cos(center[1] * Math.PI / 180);
            
            const country = findCountryAtPoint([lng, lat], countriesGeoJSON);
            if (country) detectedCountries.add(country);
          }
        }
      }
    } else if (shape.type === "polygon" && shape.coordinates && shape.coordinates.length >= 3) {
      // Create a bounding box and sample points
      let minLng = Infinity, maxLng = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of shape.coordinates) {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
      
      // Increase grid density
      const gridSize = 25;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const lng = minLng + (maxLng - minLng) * (i / gridSize);
          const lat = minLat + (maxLat - minLat) * (j / gridSize);
          const point: [number, number] = [lng, lat];
          
          if (pointInPolygonShape(point, shape.coordinates)) {
            const country = findCountryAtPoint(point, countriesGeoJSON);
            if (country) detectedCountries.add(country);
          }
        }
      }
    }
    
    return Array.from(detectedCountries);
  } catch (error) {
    console.error("Error detecting countries in shape:", error);
    return [];
  }
}

/**
 * Find which countries a line connects
 */
export async function detectCountriesForLine(
  line: {
    points: [number, number][];
  }
): Promise<{ from: string | null; to: string | null }> {
  try {
    // Load countries GeoJSON
    const response = await fetch("/geo/countries.geojson");
    const countriesGeoJSON: GeoJSON.FeatureCollection = await response.json();
    
    if (!line.points || line.points.length < 2) {
      return { from: null, to: null };
    }
    
    const startPoint = line.points[0];
    const endPoint = line.points[line.points.length - 1];
    
    const from = findCountryAtPoint(startPoint, countriesGeoJSON);
    const to = findCountryAtPoint(endPoint, countriesGeoJSON);
    
    return { from, to };
  } catch (error) {
    console.error("Error detecting countries for line:", error);
    return { from: null, to: null };
  }
}
