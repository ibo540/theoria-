/**
 * Utilities for extracting and normalizing timeline point map data
 * @module timeline-map-utils
 */

import {
  TimelinePoint,
  MapArea,
  MapFlow,
  LatLngTuple,
  MilitaryBase,
  MapInfluenceCircle,
  MapMovement,
  MapConflict,
} from "@/data/events";
import { MarkerData } from "@/components/marker";

/**
 * Unified structure for timeline point map visualization
 * This is what gets passed to map rendering hooks
 */
export interface TimelineMapVisualization {
  /** Map markers for this timeline point */
  markers: Map<string, MarkerData>;
  /** Area overlays (circles, polygons) */
  areas: MapArea[];
  /** Flows/connections (arrows, movements) */
  flows: MapFlow[];
  /** Camera focus location */
  focusLocation: LatLngTuple | null;
  /** Camera zoom level */
  focusZoom: number;
  /** Optional countries to highlight for this specific point */
  highlightCountries?: string[];
}

/**
 * Extract and normalize map data from a timeline point
 * Handles both new (points/areas/flows) and legacy (militaryBases/influence) formats
 */
export function extractTimelinePointMapData(
  point: TimelinePoint | null | undefined
): TimelineMapVisualization {
  // Default empty state
  if (!point) {
    return {
      markers: new Map(),
      areas: [],
      flows: [],
      focusLocation: null,
      focusZoom: 3,
    };
  }

  const mapData = point.mapData;
  const markers = new Map<string, MarkerData>();
  const areas: MapArea[] = [];
  const flows: MapFlow[] = [];

  // Extract focus information
  const focusLocation = point.focusLocation || null;
  const focusZoom = point.focusZoom || 5;

  if (!mapData) {
    return {
      markers,
      areas,
      flows,
      focusLocation,
      focusZoom,
    };
  }

  // ============================================
  // NEW FORMAT: points, areas, flows
  // ============================================

  // Process points → markers
  if (mapData.points) {
    mapData.points.forEach((point, index) => {
      const markerId = `timeline-point-${point.label}-${index}`;
      const marker: MarkerData = {
        id: markerId,
        position: point.coords,
        name: point.label,
        label: point.label,
        kind: point.kind || "city",
        size: point.size || 5,
        actorId: point.actorId,
        timelinePointLabel: point.label,
      };
      markers.set(markerId, marker);
    });
  }

  // Process areas (already in correct format)
  if (mapData.areas) {
    areas.push(...mapData.areas);
  }

  // Process flows (already in correct format)
  if (mapData.flows) {
    flows.push(...mapData.flows);
  }

  // ============================================
  // LEGACY FORMAT: militaryBases, influence, movements, conflicts
  // ============================================

  // Legacy: militaryBases → points
  if (mapData.militaryBases) {
    mapData.militaryBases.forEach((base: MilitaryBase, index) => {
      const markerId = `timeline-base-${base.name}-${index}`;
      const marker: MarkerData = {
        id: markerId,
        position: base.position,
        name: base.name,
        label: base.name,
        kind: "base",
        size: base.size,
        country: base.country,
      };
      markers.set(markerId, marker);
    });
  }

  // Legacy: influence → areas
  if (mapData.influence) {
    mapData.influence.forEach((inf: MapInfluenceCircle) => {
      const area: MapArea = {
        shape: "circle",
        center: inf.center,
        radiusKm: inf.radius / 1000, // Convert meters to km
        kind: "influence",
        label: inf.label || inf.country,
      };
      areas.push(area);
    });
  }

  // Legacy: movements → flows
  if (mapData.movements) {
    mapData.movements.forEach((mov: MapMovement) => {
      const flow: MapFlow = {
        from: mov.from,
        to: mov.to,
        kind: mov.type,
        label: mov.label,
      };
      flows.push(flow);
    });
  }

  // Legacy: conflicts → areas
  if (mapData.conflicts) {
    mapData.conflicts.forEach((conflict: MapConflict) => {
      const area: MapArea = {
        shape: "circle",
        center: conflict.position,
        radiusKm: 50 * (conflict.intensity / 10), // Scale by intensity
        kind: "conflict-zone",
        label: conflict.name,
      };
      areas.push(area);
    });
  }

  // Legacy: troops → markers (using TroopPresence which is still current)
  if (mapData.troops) {
    mapData.troops.forEach((troop, index) => {
      const markerId = `timeline-troop-${troop.name}-${index}`;
      const marker: MarkerData = {
        id: markerId,
        position: troop.position,
        name: troop.name,
        label: troop.name,
        kind: "military",
        size: Math.min(10, Math.ceil(troop.strength / 10000)), // Scale by strength
      };
      markers.set(markerId, marker);
    });
  }

  // Auto-derive highlighted countries from markers and areas
  const highlightCountries = deriveHighlightedCountries(markers, areas);

  return {
    markers,
    areas,
    flows,
    focusLocation,
    focusZoom,
    highlightCountries,
  };
}

/**
 * Auto-derive which countries should be highlighted from map data
 * Extracts country names from markers and area labels
 */
function deriveHighlightedCountries(
  markers: Map<string, MarkerData>,
  areas: MapArea[]
): string[] {
  const countries = new Set<string>();

  // Extract from markers
  markers.forEach((marker) => {
    if (marker.country) {
      countries.add(marker.country);
    }
  });

  // Extract from area labels (if they match country names)
  areas.forEach((area) => {
    if (area.label) {
      // Simple heuristic: if label contains common country indicators
      const label = area.label.toLowerCase();
      if (
        label.includes("usa") ||
        label.includes("united states") ||
        label.includes("america")
      ) {
        countries.add("United States of America");
      }
      if (label.includes("ussr") || label.includes("soviet")) {
        countries.add("Russia");
      }
      if (label.includes("china") || label.includes("chinese")) {
        countries.add("China");
      }
      // Add more as needed
    }
  });

  return Array.from(countries);
}

/**
 * Find a timeline point that contains a specific marker location
 * Used for bidirectional map → timeline linking
 */
export function findTimelinePointForLocation(
  location: LatLngTuple,
  timelinePoints: TimelinePoint[],
  threshold: number = 0.5 // degrees (~55km at equator)
): string | null {
  for (const point of timelinePoints) {
    // Check focus location
    if (point.focusLocation) {
      const distance = calculateDistance(location, point.focusLocation);
      if (distance < threshold) {
        return point.id;
      }
    }

    // Check map data points
    const mapData = point.mapData;
    if (!mapData) continue;

    // Check new format points
    if (mapData.points) {
      for (const p of mapData.points) {
        const distance = calculateDistance(location, p.coords);
        if (distance < threshold) {
          return point.id;
        }
      }
    }

    // Check legacy military bases
    if (mapData.militaryBases) {
      for (const base of mapData.militaryBases) {
        const distance = calculateDistance(location, base.position);
        if (distance < threshold) {
          return point.id;
        }
      }
    }
  }

  return null;
}

/**
 * Simple distance calculation between two lat/lng points (haversine)
 * Returns distance in degrees (approximate)
 */
function calculateDistance(
  [lat1, lng1]: LatLngTuple,
  [lat2, lng2]: LatLngTuple
): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Get all unique countries referenced across all timeline points
 * Useful for event-level country highlighting
 */
export function getAllTimelineCountries(
  timelinePoints: TimelinePoint[]
): string[] {
  const allCountries = new Set<string>();

  timelinePoints.forEach((point) => {
    const viz = extractTimelinePointMapData(point);
    if (viz.highlightCountries) {
      viz.highlightCountries.forEach((c) => allCountries.add(c));
    }
  });

  return Array.from(allCountries).sort();
}
