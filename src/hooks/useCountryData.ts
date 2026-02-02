import { useEffect, useState, useMemo, useRef } from "react";
import {
  filterCountriesByNames,
  getCountryCentroid,
  createConnectionLine,
  calculateUnifiedAreaCentroid,
  simplifyFeature,
} from "@/lib/map-utils";
import { MarkerData } from "@/components/marker";
import { EventData } from "@/data/events";
import { enrichMarkerData } from "@/lib/marker-utils";

/**
 * Defines a unified area - a group of neighboring countries treated as one region
 * Import from @/data/events for the full interface
 */
import { UnifiedArea } from "@/data/events";
export type { UnifiedArea };

/**
 * Connection between two points - can be country names or unified area IDs
 */
interface ConnectionConfig {
  from: string;
  to: string;
}

interface UseCountryDataOptions {
  geojsonUrl: string;
  highlightedCountries: string[];
  connections: ConnectionConfig[];
  /** Optional: Define unified areas (groups of countries with a single marker) */
  unifiedAreas?: UnifiedArea[];
  /** Optional: Event data for enriching markers */
  event?: EventData | null;
}

/**
 * Global cache for GeoJSON data to avoid re-fetching the same URL
 * This significantly improves performance when switching between events
 */
const geojsonCache = new Map<string, GeoJSON.FeatureCollection>();
const fetchPromises = new Map<string, Promise<GeoJSON.FeatureCollection>>();

/**
 * Fetch GeoJSON with caching and deduplication
 */
async function fetchGeoJSON(url: string): Promise<GeoJSON.FeatureCollection> {
  // Return cached data if available
  if (geojsonCache.has(url)) {
    return geojsonCache.get(url)!;
  }

  // Return existing promise if fetch is in progress
  if (fetchPromises.has(url)) {
    return fetchPromises.get(url)!;
  }

  // Create new fetch promise
  const promise = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to load GeoJSON: ${res.status} ${res.statusText}`
        );
      }
      const data = (await res.json()) as GeoJSON.FeatureCollection;
      geojsonCache.set(url, data);
      return data;
    })
    .finally(() => {
      fetchPromises.delete(url);
    });

  fetchPromises.set(url, promise);
  return promise;
}

/**
 * Normalize country name for consistent comparison
 */
function normalizeCountryName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Create a stable key for memoization based on inputs
 */
function createMemoKey(
  highlightedCountries: string[],
  unifiedAreas: UnifiedArea[],
  eventId: string | null
): string {
  const countriesKey = highlightedCountries.sort().join(",");
  const areasKey = unifiedAreas
    .map((a) => `${a.id}:${a.countries.sort().join(",")}`)
    .join("|");
  return `${countriesKey}|${areasKey}|${eventId || ""}`;
}

export function useCountryData({
  geojsonUrl,
  highlightedCountries,
  connections,
  unifiedAreas = [],
  event = null,
}: UseCountryDataOptions) {
  const [worldData, setWorldData] = useState<GeoJSON.FeatureCollection | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch world data with caching
  useEffect(() => {
    // Cancel previous request if URL changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let cancelled = false;

    async function loadWorld() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchGeoJSON(geojsonUrl);

        if (!cancelled && !abortController.signal.aborted) {
          setWorldData(data);
        }
      } catch (err) {
        if (!cancelled && !abortController.signal.aborted) {
          const error = err instanceof Error ? err : new Error("Unknown error");
          setError(error);
          console.error("Failed to fetch countries geojson", error);
        }
      } finally {
        if (!cancelled && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadWorld();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [geojsonUrl]);

  // Process highlighted countries and calculate centroids
  // Use stable memoization key to prevent unnecessary recalculations
  const memoKey = useMemo(
    () => createMemoKey(highlightedCountries, unifiedAreas, event?.id || null),
    [highlightedCountries, unifiedAreas, event?.id]
  );

  const { highlighted, centroids, markers, countriesInUnifiedAreas } =
    useMemo(() => {
      if (!worldData || !highlightedCountries?.length) {
        if (highlightedCountries?.length === 0 && event) {
          console.warn("⚠️ No highlighted countries provided for event:", event.id);
        }
        return {
          highlighted: null,
          centroids: new Map<string, [number, number]>(),
          markers: new Map<string, MarkerData>(),
          countriesInUnifiedAreas: new Set<string>(),
        };
      }

      console.log("🗺️ Filtering countries:", {
        searchingFor: highlightedCountries,
        totalFeatures: worldData.features.length,
        geojsonUrl,
      });

      // Filter and simplify features in one pass
      const filteredFeatures = filterCountriesByNames(
        worldData.features,
        highlightedCountries
      );

      console.log("✅ Filtered features:", {
        found: filteredFeatures.length,
        countries: filteredFeatures.map(f => f.properties?.name || f.properties?.NAME || 'unknown'),
      });

      // Simplify features to optimize rendering (reduce to 10% of original points)
      const features = filteredFeatures.map((feature) =>
        simplifyFeature(feature, 0.1)
      );

      // Build set of countries in unified areas (pre-compute for O(1) lookup)
      const countriesInAreas = new Set<string>();
      unifiedAreas.forEach((area) =>
        area.countries.forEach((c) =>
          countriesInAreas.add(normalizeCountryName(c))
        )
      );

      // Calculate centroids for all countries in one pass
      const centroidMap = new Map<string, [number, number]>();
      for (const feature of features) {
        const name = normalizeCountryName(feature.properties?.name || "");
        if (name) {
          const centroid = getCountryCentroid(feature);
          if (centroid) {
            centroidMap.set(name, centroid);
          }
        }
      }

      // Create marker map (for individual countries + unified areas)
      const markerMap = new Map<string, MarkerData>();

      // Add individual country markers (only for countries NOT in unified areas)
      for (const feature of features) {
        const name = normalizeCountryName(feature.properties?.name || "");
        const normalName = feature.properties?.name || "";
        const centroid = centroidMap.get(name);

        if (name && centroid && !countriesInAreas.has(name)) {
          const enrichedMarker = enrichMarkerData(
            name,
            normalName,
            centroid,
            false,
            event
          );
          markerMap.set(name, enrichedMarker);
        }
      }

      // Add unified area markers
      for (const area of unifiedAreas) {
        const areaCentroids: [number, number][] = [];

        for (const countryName of area.countries) {
          const normalizedName = normalizeCountryName(countryName);
          const centroid = centroidMap.get(normalizedName);
          if (centroid) {
            areaCentroids.push(centroid);
          }
        }

        if (areaCentroids.length > 0) {
          const unifiedCentroid = calculateUnifiedAreaCentroid(areaCentroids);
          if (unifiedCentroid) {
            const areaId = normalizeCountryName(area.id);
            const enrichedMarker = enrichMarkerData(
              areaId,
              area.name,
              unifiedCentroid,
              true,
              event,
              area
            );
            markerMap.set(areaId, enrichedMarker);
          }
        }
      }

      return {
        highlighted: {
          type: "FeatureCollection",
          features,
        } as GeoJSON.FeatureCollection,
        centroids: centroidMap,
        markers: markerMap,
        countriesInUnifiedAreas: countriesInAreas,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [worldData, memoKey, event]);

  // Process connections using markers (unified areas or individual countries)
  // Also handle drawn lines with coordinate data
  const connectionsGeoJSON = useMemo(() => {
    if (!connections?.length) {
      return null;
    }

    const validConnections: GeoJSON.Feature<GeoJSON.LineString>[] = [];

    for (const conn of connections) {
      // Check if this is a drawn line with coordinate data
      const drawnLine = (conn as any).line;
      if (drawnLine && drawnLine.points && Array.isArray(drawnLine.points) && drawnLine.points.length >= 2) {
        // This is a drawn line - use its coordinates directly
        let lineCoordinates: [number, number][];

        if (drawnLine.type === "curved" && drawnLine.controlPoints && drawnLine.controlPoints.length > 0) {
          // Bezier curve - generate points along the curve
          const start = drawnLine.points[0];
          const end = drawnLine.points[drawnLine.points.length - 1];
          const control = drawnLine.controlPoints[0];

          const curvePoints: [number, number][] = [];
          const steps = 50;
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lng = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
            const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];
            curvePoints.push([lng, lat]);
          }
          lineCoordinates = curvePoints;
        } else {
          // Straight line - use points directly
          lineCoordinates = drawnLine.points;
        }

        validConnections.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: lineCoordinates,
          },
          properties: {
            from: conn.from,
            to: conn.to,
            type: (conn as any).type,
            label: (conn as any).label,
            drawn: true,
            thickness: drawnLine.thickness || 3,
            color: drawnLine.color || "#8b5cf6",
            opacity: drawnLine.opacity || 0.7,
          },
        } as GeoJSON.Feature<GeoJSON.LineString>);
        continue;
      }

      // Otherwise, try to find markers for country-based connections
      if (markers.size === 0) continue;

      const fromKey = normalizeCountryName(conn.from);
      const toKey = normalizeCountryName(conn.to);
      const fromMarker = markers.get(fromKey);
      const toMarker = markers.get(toKey);

      if (!fromMarker || !toMarker) continue;

      validConnections.push(
        createConnectionLine(fromMarker.position, toMarker.position, {
          from: conn.from,
          to: conn.to,
          fromName: fromMarker.name,
          toName: toMarker.name,
        })
      );
    }

    if (validConnections.length === 0) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features: validConnections,
    } as GeoJSON.FeatureCollection;
  }, [markers, connections]);

  // Store drawn shapes separately (will be rendered as a separate layer)
  const drawnShapesGeoJSON = useMemo(() => {
    if (!unifiedAreas?.length) return null;

    const drawnShapes: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

    for (const area of unifiedAreas) {
      const drawnShape = (area as any).shape;
      if (drawnShape && drawnShape.coordinates) {
        if (drawnShape.type === "circle" && drawnShape.center && drawnShape.radius) {
          const center: [number, number] = drawnShape.center;
          const radiusKm = drawnShape.radius;
          const points: [number, number][] = [];
          const steps = 64;
          for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            const lat = center[1] + (radiusKm / 111) * Math.sin(angle);
            const lng = center[0] + (radiusKm / 111) * Math.cos(angle) / Math.cos(center[1] * Math.PI / 180);
            points.push([lng, lat]);
          }
          drawnShapes.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [points],
            },
            properties: {
              id: area.id,
              name: area.name,
              color: drawnShape.color || "#10b981",
              opacity: drawnShape.opacity || 0.4,
            },
          } as GeoJSON.Feature<GeoJSON.Polygon>);
        } else if (drawnShape.type === "polygon" && drawnShape.coordinates && drawnShape.coordinates.length >= 3) {
          drawnShapes.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[...drawnShape.coordinates, drawnShape.coordinates[0]]],
            },
            properties: {
              id: area.id,
              name: area.name,
              color: drawnShape.color || "#10b981",
              opacity: drawnShape.opacity || 0.4,
            },
          } as GeoJSON.Feature<GeoJSON.Polygon>);
        }
      }
    }

    return drawnShapes.length > 0 ? {
      type: "FeatureCollection",
      features: drawnShapes,
    } as GeoJSON.FeatureCollection : null;
  }, [unifiedAreas]);

  return {
    worldData,
    highlighted,
    centroids,
    markers,
    countriesInUnifiedAreas,
    connections: connectionsGeoJSON,
    drawnShapes: drawnShapesGeoJSON,
    isLoading,
    error,
  };
}
