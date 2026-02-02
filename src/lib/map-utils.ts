/**
 * Map utility functions for geographic calculations and data processing
 */

type CountryFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { name: string; [key: string]: unknown }
>;

/**
 * Get country centroid - uses largest polygon for MultiPolygons
 */
export function getCountryCentroid(
  feature: CountryFeature
): [number, number] | null {
  const geom = feature.geometry;
  if (!geom) return null;

  if (geom.type === "Polygon") {
    return calculatePolygonCentroid(geom.coordinates[0]);
  }

  if (geom.type === "MultiPolygon") {
    // Use largest polygon (by point count)
    let largest: number[][] | null = null;
    let maxLen = 0;
    for (const poly of geom.coordinates) {
      const len = poly[0]?.length || 0;
      if (len > maxLen) {
        maxLen = len;
        largest = poly[0];
      }
    }
    return largest ? calculatePolygonCentroid(largest) : null;
  }

  return null;
}

/**
 * Calculate polygon centroid - simple and efficient
 */
function calculatePolygonCentroid(coords: number[][]): [number, number] | null {
  if (!coords || coords.length < 3) return null;

  let area = 0;
  let x = 0;
  let y = 0;
  const len = coords.length - 1;

  for (let i = 0; i < len; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (Math.abs(area) < 1e-6) {
    // Fallback: simple average
    let sumX = 0,
      sumY = 0;
    for (const [px, py] of coords) {
      sumX += px;
      sumY += py;
    }
    return [sumX / coords.length, sumY / coords.length];
  }

  return [x / (6 * area), y / (6 * area)];
}

/**
 * Calculate average center point of coordinates
 */
export function calculateCenterPoint(
  coords: [number, number][]
): [number, number] | null {
  if (!coords.length) return null;

  let sumX = 0,
    sumY = 0;
  for (const [x, y] of coords) {
    sumX += x;
    sumY += y;
  }
  return [sumX / coords.length, sumY / coords.length];
}

/**
 * Calculate maximum distance between points (optimized)
 */
export function calculateMaxDistance(coords: [number, number][]): number {
  let max = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    for (let j = i + 1; j < coords.length; j++) {
      const [x2, y2] = coords[j];
      const dx = x2 - x1;
      const dy = y2 - y1;
      max = Math.max(max, dx * dx + dy * dy);
    }
  }
  return Math.sqrt(max);
}

/**
 * Calculate optimal zoom level based on distance between points
 * @param maxDistance - Maximum distance between points
 * @param minZoom - Minimum zoom level (default: 1.5)
 * @param maxZoom - Maximum zoom level (default: 3)
 * @param baseZoom - Base zoom calculation factor (default: 3.5, higher = more zoomed in)
 */
export function calculateOptimalZoom(
  maxDistance: number,
  minZoom: number = 1.5,
  maxZoom: number = 3,
  baseZoom: number = 3.5
): number {
  return Math.max(
    minZoom,
    Math.min(maxZoom, baseZoom - Math.log(maxDistance + 1))
  );
}

/**
 * Filter features by country names - simple and fast
 * Also checks multiple property names and does partial matching
 */
export function filterCountriesByNames(
  features: GeoJSON.Feature[],
  countryNames: string[]
): CountryFeature[] {
  const names = new Set(countryNames.map((n) => n.toLowerCase().trim()));
  const matchedFeatures: CountryFeature[] = [];
  
  for (const feature of features) {
    // Check multiple possible property names
    const possibleNames = [
      feature.properties?.name,
      feature.properties?.NAME,
      feature.properties?.NAME_EN,
      feature.properties?.name_en,
      feature.properties?.NAME_LONG,
      feature.properties?.name_long,
    ].filter(Boolean).map((n) => String(n).toLowerCase().trim());
    
    // Check if any of the possible names match
    let isMatch = false;
    for (const possibleName of possibleNames) {
      if (names.has(possibleName)) {
        isMatch = true;
        break;
      }
      // Also try partial matching (e.g., "United Kingdom" matches "United Kingdom of Great Britain and Ireland")
      for (const searchName of names) {
        if (possibleName.includes(searchName) || searchName.includes(possibleName)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) break;
    }
    
    if (isMatch) {
      matchedFeatures.push(feature as CountryFeature);
    }
  }
  
  // Log if no matches found (for debugging)
  if (matchedFeatures.length === 0 && countryNames.length > 0) {
    console.warn("No countries matched for:", countryNames);
    console.warn("Available country names (first 20):", 
      Array.from(new Set(features.slice(0, 20).map(f => f.properties?.name || f.properties?.NAME || 'unknown')))
    );
  }
  
  return matchedFeatures;
}

/**
 * Calculate average centroid from multiple centroids
 */
export function calculateUnifiedAreaCentroid(
  centroids: [number, number][]
): [number, number] | null {
  if (!centroids.length) return null;
  if (centroids.length === 1) return centroids[0];

  let sumX = 0,
    sumY = 0;
  for (const [x, y] of centroids) {
    sumX += x;
    sumY += y;
  }
  return [sumX / centroids.length, sumY / centroids.length];
}

/**
 * Merge countries into one MultiPolygon feature
 */
export function mergeCountryFeatures(
  features: CountryFeature[]
): GeoJSON.Feature<GeoJSON.MultiPolygon> | null {
  if (!features.length) return null;

  const coords: number[][][][] = [];
  for (const f of features) {
    if (f.geometry.type === "Polygon") {
      coords.push(f.geometry.coordinates);
    } else if (f.geometry.type === "MultiPolygon") {
      coords.push(...f.geometry.coordinates);
    }
  }

  return {
    type: "Feature",
    properties: {
      name: features.map((f) => f.properties.name).join(" + "),
      isUnified: true,
    },
    geometry: { type: "MultiPolygon", coordinates: coords },
  };
}

/**
 * Simplify coordinates to a percentage of original points
 * Simple uniform sampling - keeps first, last, and evenly spaced points in between
 */
function reducePoints(coords: number[][], keepPercent: number): number[][] {
  if (coords.length < 3 || keepPercent >= 1) return coords;

  const target = Math.max(3, Math.round(coords.length * keepPercent));
  if (coords.length <= target) return coords;

  const result: number[][] = [coords[0]];
  const step = (coords.length - 1) / (target - 1);

  for (let i = 1; i < target - 1; i++) {
    result.push(coords[Math.round(i * step)]);
  }

  result.push(coords[coords.length - 1]);
  return result;
}

/**
 * Simplify a GeoJSON feature to 10% of original points for better performance
 */
export function simplifyFeature(
  feature: CountryFeature,
  keepPercent: number = 0.1
): CountryFeature {
  const geom = feature.geometry;

  if (geom.type === "Polygon") {
    return {
      ...feature,
      geometry: {
        ...geom,
        coordinates: geom.coordinates.map((ring) =>
          reducePoints(ring, keepPercent)
        ),
      },
    };
  }

  if (geom.type === "MultiPolygon") {
    return {
      ...feature,
      geometry: {
        ...geom,
        coordinates: geom.coordinates.map((poly) =>
          poly.map((ring) => reducePoints(ring, keepPercent))
        ),
      },
    };
  }

  return feature;
}

/**
 * Create a GeoJSON LineString feature between two points
 */
export function createConnectionLine(
  from: [number, number],
  to: [number, number],
  properties?: Record<string, unknown>
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: properties || {},
    geometry: {
      type: "LineString",
      coordinates: [from, to],
    },
  };
}
