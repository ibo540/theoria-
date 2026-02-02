"use client";

import { useEffect, useMemo } from "react";
import { useEventStore } from "@/stores/useEventStore";
import { useMapStore } from "@/stores/useMapStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { useCountryData } from "./useCountryData";
import { MarkerData } from "@/components/marker";
import { getHistoricalMapForEvent, mapHistoricalCountryNames, getAvailableHistoricalMaps } from "@/lib/historical-maps";

const GEOJSON_URL = "/geo/countries.geojson";

/**
 * Check if an item should be visible based on timeline timing
 */
function shouldShowItem(
  item: {
    appearAtTimelinePoint?: string;
    appearAtYear?: number;
    appearAtPosition?: number;
    disappearAtTimelinePoint?: string;
    disappearAtYear?: number;
    disappearAtPosition?: number;
  },
  event: any,
  activeTimelinePointId: string | null
): boolean {
  const currentPoint = activeTimelinePointId
    ? event.timelinePoints?.find((p: any) => p.id === activeTimelinePointId)
    : null;
  
  const currentPosition = currentPoint?.position ?? 0;
  const currentYear = currentPoint?.year ? parseInt(currentPoint.year) : null;
  const timelinePoints = event.timelinePoints || [];

  // Check if item should appear
  // If no timing conditions are set, item should always appear
  let shouldAppear = true;
  
  // Only apply timing filters if timing conditions are explicitly set
  const hasTimingConditions = 
    item.appearAtTimelinePoint !== undefined ||
    item.appearAtYear !== undefined ||
    item.appearAtPosition !== undefined;
  
  if (hasTimingConditions) {
    shouldAppear = false; // Start as false, will be set to true if conditions are met
    
    if (item.appearAtTimelinePoint) {
      if (!activeTimelinePointId) {
        shouldAppear = false;
      } else {
        const appearIndex = timelinePoints.findIndex(
          (p: any) => p.id === item.appearAtTimelinePoint
        );
        const currentIndex = timelinePoints.findIndex(
          (p: any) => p.id === activeTimelinePointId
        );
        shouldAppear = appearIndex >= 0 && currentIndex >= appearIndex;
      }
    } else if (item.appearAtYear !== undefined) {
      if (!activeTimelinePointId) {
        if (timelinePoints.length > 0) {
          const firstPointYear = timelinePoints[0]?.year 
            ? parseInt(timelinePoints[0].year) 
            : null;
          shouldAppear = firstPointYear !== null && firstPointYear >= item.appearAtYear;
        } else {
          const eventStartYear = event.period?.startYear || 
            (event.date ? parseInt(event.date.split('-')[0]) : null);
          shouldAppear = eventStartYear !== null && item.appearAtYear <= eventStartYear;
        }
      } else if (currentYear !== null) {
        shouldAppear = currentYear >= item.appearAtYear;
      } else {
        // No year info available, show by default if no timeline point
        shouldAppear = !activeTimelinePointId;
      }
    } else if (item.appearAtPosition !== undefined) {
      if (!activeTimelinePointId) {
        shouldAppear = item.appearAtPosition <= 0;
      } else {
        shouldAppear = currentPosition >= item.appearAtPosition;
      }
    }
  }
  // If no timing conditions, shouldAppear remains true (always visible)

  // Check if item should disappear
  let shouldDisappear = false;
  
  if (item.disappearAtTimelinePoint) {
    if (activeTimelinePointId) {
      const disappearIndex = timelinePoints.findIndex(
        (p: any) => p.id === item.disappearAtTimelinePoint
      );
      const currentIndex = timelinePoints.findIndex(
        (p: any) => p.id === activeTimelinePointId
      );
      shouldDisappear = disappearIndex >= 0 && currentIndex >= disappearIndex;
    }
  } else if (item.disappearAtYear !== undefined) {
    if (currentYear !== null) {
      shouldDisappear = currentYear >= item.disappearAtYear;
    }
  } else if (item.disappearAtPosition !== undefined) {
    if (activeTimelinePointId) {
      shouldDisappear = currentPosition >= item.disappearAtPosition;
    }
  }

  return shouldAppear && !shouldDisappear;
}

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
    const shouldShow = shouldShowItem(highlight, event, activeTimelinePointId);
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

  // Determine which historical map to use
  const historicalMapConfig = useMemo(() => {
    if (!activeEvent) {
      return getAvailableHistoricalMaps()[0]; // Default to modern
    }
    
    // Use explicitly set period, or auto-detect from event date
    if (activeEvent.historicalMapPeriod) {
      const period = getAvailableHistoricalMaps().find(p => p.id === activeEvent.historicalMapPeriod);
      if (period) return period;
    }
    
    return getHistoricalMapForEvent(activeEvent);
  }, [activeEvent]);

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

    // Map historical country names to modern equivalents for highlighting
    const mappedCountries = mapHistoricalCountryNames(
      filteredCountries,
      historicalMapConfig
    );

    // Debug logging
    if (filteredCountries.length > 0 || mappedCountries.length > 0) {
      console.log("🔍 Country Highlight Debug:", {
        original: activeEvent.highlightedCountries || [],
        countryHighlights: activeEvent.countryHighlights || [],
        afterTimingFilter: filteredCountries,
        afterMapping: mappedCountries,
        historicalMapPeriod: activeEvent.historicalMapPeriod,
        mapConfig: historicalMapConfig.id,
      });
    }

    // Filter unified areas based on timeline
    const filteredUnifiedAreas = (activeEvent.unifiedAreas || []).filter((area: any) =>
      shouldShowItem(area, activeEvent, activeTimelinePointId)
    );

    // Filter connections based on timeline
    const filteredConnections = (activeEvent.connections || []).filter((conn: any) =>
      shouldShowItem(conn, activeEvent, activeTimelinePointId)
    );

    return {
      geojsonUrl: historicalMapConfig.geojsonPath,
      highlightedCountries: mappedCountries,
      connections: filteredConnections,
      unifiedAreas: filteredUnifiedAreas,
      event: activeEvent,
    };
  }, [activeEvent, activeTimelinePointId, historicalMapConfig]);

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
