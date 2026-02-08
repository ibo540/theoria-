/**
 * Hook to handle map camera focus when timeline points change
 * Animates the map camera to the timeline point's focus location
 * @module useTimelineFocus
 */

"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useEventStore } from "@/stores/useEventStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { LatLngTuple } from "@/data/events";

// Configuration for timeline point camera focus
const TIMELINE_FOCUS_CONFIG = {
  duration: 1200, // ms - longer than marker focus for cinematic effect
  padding: { top: 50, bottom: 50, left: 50, right: 50 },
};

/**
 * Hook that watches activeTimelinePointId and animates map camera
 * to the timeline point's focusLocation
 *
 * @param map - MapLibre map instance
 *
 * @example
 * ```tsx
 * const map = useMapStore(state => state.mapInstance);
 * useTimelineFocus(map);
 * // Now when timeline point changes, camera animates to focusLocation
 * ```
 */
export function useTimelineFocus(map: maplibregl.Map | null) {
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore(
    (state) => state.activeTimelinePointId
  );
  const activeTheory = useTheoryStore((state) => state.activeTheory);

  const lastFocusRef = useRef<string | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialSelectionRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!map || !activeEvent || !activeTimelinePointId) {
      isInitialSelectionRef.current = true;
      return;
    }

    // Don't zoom if no theory is selected - user needs to select theory first
    if (!activeTheory) {
      return;
    }

    // Skip the first focus when event is initially selected
    // We don't want to zoom immediately, let user see the whole map first
    if (isInitialSelectionRef.current) {
      isInitialSelectionRef.current = false;
      lastFocusRef.current = activeTimelinePointId;
      return;
    }

    // Only animate if this is a different timeline point
    if (lastFocusRef.current === activeTimelinePointId) {
      return;
    }

    // Find the active timeline point
    const activePoint = activeEvent.timelinePoints?.find(
      (p) => p.id === activeTimelinePointId
    );

    if (!activePoint) {
      return;
    }

    // Helper function to get zoom level based on country size
    const getCountryZoom = (countryName: string): number => {
      // Large countries that need lower zoom to see the whole country
      const largeCountries = [
        'Russia', 'United States', 'Canada', 'China', 'Brazil', 
        'Australia', 'India', 'Argentina', 'Kazakhstan', 'Algeria',
        'Democratic Republic of the Congo', 'Saudi Arabia', 'Mexico',
        'Indonesia', 'Sudan', 'Libya', 'Iran', 'Mongolia', 'Chad',
        'Niger', 'Mali', 'Angola', 'South Africa', 'Colombia', 'Bolivia',
        'Mauritania', 'Egypt', 'Tanzania', 'Nigeria', 'Venezuela'
      ];
      
      // Medium-large countries
      const mediumLargeCountries = [
        'Turkey', 'France', 'Spain', 'Germany', 'Poland', 'Italy',
        'United Kingdom', 'Romania', 'Greece', 'Bulgaria', 'Hungary',
        'Portugal', 'Austria', 'Czech Republic', 'Serbia', 'Iraq',
        'Morocco', 'Uzbekistan', 'Sweden', 'Paraguay', 'Zimbabwe',
        'Japan', 'Philippines', 'Vietnam', 'Thailand', 'Myanmar',
        'Afghanistan', 'Somalia', 'Kenya', 'Madagascar', 'Cameroon'
      ];
      
      const country = countryName.trim();
      
      if (largeCountries.some(c => country.toLowerCase().includes(c.toLowerCase()))) {
        return 3; // Very low zoom for large countries
      } else if (mediumLargeCountries.some(c => country.toLowerCase().includes(c.toLowerCase()))) {
        return 4; // Medium zoom for medium-large countries
      } else {
        return 5; // Default zoom for smaller countries
      }
    };

    // Check if point has focus location, or try to use linked icon coordinates
    let focusLocation = activePoint.focusLocation;
    let focusZoom = activePoint.focusZoom;

    // If no focusLocation, try to find linked country icon
    if (!focusLocation || !isValidCoordinate(focusLocation)) {
      const linkedIcon = activeEvent.countryIcons?.find(
        icon => icon.timelinePointId === activeTimelinePointId
      );
      
      if (linkedIcon && linkedIcon.coordinates) {
        // Use icon coordinates as focus location
        focusLocation = linkedIcon.coordinates;
        // Calculate zoom based on country size if not explicitly set
        if (!focusZoom && linkedIcon.country) {
          focusZoom = getCountryZoom(linkedIcon.country);
        } else {
          focusZoom = focusZoom || 5; // Default zoom
        }
      } else {
        console.warn(
          `Timeline point "${activePoint.label}" has no valid focusLocation or linked icon`
        );
        return;
      }
    } else {
      // If focusLocation is set but no zoom, try to get country from linked icon
      if (!focusZoom) {
        const linkedIcon = activeEvent.countryIcons?.find(
          icon => icon.timelinePointId === activeTimelinePointId
        );
        if (linkedIcon?.country) {
          focusZoom = getCountryZoom(linkedIcon.country);
        } else {
          focusZoom = 5; // Default zoom
        }
      }
    }

    // Update last focus reference
    lastFocusRef.current = activeTimelinePointId;

    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Stop any ongoing map animations
    map.stop();

    // Get current bearing and pitch to maintain orientation
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();

    // Convert [lat, lng] to [lng, lat] for MapLibre
    const [lat, lng] = focusLocation;
    const mapLibreCenter: [number, number] = [lng, lat];

    // Animate camera to timeline point focus location
    map.flyTo({
      center: mapLibreCenter,
      zoom: focusZoom,
      bearing: currentBearing,
      pitch: currentPitch,
      duration: TIMELINE_FOCUS_CONFIG.duration,
      essential: true,
      padding: TIMELINE_FOCUS_CONFIG.padding,
      easing: (t) => {
        // easeInOutCubic
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },
    });

    // Optional: Add a small delay before considering animation complete
    animationTimeoutRef.current = setTimeout(() => {
      // Animation complete - could trigger additional effects here
      }, TIMELINE_FOCUS_CONFIG.duration);
  }, [map, activeEvent, activeTimelinePointId, activeTheory]);
}

/**
 * Validate that coordinates are within valid ranges
 */
function isValidCoordinate(coords: LatLngTuple): boolean {
  const [lat, lng] = coords;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

