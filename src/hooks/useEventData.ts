"use client";

import { useEffect, useMemo } from "react";
import { useEventStore } from "@/stores/useEventStore";
import { useMapStore } from "@/stores/useMapStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { useCountryData } from "./useCountryData";
import { MarkerData } from "@/components/marker";

const GEOJSON_URL = "/geo/countries.geojson";

/**
 * Filter highlighted countries based on current timeline position
 * Only shows countries that should appear at the current timeline point
 */
function filterHighlightedCountriesByTiming(
  event: any,
  activeTimelinePointId: string | null
): string[] {
  // If no timed highlights configured, use all highlighted countries
  if (!event.countryHighlights || event.countryHighlights.length === 0) {
    return event.highlightedCountries || [];
  }

  // Get current timeline point info
  const currentPoint = activeTimelinePointId
    ? event.timelinePoints?.find((p: any) => p.id === activeTimelinePointId)
    : null;
  
  const currentPosition = currentPoint?.position ?? 0;
  const currentYear = currentPoint?.year ? parseInt(currentPoint.year) : null;

  // Filter countries based on timing conditions
  const visibleCountries: string[] = [];
  const timelinePoints = event.timelinePoints || [];

  for (const highlight of event.countryHighlights) {
    let shouldShow = false;

    // Check if highlight should appear based on timeline point
    if (highlight.appearAtTimelinePoint) {
      if (!activeTimelinePointId) {
        // No timeline point active - don't show timed highlights that require a specific point
        shouldShow = false;
      } else {
        // Find the indices of the appear point and current point
        const appearIndex = timelinePoints.findIndex(
          (p: any) => p.id === highlight.appearAtTimelinePoint
        );
        const currentIndex = timelinePoints.findIndex(
          (p: any) => p.id === activeTimelinePointId
        );
        
        // Show if we're at or past the point where it should appear
        shouldShow = appearIndex >= 0 && currentIndex >= appearIndex;
      }
    }
    // Check if highlight should appear based on year
    else if (highlight.appearAtYear !== undefined) {
      if (!activeTimelinePointId) {
        // No timeline point active - check if any timeline point has reached this year
        // If timeline points exist, only show if first point's year >= appearAtYear
        if (timelinePoints.length > 0) {
          const firstPointYear = timelinePoints[0]?.year 
            ? parseInt(timelinePoints[0].year) 
            : null;
          shouldShow = firstPointYear !== null && firstPointYear >= highlight.appearAtYear;
        } else {
          // No timeline points - check event start year
          const eventStartYear = event.period?.startYear || 
            (event.date ? parseInt(event.date.split('-')[0]) : null);
          shouldShow = eventStartYear !== null && highlight.appearAtYear <= eventStartYear;
        }
      } else if (currentYear !== null) {
        // Show if current year is at or past the appear year
        shouldShow = currentYear >= highlight.appearAtYear;
      }
    }
    // Check if highlight should appear based on position
    else if (highlight.appearAtPosition !== undefined) {
      if (!activeTimelinePointId) {
        // No timeline point active - only show if position is 0 or less (immediate)
        shouldShow = highlight.appearAtPosition <= 0;
      } else {
        // Show if current position is at or past the appear position
        shouldShow = currentPosition >= highlight.appearAtPosition;
      }
    }
    // No timing specified - show immediately (always visible)
    else {
      shouldShow = true;
    }

    if (shouldShow) {
      visibleCountries.push(highlight.country);
    }
  }

  return visibleCountries;
}

/**
 * Hook that syncs geo data from useCountryData into the EventStore
 * This bridges React hooks (useCountryData) with Zustand store
 */
export function useEventData() {
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore(
    (state) => state.activeTimelinePointId
  );
  const setGeoData = useEventStore((state) => state.setGeoData);
  const setHighlightsVisible = useMapStore(
    (state) => state.setHighlightsVisible
  );
  const setActiveTheory = useTheoryStore((state) => state.setActiveTheory);

  // Prepare event configuration for geolocation data processing
  const eventConfig = useMemo(() => {
    if (!activeEvent) {
      return {
        geojsonUrl: GEOJSON_URL,
        highlightedCountries: [],
        connections: [],
        unifiedAreas: [],
        event: null,
      };
    }

    // Filter highlighted countries based on current timeline position
    const filteredCountries = filterHighlightedCountriesByTiming(
      activeEvent,
      activeTimelinePointId
    );

    return {
      geojsonUrl: GEOJSON_URL,
      highlightedCountries: filteredCountries,
      connections: activeEvent.connections,
      unifiedAreas: activeEvent.unifiedAreas || [],
      event: activeEvent,
    };
  }, [activeEvent, activeTimelinePointId]);

  // Process geolocation data (markers, boundaries, connections, drawn shapes)
  const {
    markers: rawMarkers,
    highlighted,
    connections,
    drawnShapes,
    centroids,
    countriesInUnifiedAreas,
    isLoading,
    error,
  } = useCountryData(eventConfig);

  // Ensure markers are always Map<string, MarkerData>
  const markers = useMemo(() => {
    return rawMarkers as Map<string, MarkerData>;
  }, [rawMarkers]);

  // Sync geo data to store
  useEffect(() => {
    setGeoData({
      markers,
      highlighted,
      connections,
      drawnShapes: drawnShapes || null,
      centroids,
      countriesInUnifiedAreas,
      isLoading,
      error,
    });
  }, [
    markers,
    highlighted,
    connections,
    drawnShapes,
    centroids,
    countriesInUnifiedAreas,
    isLoading,
    error,
    setGeoData,
  ]);

  // Automatically enable highlights when an event is selected
  // Reset theory when event is deselected
  useEffect(() => {
    if (activeEvent) {
      setHighlightsVisible(true);
    } else {
      setHighlightsVisible(false);
      setActiveTheory(null);
    }
  }, [activeEvent, setHighlightsVisible, setActiveTheory]);
}
