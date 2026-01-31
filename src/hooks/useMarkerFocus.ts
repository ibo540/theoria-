import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MARKER_FOCUS_CONFIG } from "@/lib/map-config";

export function useMarkerFocus(
  map: maplibregl.Map | null,
  focusedMarker: [number, number] | null
) {
  const lastFocusedMarkerRef = useRef<[number, number] | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    // Setup interaction listeners to stop animations on user interaction
    const stopAnimation = () => {
      if (isAnimatingRef.current) {
        map.stop(); // Stop all ongoing animations
        isAnimatingRef.current = false;
      }
    };

    // Listen to all user interaction events
    map.on("mousedown", stopAnimation);
    map.on("touchstart", stopAnimation);
    map.on("wheel", stopAnimation);
    map.on("dragstart", stopAnimation);

    // Cleanup function
    return () => {
      map.off("mousedown", stopAnimation);
      map.off("touchstart", stopAnimation);
      map.off("wheel", stopAnimation);
      map.off("dragstart", stopAnimation);
      stopAnimation();

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Only animate if the focused marker has actually changed
    if (focusedMarker) {
      const [lng, lat] = focusedMarker;
      const lastMarker = lastFocusedMarkerRef.current;

      // Check if this is a different marker
      const isDifferentMarker =
        !lastMarker || lastMarker[0] !== lng || lastMarker[1] !== lat;

      if (isDifferentMarker) {
        lastFocusedMarkerRef.current = focusedMarker;

        // Mark animation as active
        isAnimatingRef.current = true;

        // Stop any ongoing animations first
        map.stop();

        // Get current bearing and pitch to keep them locked (no rotation or angle change)
        const currentBearing = map.getBearing();
        const currentPitch = map.getPitch();

        // Use flyTo for smoother, more natural animation without rotation or pitch change
        map.flyTo({
          center: focusedMarker,
          zoom: MARKER_FOCUS_CONFIG.zoom,
          pitch: currentPitch, // Keep current pitch - no angle of view change
          bearing: currentBearing, // Keep current bearing - no rotation
          duration: MARKER_FOCUS_CONFIG.duration,
          essential: true,
          // Smooth easing function for natural deceleration
          easing: (t) => t * (2 - t), // easeOutQuad
        });

        // Reset animating flag after animation completes
        animationTimeoutRef.current = setTimeout(() => {
          isAnimatingRef.current = false;
        }, MARKER_FOCUS_CONFIG.duration);
      }
    } else {
      // Clear the last focused marker when unfocused
      lastFocusedMarkerRef.current = null;
    }
  }, [map, focusedMarker]);
}
