/**
 * Hook to extract and process map data from the active timeline point
 * This bridges timeline state with map visualization
 * @module useTimelinePointData
 */

"use client";

import { useMemo } from "react";
import { useEventStore } from "@/stores/useEventStore";
import {
  extractTimelinePointMapData,
  TimelineMapVisualization,
} from "@/lib/timeline-map-utils";

/**
 * Custom hook that watches activeTimelinePointId and returns
 * the map visualization data for the current timeline point
 *
 * @returns TimelineMapVisualization with markers, areas, flows, and focus info
 *
 * @example
 * ```tsx
 * const timelineViz = useTimelinePointData();
 * // timelineViz.markers → Map<string, MarkerData>
 * // timelineViz.areas → MapArea[]
 * // timelineViz.flows → MapFlow[]
 * // timelineViz.focusLocation → [lat, lng] | null
 * ```
 */
export function useTimelinePointData(): TimelineMapVisualization {
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore(
    (state) => state.activeTimelinePointId
  );

  return useMemo(() => {
    // If no event or no timeline point is active, return empty state
    if (!activeEvent || !activeTimelinePointId) {
      return {
        markers: new Map(),
        areas: [],
        flows: [],
        focusLocation: null,
        focusZoom: 3,
      };
    }

    // Find the active timeline point
    const activePoint = activeEvent.timelinePoints?.find(
      (p) => p.id === activeTimelinePointId
    );

    // Extract and normalize its map data
    return extractTimelinePointMapData(activePoint);
  }, [activeEvent, activeTimelinePointId]);
}


