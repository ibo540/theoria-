import React, { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { createRoot, Root } from "react-dom/client";
import Marker from "@/components/marker/Marker";
import { MarkerData } from "@/components/marker/types";
import { TheoryType } from "@/stores/useTheoryStore";

/**
 * Marker instance with React root and MapLibre marker
 */
interface MarkerInstance {
  maplibreMarker: maplibregl.Marker;
  reactRoot: Root;
  container: HTMLDivElement;
}

/**
 * Create a stable key from marker IDs for change detection
 */
function createMarkersKey(markers: Map<string, MarkerData>): string {
  return Array.from(markers.keys()).sort().join(",");
}

/**
 * Create marker container element
 */
function createMarkerContainer(size: number): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  return container;
}

export function useCountryMarkers(
  map: maplibregl.Map | null,
  markers: Map<string, MarkerData>,
  isVisible: boolean,
  activeTheory: TheoryType | null,
  getTheoryColor: (theory: TheoryType) => string,
  onMarkerClick?: (marker: MarkerData) => void
) {
  // Store marker instances
  const markersRef = useRef<Map<string, MarkerInstance>>(new Map());

  // Track previous values for change detection
  const previousMarkersKeyRef = useRef<string>("");
  const previousTheoryRef = useRef<TheoryType | null>(null);
  const previousVisibilityRef = useRef<boolean>(false);

  // Use refs to keep callbacks stable and avoid unnecessary re-renders
  const onClickRef = useRef(onMarkerClick);
  const getTheoryColorRef = useRef(getTheoryColor);

  // Update refs when props change
  useEffect(() => {
    onClickRef.current = onMarkerClick;
    getTheoryColorRef.current = getTheoryColor;
  }, [onMarkerClick, getTheoryColor]);

  // Stable click handler
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    onClickRef.current?.(marker);
  }, []);

  /**
   * Cleanup all markers
   */
  const cleanupMarkers = useCallback(() => {
    const instances = Array.from(markersRef.current.values());

    // Remove MapLibre markers synchronously
    for (const instance of instances) {
      try {
        instance.maplibreMarker.remove();
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Unmount React roots asynchronously to avoid render conflicts
    // Use requestIdleCallback if available, otherwise setTimeout
    const unmountRoots = () => {
      for (const instance of instances) {
        try {
          instance.reactRoot.unmount();
        } catch {
          // Ignore errors during unmount
        }
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(unmountRoots, { timeout: 100 });
    } else {
      setTimeout(unmountRoots, 0);
    }

    markersRef.current.clear();
    previousMarkersKeyRef.current = "";
  }, []);

  /**
   * Create a single marker
   */
  const createMarker = useCallback(
    (
      markerData: MarkerData,
      mapInstance: maplibregl.Map
    ): MarkerInstance | null => {
      try {
        const size = markerData.isUnified ? 44 : 40;
        const container = createMarkerContainer(size);
        const root = createRoot(container);

        // Render marker component
        root.render(
          <Marker
            marker={markerData}
            activeTheory={activeTheory}
            getTheoryColor={getTheoryColorRef.current}
            onClick={handleMarkerClick}
          />
        );

        // Create MapLibre marker
        const maplibreMarker = new maplibregl.Marker({
          element: container,
          anchor: "center",
        })
          .setLngLat(markerData.position)
          .addTo(mapInstance);

        return {
          maplibreMarker,
          reactRoot: root,
          container,
        };
      } catch (error) {
        console.error(`Failed to create marker for ${markerData.id}:`, error);
        return null;
      }
    },
    [activeTheory, handleMarkerClick]
  );

  /**
   * Update existing markers with new theory
   */
  const updateMarkersTheory = useCallback(
    (
      instances: Map<string, MarkerInstance>,
      markersData: Map<string, MarkerData>
    ) => {
      for (const [markerId, instance] of instances.entries()) {
        const markerData = markersData.get(markerId);
        if (markerData) {
          try {
            instance.reactRoot.render(
              <Marker
                marker={markerData}
                activeTheory={activeTheory}
                getTheoryColor={getTheoryColorRef.current}
                onClick={handleMarkerClick}
              />
            );
          } catch (error) {
            console.error(`Failed to update marker ${markerId}:`, error);
          }
        }
      }
    },
    [activeTheory, handleMarkerClick]
  );

  /**
   * Update marker visibility
   */
  const updateMarkersVisibility = useCallback(
    (instances: Map<string, MarkerInstance>, visible: boolean) => {
      for (const instance of instances.values()) {
        try {
          instance.container.style.display = visible ? "flex" : "none";
        } catch {
          // Ignore errors
        }
      }
    },
    []
  );

  // Main effect: Create/update markers
  useEffect(() => {
    if (!map || markers.size === 0) {
      if (markersRef.current.size > 0) {
        cleanupMarkers();
      }
      return;
    }

    const markersKey = createMarkersKey(markers);
    const markersChanged = markersKey !== previousMarkersKeyRef.current;
    const theoryChanged = activeTheory !== previousTheoryRef.current;
    const visibilityChanged = isVisible !== previousVisibilityRef.current;

    // Handle visibility changes without recreating markers
    if (visibilityChanged && !markersChanged) {
      updateMarkersVisibility(markersRef.current, isVisible);
      previousVisibilityRef.current = isVisible;
    }

    // Recreate markers if the set changed
    if (markersChanged) {
      cleanupMarkers();
      previousMarkersKeyRef.current = markersKey;
      previousTheoryRef.current = activeTheory;
      previousVisibilityRef.current = isVisible;

      // Defer marker creation to avoid render conflicts
      const timeoutId = setTimeout(() => {
        if (!map) return;

        for (const markerData of markers.values()) {
          const instance = createMarker(markerData, map);
          if (instance) {
            markersRef.current.set(markerData.id, instance);
            // Set initial visibility
            instance.container.style.display = isVisible ? "flex" : "none";
          }
        }
      }, 0);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Update theory without recreating markers
    if (theoryChanged && !markersChanged) {
      previousTheoryRef.current = activeTheory;
      updateMarkersTheory(markersRef.current, markers);
    }
  }, [
    map,
    markers,
    isVisible,
    activeTheory,
    handleMarkerClick,
    cleanupMarkers,
    createMarker,
    updateMarkersTheory,
    updateMarkersVisibility,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupMarkers;
  }, [cleanupMarkers]);

  // Cleanup markers that are no longer in the set
  useEffect(() => {
    if (!map || markers.size === 0) return;

    const currentIds = new Set(markers.keys());
    const instancesToRemove: string[] = [];

    for (const [id] of markersRef.current.entries()) {
      if (!currentIds.has(id)) {
        instancesToRemove.push(id);
      }
    }

    for (const id of instancesToRemove) {
      const instance = markersRef.current.get(id);
      if (instance) {
        try {
          instance.maplibreMarker.remove();
          instance.reactRoot.unmount();
        } catch {
          // Ignore errors
        }
        markersRef.current.delete(id);
      }
    }
  }, [map, markers]);
}
