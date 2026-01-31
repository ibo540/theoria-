import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  calculateMaxDistance,
  calculateOptimalZoom,
} from "@/lib/map-utils";
import { CAMERA_ANIMATION_CONFIG } from "@/lib/map-config";

interface CameraAnimationOptions {
  duration?: number;
  bearing?: number;
}

interface DefaultViewOptions {
  center: [number, number];
  zoom: number;
  bearing: number;
  duration?: number;
}

export function useCameraAnimation(
  map: maplibregl.Map | null,
  connections: GeoJSON.FeatureCollection | null,
  isVisible: boolean,
  defaultView: DefaultViewOptions
) {
  const hasAnimatedRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const animationStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!map) return;

    // Setup interaction listeners to stop animations
    const stopAnimation = () => {
      if (isAnimatingRef.current) {
        map.stop(); // Stop all ongoing animations
        isAnimatingRef.current = false;
      }
    };

    map.on("mousedown", stopAnimation);
    map.on("touchstart", stopAnimation);
    map.on("wheel", stopAnimation);
    map.on("dragstart", stopAnimation);

    return () => {
      map.off("mousedown", stopAnimation);
      map.off("touchstart", stopAnimation);
      map.off("wheel", stopAnimation);
      map.off("dragstart", stopAnimation);
      stopAnimation();
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // Prevent animation spam - only animate if enough time has passed
    const now = Date.now();
    if (now - animationStartTimeRef.current < 500) return;

    if (isVisible && connections?.features.length) {
      // Only animate if we haven't animated yet or visibility changed
      if (!hasAnimatedRef.current) {
        animationStartTimeRef.current = now;
        isAnimatingRef.current = true;
        animateToConnectionCenter(map, connections, {
          duration: CAMERA_ANIMATION_CONFIG.connectionDuration,
          bearing: CAMERA_ANIMATION_CONFIG.connectionBearing,
        });
        hasAnimatedRef.current = true;

        // Reset animating flag after animation completes
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, CAMERA_ANIMATION_CONFIG.connectionDuration);
      }
    } else if (hasAnimatedRef.current) {
      // Animate back to default view
      animationStartTimeRef.current = now;
      isAnimatingRef.current = true;
      animateToDefaultView(map, defaultView);
      hasAnimatedRef.current = false;

      // Reset animating flag after animation completes
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, defaultView.duration ?? CAMERA_ANIMATION_CONFIG.defaultDuration);
    }
  }, [map, connections, isVisible, defaultView]);
}

/**
 * Animate camera to focus on the center of connection lines
 */
function animateToConnectionCenter(
  map: maplibregl.Map,
  connections: GeoJSON.FeatureCollection,
  options: CameraAnimationOptions = {}
) {
  const features = connections.features as GeoJSON.Feature<GeoJSON.LineString>[];
  
  if (features.length === 0) return;

  // Collect all points from all connection lines
  const allPoints: [number, number][] = [];
  
  for (const feature of features) {
    if (feature.geometry.type === "LineString") {
      const coords = feature.geometry.coordinates as number[][];
      for (const coord of coords) {
        allPoints.push([coord[0], coord[1]]);
      }
    }
  }

  if (allPoints.length === 0) return;

  // Calculate center point of all connection points
  const totalLng = allPoints.reduce((sum, [lng]) => sum + lng, 0);
  const totalLat = allPoints.reduce((sum, [, lat]) => sum + lat, 0);
  const center: [number, number] = [totalLng / allPoints.length, totalLat / allPoints.length];

  // Calculate optimal zoom based on distance between points
  const maxDistance = calculateMaxDistance(allPoints);
  const zoomLevel = calculateOptimalZoom(maxDistance);

  // Stop any ongoing animations first
  map.stop();

  // Get current pitch to keep it locked (no angle of view change)
  const currentPitch = map.getPitch();

  // Animate to center
  map.easeTo({
    center,
    zoom: zoomLevel,
    pitch: currentPitch, // Keep current pitch - no angle of view change
    bearing: options.bearing ?? 0,
    duration: options.duration ?? 2000,
    essential: true,
  });
}

/**
 * Animate camera back to default view
 */
function animateToDefaultView(
  map: maplibregl.Map,
  defaultView: DefaultViewOptions
) {
  // Stop any ongoing animations first
  map.stop();

  // Get current pitch to keep it locked (no angle of view change)
  const currentPitch = map.getPitch();

  map.easeTo({
    center: defaultView.center,
    zoom: defaultView.zoom,
    pitch: currentPitch, // Keep current pitch - no angle of view change
    bearing: defaultView.bearing,
    duration: defaultView.duration ?? 2000,
  });
}
