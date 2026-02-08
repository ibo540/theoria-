"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "@/stores/useMapStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { useEventStore } from "@/stores/useEventStore";
import { getBaseEventId } from "@/lib/admin-utils";
import { useCountryLayers } from "@/hooks/useCountryLayers";
import { useCountryMarkers } from "@/hooks/useCountryMarkers";
import { useCountryIcons } from "@/hooks/useCountryIcons";
import { useCameraAnimation } from "@/hooks/useCameraAnimation";
import { useMarkerFocus } from "@/hooks/useMarkerFocus";
import { useTimelinePointData } from "@/hooks/useTimelinePointData";
import { useTimelineFocus } from "@/hooks/useTimelineFocus";
import { useTimelinePointAnimation } from "@/hooks/useTimelinePointAnimation";
import { useTimelinePlayback } from "@/hooks/useTimelinePlayback";
import Button from "@/components/ui/Buttons/p-button/Button";
import { X } from "lucide-react";
import { MarkerDetailPanel, MarkerData } from "@/components/marker";
import { MAP_CONFIG, MAP_COLORS, MAP_TEXTURE_DATA_URL } from "@/lib/map-config";
import { getHistoricalMapForEvent, getAvailableHistoricalMaps } from "@/lib/historical-maps";

interface MapLayer {
  id: string;
  type: "symbol" | "background" | "fill" | "line";
  "source-layer"?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function WorldMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const hasMapLoadedRef = useRef(false);
  const [buttonPosition, setButtonPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const setBearing = useMapStore((state) => state.setBearing);
  const setMapInstance = useMapStore((state) => state.setMapInstance);
  const highlightsVisible = useMapStore((state) => state.highlightsVisible);
  const focusedMarker = useMapStore((state) => state.focusedMarker);
  const setFocusedMarker = useMapStore((state) => state.setFocusedMarker);
  const selectedMarker = useMapStore((state) => state.selectedMarker);
  const setSelectedMarker = useMapStore((state) => state.setSelectedMarker);

  const activeTheory = useTheoryStore((state) => state.activeTheory);
  const getCurrentTheoryDarkColor = useTheoryStore(
    (state) => state.getCurrentTheoryDarkColor
  );
  const getCurrentTheoryColor = useTheoryStore(
    (state) => state.getCurrentTheoryColor
  );
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);

  const activeEventId = useEventStore((state) => state.activeEventId);
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore((state) => state.activeTimelinePointId);
  const timelinePointClickCounter = useEventStore((state) => state.timelinePointClickCounter);
  const navigateTimelinePoint = useEventStore((state) => state.navigateTimelinePoint);
  const selectEvent = useEventStore((state) => state.selectEvent);
  const markers = useEventStore((state) => state.markers);
  const highlighted = useEventStore((state) => state.highlighted);
  const connections = useEventStore((state) => state.connections);
  const drawnShapes = useEventStore((state) => state.drawnShapes);
  const [selectedIcon, setSelectedIcon] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTheoryNotification, setShowTheoryNotification] = useState(false);
  const [selectedUnifiedArea, setSelectedUnifiedArea] = useState<{ area: any; position: { x: number; y: number } } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; position: { x: number; y: number } } | null>(null);
  const lastActiveTimelinePointRef = useRef<string | null>(null);
  
  // Determine which historical map period is active
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
  
  // Debug: log when selectedIcon changes
  useEffect(() => {
    console.log("selectedIcon state changed:", selectedIcon);
  }, [selectedIcon]);
  
  // Reset last active timeline point when event changes
  useEffect(() => {
    if (activeEvent) {
      lastActiveTimelinePointRef.current = null;
      setSelectedIcon(null); // Close any open popup when event changes
    }
  }, [activeEvent?.id]);

  // Get timeline point visualization data
  const timelineViz = useTimelinePointData();

  // Coordinate GSAP animations for timeline point transitions
  useTimelinePointAnimation();

  // Handle automatic timeline playback (walkthrough mode)
  useTimelinePlayback();

  // Compute layer colors based on active theory
  const layerColors = useMemo(() => {
    const darkColor = getCurrentTheoryDarkColor();
    const lightColor = getCurrentTheoryColor();

    if (!darkColor || !lightColor) {
      // Default colors when no theory is selected
      return {
        fill: "#5a4f3f",
        fillOpacity: 0.5,
        border: "#8b7a5f",
        borderWidth: 2,
        borderOpacity: 0.7,
        line: "#8b7a5f",
        lineWidth: 2.5,
        lineOpacity: 0.6,
      };
    }

    // Theory-based colors
    return {
      fill: darkColor,
      fillOpacity: 0.75,
      border: lightColor,
      borderWidth: 2.5,
      borderOpacity: 0.95,
      line: lightColor,
      lineWidth: 3,
      lineOpacity: 0.9,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTheory]);

  // Stable marker click handler to prevent unnecessary re-renders
  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      setSelectedMarker(marker);
      setFocusedMarker(marker.position);
    },
    [setSelectedMarker, setFocusedMarker]
  );

  // Handle icon click - show detail panel and zoom to icon
  const handleIconClick = useCallback(
    (icon: any) => {
      console.log("handleIconClick called with:", icon);
      if (!icon || !icon.coordinates) {
        console.warn("Icon click: invalid icon data", icon);
        return;
      }
      
      console.log("Setting selectedIcon to:", icon);
      setSelectedIcon(icon);
      console.log("selectedIcon state should be updated");
      
      // Zoom to icon location
      if (mapInstanceRef.current) {
        const lng = typeof icon.coordinates[1] === 'number' ? icon.coordinates[1] : 0;
        const lat = typeof icon.coordinates[0] === 'number' ? icon.coordinates[0] : 0;
        
        if (lat === 0 && lng === 0) {
          console.warn("Icon has invalid coordinates, not zooming");
          return;
        }
        
        mapInstanceRef.current.flyTo({
          center: [lng, lat], // [lng, lat] for MapLibre
          zoom: 5,
          duration: 1500,
        });
      }
    },
    []
  );

  // Update popup position when map moves or icon changes
  useEffect(() => {
    if (!selectedIcon || !mapInstanceRef.current || !selectedIcon.coordinates) {
      setPopupPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!mapInstanceRef.current || !selectedIcon?.coordinates) return;
      
      const lng = typeof selectedIcon.coordinates[1] === 'number' ? selectedIcon.coordinates[1] : 0;
      const lat = typeof selectedIcon.coordinates[0] === 'number' ? selectedIcon.coordinates[0] : 0;
      
      if (lat !== 0 && lng !== 0) {
        const point = mapInstanceRef.current.project([lng, lat]);
        
        // Popup dimensions (approximate)
        const popupWidth = 400;
        const popupHeight = 300;
        const offsetX = 120; // Offset to the right
        const offsetY = -100; // Slight vertical offset
        
        // Calculate initial position
        let x = point.x + offsetX;
        let y = point.y + offsetY;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Keep popup within viewport bounds
        // Check right edge
        if (x + popupWidth > viewportWidth) {
          // If it would go off the right edge, position to the left of the icon instead
          x = point.x - popupWidth - 20; // 20px gap from icon
        }
        
        // Check left edge
        if (x < 0) {
          x = 20; // 20px margin from left edge
        }
        
        // Check bottom edge
        if (y + popupHeight / 2 > viewportHeight) {
          y = viewportHeight - popupHeight / 2 - 20; // 20px margin from bottom
        }
        
        // Check top edge
        if (y - popupHeight / 2 < 0) {
          y = popupHeight / 2 + 20; // 20px margin from top
        }
        
        setPopupPosition({ x, y });
      }
    };

    updatePosition();

    // Update position on map move/zoom
    const map = mapInstanceRef.current;
    if (map) {
      map.on('move', updatePosition);
      map.on('zoom', updatePosition);
      
      return () => {
        map.off('move', updatePosition);
        map.off('zoom', updatePosition);
      };
    }
  }, [selectedIcon]);

  // Handle icon popup close - zoom out to default view and show theory icons
  const handleIconClose = useCallback(() => {
    setSelectedIcon(null);
    setPopupPosition(null);
    
    // Show theory icons again with animation
    if (typeof window !== 'undefined' && (window as any).setIsTimelineNavigating) {
      (window as any).setIsTimelineNavigating(false);
    }
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: MAP_CONFIG.initialCenter,
        zoom: MAP_CONFIG.targetZoom,
        bearing: 0,
        duration: 1500,
      });
    }
  }, []);

  // Handle marker close - zoom out to default view
  const handleMarkerClose = useCallback(() => {
    setSelectedMarker(null);
    setFocusedMarker(null);
    setSelectedIcon(null);

    // Zoom out to default view
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const currentPitch = map.getPitch();
      const animationDuration = 2000;
      const startTime = Date.now();

      const updateBearingDuringAnimation = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed < animationDuration) {
          const currentBearing = map.getBearing();
          setBearing(currentBearing);
          requestAnimationFrame(updateBearingDuringAnimation);
        } else {
          setBearing(0);
        }
      };

      map.easeTo({
        center: MAP_CONFIG.initialCenter,
        zoom: MAP_CONFIG.targetZoom,
        pitch: currentPitch,
        bearing: 0,
        duration: animationDuration,
        essential: true,
      });

      requestAnimationFrame(updateBearingDuringAnimation);
    }
  }, [setSelectedMarker, setFocusedMarker, setBearing]);


  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.initialCenter,
      zoom: MAP_CONFIG.minZoom,
      pitch: MAP_CONFIG.pitch,
      bearing: 0,
      maxPitch: MAP_CONFIG.maxPitch,
      minPitch: MAP_CONFIG.minPitch,
      minZoom: MAP_CONFIG.minZoom,
      pitchWithRotate: false, // Allow rotation but prevent pitch changes during rotation
      attributionControl: {},
    });

    mapInstanceRef.current = map;
    setMapInstance(map);

    // Allow rotation but disable pitch changes
    // pitchWithRotate: false in map options prevents pitch changes during rotation
    // Disable touch pitch gestures (two-finger drag up/down)
    map.touchPitch.disable();

    // Lock pitch to initial value - prevent any pitch changes
    const initialPitch = MAP_CONFIG.pitch;
    let isResettingPitch = false;
    const preventPitchChange = () => {
      if (isResettingPitch) return; // Prevent infinite loop
      const currentPitch = map.getPitch();
      if (Math.abs(currentPitch - initialPitch) > 0.1) {
        isResettingPitch = true;
        map.setPitch(initialPitch);
        // Reset flag after a short delay to allow the pitch event to complete
        setTimeout(() => {
          isResettingPitch = false;
        }, 10);
      }
    };

    // Listen for pitch changes and reset them
    map.on("pitch", preventPitchChange);

    // Setup event listeners and get cleanup function
    const cleanupListeners = setupMapEventListeners(map, setBearing);

    // Map load event
    map.once("load", () => {
      // Get current pitch to keep it locked (no angle of view change)
      const currentPitch = map.getPitch();

      map.easeTo({
        zoom: MAP_CONFIG.targetZoom,
        pitch: currentPitch, // Keep current pitch - no angle of view change
        bearing: 0,
        duration: MAP_CONFIG.zoomDuration,
        easing: (t) => t,
      });

      setBearing(map.getBearing());
      applyMonochromeStyle(map);
      
      // Add base country layer for tooltip queries (always present, invisible)
      // This allows us to query country names even when no event is selected
      const addBaseCountryLayer = async () => {
        try {
          const geojsonUrl = historicalMapConfig?.geojsonPath || "/geo/countries.geojson";
          const response = await fetch(geojsonUrl);
          const data = await response.json();
          
          if (!map.getSource("countries-tooltip-source")) {
            map.addSource("countries-tooltip-source", {
              type: "geojson",
              data: data,
            });
            
            // Add invisible layer for querying (opacity 0, but still queryable)
            if (!map.getLayer("countries-tooltip-layer")) {
              map.addLayer({
                id: "countries-tooltip-layer",
                type: "fill",
                source: "countries-tooltip-source",
                paint: {
                  "fill-opacity": 0, // Invisible but still queryable
                },
              });
            }
          }
        } catch (error) {
          console.warn("Failed to load base country layer for tooltips:", error);
        }
      };
      
      addBaseCountryLayer();
      hasMapLoadedRef.current = true;
    });

    return () => {
      // Cleanup RAF and listeners
      if (cleanupListeners) cleanupListeners();

      // Remove pitch change prevention listener
      map.off("pitch", preventPitchChange);

      hasMapLoadedRef.current = false;
      mapInstanceRef.current = null;
      setMapInstance(null);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup country layers (only if event is selected)
  // Always pass highlighted/connections/drawnShapes (even if null) so layers can initialize
  // The isVisible flag controls whether they're actually displayed
  // Get highlighted country names for border layer
  const highlightedCountryNames = useMemo(() => {
    if (!activeEvent || !highlighted) return [];
    return highlighted.features
      .map(f => f.properties?.name || f.properties?.NAME)
      .filter(Boolean) as string[];
  }, [activeEvent, highlighted]);

  // Get theory color for connection lines
  const theoryColor = useMemo(() => {
    if (activeTheory) {
      return getTheoryColor(activeTheory);
    }
    return null;
  }, [activeTheory, getTheoryColor]);

  useCountryLayers(
    mapInstanceRef.current,
    hasMapLoadedRef.current,
    activeEventId ? highlighted : null,
    activeEventId ? connections : null,
    activeEventId ? drawnShapes : null,
    highlightsVisible && Boolean(activeEventId),
    layerColors,
    historicalMapConfig?.geojsonPath,
    highlightedCountryNames,
    theoryColor,
    activeTimelinePointId
  );

  // Merge event-level markers with timeline point markers
  const allMarkers = useMemo(() => {
    if (!activeEventId) return new Map();

    const merged = new Map(markers); // Start with event-level markers

    // Add timeline point markers (these take precedence visually)
    timelineViz.markers.forEach((marker, id) => {
      merged.set(id, marker);
    });

    return merged;
  }, [markers, timelineViz.markers, activeEventId]);

  // Setup country markers (event + timeline point markers)
  // DISABLED: Do not show markers on highlighted countries - icons should only appear from timeline
  useCountryMarkers(
    mapInstanceRef.current,
    allMarkers,
    false, // Always hide country markers - icons should only come from timeline points
    activeTheory,
    getTheoryColor,
    handleMarkerClick
  );

  // Handle camera animation (only when not focused on marker AND not focused on timeline point)
  const hasTimelineFocus = timelineViz.focusLocation !== null;
  useCameraAnimation(
    mapInstanceRef.current,
    connections || null,
    highlightsVisible && !focusedMarker && !hasTimelineFocus,
    {
      center: MAP_CONFIG.initialCenter,
      zoom: MAP_CONFIG.targetZoom,
      bearing: 0,
    }
  );

  // Handle timeline point focus (takes priority over marker focus)
  useTimelineFocus(mapInstanceRef.current);

  // Track when event is first selected to skip initial popup
  const eventIdRef = useRef<string | null>(null);
  const initialClickCounterRef = useRef<number>(0);
  const initialTimelinePointRef = useRef<string | null>(null);
  const hasUserClickedTimelineRef = useRef<boolean>(false);
  const previousTimelinePointRef = useRef<string | null>(null);
  const previousTheoryRef = useRef<string | null>(null);
  
  // When theory changes, reload event with theory-specific data
  useEffect(() => {
    if (activeEvent) {
      const baseEventId = getBaseEventId(activeEvent.id);
      
      if (activeTheory) {
        // Theory is selected - reload event with theory-specific data
        // Only reload if the theory actually changed
        if (previousTheoryRef.current !== activeTheory) {
          console.log("🔄 Theory changed, reloading event with theory:", activeTheory);
          selectEvent(baseEventId, activeTheory).catch(console.error);
          previousTheoryRef.current = activeTheory;
        }
      } else {
        // Theory was deselected - reload event without theory
        if (previousTheoryRef.current !== null) {
          console.log("🔄 Theory deselected, reloading event without theory");
          selectEvent(baseEventId).catch(console.error);
          previousTheoryRef.current = null;
        }
      }
    } else if (activeTheory && previousTheoryRef.current !== activeTheory) {
      // Theory selected but no event - this shouldn't happen, but reset tracking
      previousTheoryRef.current = activeTheory;
    }
  }, [activeTheory, activeEvent, selectEvent]);
  
  // When event changes, reset tracking
  useEffect(() => {
    if (activeEvent) {
      const isNewEvent = eventIdRef.current !== activeEvent.id;
      if (isNewEvent) {
        eventIdRef.current = activeEvent.id;
        initialClickCounterRef.current = timelinePointClickCounter;
        initialTimelinePointRef.current = activeTimelinePointId;
        hasUserClickedTimelineRef.current = false;
        lastActiveTimelinePointRef.current = activeTimelinePointId;
        previousTimelinePointRef.current = activeTimelinePointId;
        previousTheoryRef.current = activeTheory;
        setSelectedIcon(null); // Don't show popup on initial selection
      }
    }
  }, [activeEvent?.id, timelinePointClickCounter]);
  
  // When timeline point is clicked, find linked icon and show it
  useEffect(() => {
    if (!activeTimelinePointId || !activeEvent) {
      setSelectedIcon(null);
      previousTimelinePointRef.current = activeTimelinePointId;
      previousTheoryRef.current = activeTheory;
      return;
    }

    // Check if ONLY the theory changed (not the timeline point)
    // If only theory changed, don't show popup - user must click on timeline or icon
    const onlyTheoryChanged = 
      activeTimelinePointId === previousTimelinePointRef.current &&
      activeTheory !== previousTheoryRef.current &&
      !hasUserClickedTimelineRef.current;

    if (onlyTheoryChanged) {
      // Only theory changed, don't show popup automatically
      previousTheoryRef.current = activeTheory;
      return;
    }

    // Check if click counter has increased - this indicates a user click
    // Even if clicking the same point, the counter increments, so we know it's a user action
    const clickCounterIncreased = timelinePointClickCounter > initialClickCounterRef.current;
    
    // Skip if this is the initial timeline point set automatically on event selection
    // Only skip if:
    // 1. Click counter hasn't changed (no user interaction)
    // 2. User hasn't explicitly clicked on timeline yet
    const isInitialSelection = 
      !clickCounterIncreased &&
      !hasUserClickedTimelineRef.current &&
      activeTimelinePointId === initialTimelinePointRef.current;

    if (isInitialSelection) {
      // This is the initial automatic selection, don't show popup
      // Update lastActiveTimelinePointRef to track this initial state
      lastActiveTimelinePointRef.current = activeTimelinePointId;
      previousTimelinePointRef.current = activeTimelinePointId;
      previousTheoryRef.current = activeTheory;
      return;
    }

    // If click counter increased, it means user clicked (even if same point)
    if (clickCounterIncreased) {
      // Mark that user has interacted with timeline
      hasUserClickedTimelineRef.current = true;
    }

    // If timeline point changed and it's different from last, it's also a user click
    if (activeTimelinePointId !== lastActiveTimelinePointRef.current) {
      // Mark that user has interacted with timeline
      hasUserClickedTimelineRef.current = true;
    }

    // Check if a theory is selected - required to view event details
    if (!activeTheory) {
      // Show notification that user needs to select a theory first
      setShowTheoryNotification(true);
      // Auto-hide notification after 5 seconds
      setTimeout(() => setShowTheoryNotification(false), 5000);
      previousTimelinePointRef.current = activeTimelinePointId;
      previousTheoryRef.current = activeTheory;
      return;
    }

    // User clicked on a timeline point and theory is selected - show popup
    // Show popup if:
    // 1. User has clicked on timeline (counter increased or point changed), OR
    // 2. Timeline point changed from previous
    if (hasUserClickedTimelineRef.current) {
      lastActiveTimelinePointRef.current = activeTimelinePointId;

      // Find the icon linked to this timeline point
      const linkedIcon = activeEvent.countryIcons?.find(
        icon => icon.timelinePointId === activeTimelinePointId
      );

      if (linkedIcon) {
        // Show the icon detail popup
        // Note: useTimelineFocus hook will handle zooming to the icon location
        setSelectedIcon(linkedIcon);
        
        // Hide theory icons with animation
        if (typeof window !== 'undefined' && (window as any).setIsTimelineNavigating) {
          (window as any).setIsTimelineNavigating(true);
        }
      } else {
        // No linked icon, close popup
        setSelectedIcon(null);
        
        // Show theory icons again
        if (typeof window !== 'undefined' && (window as any).setIsTimelineNavigating) {
          (window as any).setIsTimelineNavigating(false);
        }
      }
    }

    // Update previous refs
    previousTimelinePointRef.current = activeTimelinePointId;
    previousTheoryRef.current = activeTheory;
  }, [activeTimelinePointId, activeEvent, timelinePointClickCounter, activeTheory]);

  // Handle marker focus and rotation (only when no timeline point is active)
  useMarkerFocus(
    mapInstanceRef.current,
    hasTimelineFocus ? null : focusedMarker
  );

  // Render country icons on the map
  useCountryIcons(
    mapInstanceRef.current,
    handleIconClick
  );

  // Add hover handler for country names
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hasMapLoadedRef.current) return;

    const handleMapMouseMove = (e: maplibregl.MapMouseEvent) => {
      // Query all features at mouse position
      // Prioritize the tooltip layer, then check other country sources
      const tooltipFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["countries-tooltip-layer"],
      });
      
      // Also check other country layers
      const allFeatures = map.queryRenderedFeatures(e.point);
      
      // Try tooltip layer first (always present)
      let countryFeature = tooltipFeatures.find(
        (f) => {
          const props = f.properties;
          return props && (
            props.name || 
            props.NAME || 
            props.NAME_EN || 
            props.name_en || 
            props.NAME_LONG || 
            props.name_long ||
            props.ABBREVN ||
            props.SUBJECTO
          );
        }
      );
      
      // If not found, check other country sources
      if (!countryFeature) {
        countryFeature = allFeatures.find(
          (f) => {
            const props = f.properties;
            const source = f.source;
            
            // Check if it's from a country-related source
            const isCountrySource = 
              source === "countries-base-map-source" ||
              source === "countries-highlight" ||
              source === "countries-tooltip-source" ||
              source === "countries" ||
              source?.includes("country");
            
            // Check if it has country name properties
            const hasCountryName = props && (
              props.name || 
              props.NAME || 
              props.NAME_EN || 
              props.name_en || 
              props.NAME_LONG || 
              props.name_long ||
              props.ABBREVN ||
              props.SUBJECTO
            );
            
            return isCountrySource && hasCountryName;
          }
        );
      }

      if (countryFeature) {
        const props = countryFeature.properties;
        const countryName = 
          props?.name || 
          props?.NAME || 
          props?.NAME_EN || 
          props?.name_en || 
          props?.NAME_LONG || 
          props?.name_long ||
          props?.ABBREVN ||
          props?.SUBJECTO;
        
        if (countryName) {
          setHoveredCountry({
            name: countryName,
            position: { x: e.point.x, y: e.point.y },
          });
          // Change cursor to pointer
          map.getCanvas().style.cursor = "pointer";
          return;
        }
      }

      // No country found at this position
      setHoveredCountry(null);
      map.getCanvas().style.cursor = "";
    };

    const handleMapMouseLeave = () => {
      setHoveredCountry(null);
      if (map) {
        map.getCanvas().style.cursor = "";
      }
    };

    map.on("mousemove", handleMapMouseMove);
    map.on("mouseleave", handleMapMouseLeave);

    return () => {
      map.off("mousemove", handleMapMouseMove);
      map.off("mouseleave", handleMapMouseLeave);
    };
  }, [hasMapLoadedRef.current]);

  // Add click handler for unified areas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hasMapLoadedRef.current) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      // Only handle clicks if no marker/icon is selected and we have an active event
      if (!activeEvent || selectedIcon || selectedMarker) return;

      // Query for country features at click point
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["countries-base", "countries-highlight", "countries-border"],
      });

      if (features.length > 0) {
        const countryFeature = features.find(
          (f) => f.source === "countries" && (f.properties?.name || f.properties?.NAME)
        );

        if (countryFeature) {
          const countryName = countryFeature.properties?.name || countryFeature.properties?.NAME;
          
          // Check if this country belongs to a unified area
          const unifiedArea = activeEvent.unifiedAreas?.find((area) =>
            area.countries.includes(countryName)
          );

          if (unifiedArea && unifiedArea.description) {
            setSelectedUnifiedArea({
              area: unifiedArea,
              position: { x: e.point.x, y: e.point.y },
            });
          }
        }
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [activeEvent, selectedIcon, selectedMarker]);

  // TODO: Render timeline point areas (influence zones, conflict zones, etc.)
  // This functionality requires implementing useTimelineAreas hook
  // useTimelineAreas(
  //   mapInstanceRef.current,
  //   timelineViz.areas,
  //   highlightsVisible && Boolean(activeEventId)
  // );

  // TODO: Render timeline point flows (movements, alliances, etc.)
  // This functionality requires implementing useTimelineFlows hook
  // useTimelineFlows(
  //   mapInstanceRef.current,
  //   timelineViz.flows,
  //   highlightsVisible && Boolean(activeEventId)
  // );

  // Update button position when marker is focused or map moves
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusedMarker) {
      setButtonPosition(null);
      return;
    }

    const updateButtonPosition = () => {
      const point = map.project(focusedMarker);
      setButtonPosition({ x: point.x, y: point.y });
    };

    // Update position initially
    updateButtonPosition();

    // Update position when map moves/rotates
    map.on("move", updateButtonPosition);
    map.on("rotate", updateButtonPosition);
    map.on("zoom", updateButtonPosition);

    return () => {
      map.off("move", updateButtonPosition);
      map.off("rotate", updateButtonPosition);
      map.off("zoom", updateButtonPosition);
    };
  }, [focusedMarker]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -5,
        backgroundColor: MAP_COLORS.background,
      }}
    >
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
      
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.07,
          mixBlendMode: "overlay",
          backgroundImage: MAP_TEXTURE_DATA_URL,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Exit Focus Button - Top Left of Marker */}
      {focusedMarker && buttonPosition && (
        <div
          className="fixed z-30"
          style={{
            left: `${buttonPosition.x - 80}px`, // Position to the left of marker
            top: `${buttonPosition.y - 80}px`, // Position above marker
          }}
        >
          <Button
            borderStyle="five"
            variant="icon"
            blurred
            onClick={handleMarkerClose}
          >
            <X size={20} />
          </Button>
        </div>
      )}

      {/* Marker Detail Panel */}
      <MarkerDetailPanel
        marker={selectedMarker}
        activeTheory={activeTheory}
        getTheoryColor={getTheoryColor}
        onClose={handleMarkerClose}
      />

      {/* Theory Selection Notification */}
      {showTheoryNotification && (
        <div 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] pointer-events-auto"
          style={{ zIndex: 10000 }}
        >
          <div
            className="px-6 py-4 rounded-md shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.96)",
              border: "2px solid rgba(255, 228, 190, 0.6)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-lg font-semibold"
                style={{ color: "#ffe4be" }}
              >
                Theory Selection Required
              </h3>
              <button
                onClick={() => setShowTheoryNotification(false)}
                className="text-gray-400 hover:text-white transition-colors"
                style={{ color: "rgba(255, 228, 190, 0.7)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255, 228, 190, 0.9)" }}
            >
              Please select a theory first to view event details. Different theories provide different analyses of the same event.
            </p>
          </div>
        </div>
      )}

      {/* Icon Detail Popup - Styled to match timeline tooltip */}
      {selectedIcon && (
        <div
          className="px-6 py-5 rounded-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
          style={{
            position: 'fixed',
            zIndex: 9999,
            ...(popupPosition ? {
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y}px`,
              transform: 'translateY(-50%)',
            } : {
              bottom: '120px',
              right: '24px',
            }),
            maxWidth: '400px',
            width: 'auto',
            backgroundColor: "rgba(0, 0, 0, 0.96)",
            border: "1.5px solid rgba(255, 228, 190, 0.4)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "#ffe4be" }}
              >
                {selectedIcon.title || "Untitled"}
              </h3>
              <button
                onClick={handleIconClose}
                className="text-gray-400 hover:text-white transition-colors"
                style={{ color: "rgba(255, 228, 190, 0.7)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <p
                className="text-xs uppercase tracking-wide mb-1"
                style={{ color: "rgba(255, 228, 190, 0.5)" }}
              >
                Country
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "rgba(255, 228, 190, 0.9)" }}
              >
                {selectedIcon.country}
              </p>
            </div>

            <div className="mb-4">
              <p
                className="text-xs uppercase tracking-wide mb-1"
                style={{ color: "rgba(255, 228, 190, 0.5)" }}
              >
                Description
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255, 228, 190, 0.8)" }}
              >
                {selectedIcon.description || "No description provided."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleIconClose}
                className="flex-1 px-4 py-2.5 rounded-md transition-all duration-200 font-medium text-sm"
                style={{
                  backgroundColor: "rgba(255, 228, 190, 0.1)",
                  border: "1px solid rgba(255, 228, 190, 0.3)",
                  color: "#ffe4be",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 228, 190, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(255, 228, 190, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 228, 190, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(255, 228, 190, 0.3)";
                }}
              >
                Close
              </button>
              {(() => {
                // Check if there's a next timeline point
                const timelinePoints = activeEvent?.timelinePoints || [];
                const currentIndex = activeTimelinePointId
                  ? timelinePoints.findIndex((p) => p.id === activeTimelinePointId)
                  : -1;
                const hasNext = currentIndex < timelinePoints.length - 1;
                
                const handleNext = () => {
                  if (hasNext) {
                    navigateTimelinePoint("next");
                    // Find the icon for the next timeline point
                    const nextIndex = currentIndex + 1;
                    const nextPointId = timelinePoints[nextIndex]?.id;
                    if (nextPointId && activeEvent?.countryIcons) {
                      const nextIcon = activeEvent.countryIcons.find(
                        (icon) => icon.timelinePointId === nextPointId
                      );
                      if (nextIcon) {
                        setSelectedIcon(nextIcon);
                      } else {
                        // No icon for next point, close the popup
                        setSelectedIcon(null);
                      }
                    } else {
                      // No next point or no icons, close popup
                      setSelectedIcon(null);
                    }
                  }
                };
                
                return (
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="flex-1 px-4 py-2.5 rounded-md transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: hasNext ? "rgba(255, 228, 190, 0.15)" : "rgba(255, 228, 190, 0.05)",
                      border: "1px solid rgba(255, 228, 190, 0.3)",
                      color: "#ffe4be",
                    }}
                    onMouseEnter={(e) => {
                      if (hasNext) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 228, 190, 0.25)";
                        e.currentTarget.style.borderColor = "rgba(255, 228, 190, 0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasNext) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 228, 190, 0.15)";
                        e.currentTarget.style.borderColor = "rgba(255, 228, 190, 0.3)";
                      }
                    }}
                  >
                    Next
                  </button>
                );
              })()}
            </div>
        </div>
      )}

      {/* Country Name Tooltip - Fixed Position (Top-Left, under THEORIA) */}
      {hoveredCountry && (
        <div
          className="fixed pointer-events-auto z-[9998]"
          style={{
            top: "80px",
            left: "20px",
          }}
        >
          <div
            className="px-4 py-3 rounded-md shadow-lg flex items-center gap-3 group animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              border: "1.5px solid rgba(255, 228, 190, 0.5)",
              color: "#ffe4be",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "#ffe4be",
                  boxShadow: "0 0 8px rgba(255, 228, 190, 0.6)",
                }}
              />
              <span className="text-sm font-semibold">{hoveredCountry.name}</span>
            </div>
            <button
              onClick={() => setHoveredCountry(null)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "#ffe4be" }}
              aria-label="Close tooltip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Unified Area Description Popup */}
      {selectedUnifiedArea && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
          style={{ zIndex: 9999, backgroundColor: 'transparent' }}
        >
          <div
            className="px-6 py-5 rounded-md shadow-2xl max-w-lg w-full animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.96)",
              border: "1.5px solid rgba(255, 228, 190, 0.4)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "#ffe4be" }}
              >
                {selectedUnifiedArea.area.name}
              </h3>
              <button
                onClick={() => setSelectedUnifiedArea(null)}
                className="text-gray-400 hover:text-white transition-colors"
                style={{ color: "rgba(255, 228, 190, 0.7)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <p
                className="text-xs uppercase tracking-wide mb-1"
                style={{ color: "rgba(255, 228, 190, 0.5)" }}
              >
                Countries
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUnifiedArea.area.countries.map((country: string) => (
                  <span
                    key={country}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: "rgba(255, 228, 190, 0.1)",
                      border: "1px solid rgba(255, 228, 190, 0.3)",
                      color: "rgba(255, 228, 190, 0.9)",
                    }}
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p
                className="text-xs uppercase tracking-wide mb-1"
                style={{ color: "rgba(255, 228, 190, 0.5)" }}
              >
                Description
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255, 228, 190, 0.8)" }}
              >
                {selectedUnifiedArea.area.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedUnifiedArea(null)}
              className="w-full px-4 py-2.5 rounded-md transition-all duration-200 font-medium text-sm"
              style={{
                backgroundColor: "rgba(255, 228, 190, 0.1)",
                border: "1px solid rgba(255, 228, 190, 0.3)",
                color: "#ffe4be",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 228, 190, 0.2)";
                e.currentTarget.style.borderColor = "rgba(255, 228, 190, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 228, 190, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 228, 190, 0.3)";
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function setupMapEventListeners(
  map: maplibregl.Map,
  setBearing: (bearing: number) => void
): () => void {
  // Pitch dragging functionality removed - users cannot change angle of view

  const handleWheel = (e: WheelEvent) => {
    if (e.deltaY > 0 && map.getZoom() <= MAP_CONFIG.minZoom) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  let rafId: number | null = null;

  const updateBearing = () => {
    // Cancel any pending update
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    // Schedule update on next frame to batch multiple calls
    rafId = requestAnimationFrame(() => {
      const currentBearing = map.getBearing();
      setBearing(currentBearing);
      rafId = null;
    });
  };

  // Register event listeners
  const canvasContainer = map.getCanvasContainer();
  canvasContainer.addEventListener("wheel", handleWheel, { passive: false });

  // Update instantly during rotation for real-time compass feedback
  map.on("rotate", updateBearing);
  // Also update during any map movement (including animations)
  map.on("move", updateBearing);

  // Cleanup function for RAF and event listeners
  const cleanup = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    map.off("rotate", updateBearing);
    map.off("move", updateBearing);
  };

  return cleanup;
}

function applyMonochromeStyle(map: maplibregl.Map): void {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const layerId = layer.id;
    const layerType = (layer as MapLayer).type;
    const sourceLayer = (layer as MapLayer)["source-layer"];
    const layerIdLower = layerId.toLowerCase();

    switch (layerType) {
      case "symbol":
        map.setLayoutProperty(layerId, "visibility", "none");
        break;

      case "background":
        map.setPaintProperty(
          layerId,
          "background-color",
          MAP_COLORS.background
        );
        break;

      case "fill": {
        const isWater =
          layerIdLower.includes("water") || sourceLayer?.includes("water");
        map.setPaintProperty(
          layerId,
          "fill-color",
          isWater ? MAP_COLORS.water : MAP_COLORS.land
        );
        map.setPaintProperty(layerId, "fill-opacity", 1);
        break;
      }

      case "line": {
        const isBoundary =
          layerIdLower.includes("boundary") ||
          layerIdLower.includes("admin") ||
          sourceLayer?.includes("boundary") ||
          sourceLayer?.includes("admin");

        if (isBoundary) {
          map.setPaintProperty(layerId, "line-color", MAP_COLORS.boundary);
          map.setPaintProperty(layerId, "line-opacity", 0.7);
          map.setPaintProperty(layerId, "line-width", 1.2);
        } else {
          map.setPaintProperty(layerId, "line-color", MAP_COLORS.line);
          map.setPaintProperty(layerId, "line-opacity", 0.4);
        }
        break;
      }
    }
  }
}
