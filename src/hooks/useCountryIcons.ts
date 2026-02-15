"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import { useEventStore } from "@/stores/useEventStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { CountryIcon } from "@/data/events";

// Extended icon type to include disappear settings
interface ExtendedCountryIcon extends CountryIcon {
  disappearAtTimelinePoint?: string;
  disappearAtPosition?: number;
}

/**
 * Hook to render country icons on the map
 * Icons are filtered based on timeline progression
 */
export function useCountryIcons(
  map: maplibregl.Map | null,
  onIconClick?: (icon: CountryIcon) => void,
  selectedIconId?: string | null
) {
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onIconClickRef = useRef(onIconClick);
  const mapRef = useRef<maplibregl.Map | null>(map);
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore((state) => state.activeTimelinePointId);
  const activeTheory = useTheoryStore((state) => state.activeTheory);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);

  // Keep refs up to date
  useEffect(() => {
    onIconClickRef.current = onIconClick;
  }, [onIconClick]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  // Create a stable reference for countryIcons to prevent unnecessary re-renders
  // Include iconType in the key to ensure re-render when icon types change
  const countryIconsKey = useMemo(() => {
    if (!activeEvent?.countryIcons) return '';
    return JSON.stringify(activeEvent.countryIcons.map(icon => ({
      id: icon.id,
      coordinates: icon.coordinates,
      timelinePointId: icon.timelinePointId,
      iconType: icon.iconType
    })));
  }, [activeEvent?.countryIcons]);

  // Memoize the countryIcons array reference to prevent unnecessary re-renders
  const countryIcons = useMemo(() => activeEvent?.countryIcons || [], [activeEvent?.countryIcons]);

  useEffect(() => {
    const currentMap = mapRef.current;

    console.log("🔄 useCountryIcons useEffect triggered:", {
      hasMap: !!currentMap,
      hasActiveEvent: !!activeEvent,
      activeEventId: activeEvent?.id,
      iconCount: activeEvent?.countryIcons?.length || 0,
      mapStyleLoaded: currentMap?.isStyleLoaded() || false,
      mapLoaded: currentMap?.loaded() || false
    });

    if (!currentMap) {
      console.log("⚠️ useCountryIcons - Map not available");
      // Remove all markers when map is not available
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    if (!activeEvent) {
      console.log("⚠️ useCountryIcons - Active event not available");
      // Remove all markers when event is not available
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    // Use a flag to prevent multiple listeners
    let listenerAdded = false;

    const setupIcons = () => {
      const map = mapRef.current;
      if (!map) {
        console.log("⚠️ setupIcons - Map became null");
        return;
      }

      // Check if map is loaded - but don't block fully, just warn
      if (!map.loaded()) {
        console.log("⏳ Map reported as not fully loaded (likely loading tiles/data), but proceeding to add markers...");
      }

      console.log("🎬 setupIcons called, map loaded:", map.loaded(), "map style loaded:", map.isStyleLoaded());

      // If map is loaded, proceed even if isStyleLoaded() returns false
      // Sometimes isStyleLoaded() can return false incorrectly, but markers can still be added
      if (!map.isStyleLoaded()) {
        console.log("⚠️ Map style check returned false, but map is loaded - proceeding anyway");
        // Continue to icon setup - markers can often be added even if style check fails
      }

      // Clean up existing markers first - CRITICAL to prevent duplicates
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          // Marker might already be removed
        }
      });
      markersRef.current.clear();

      const icons = countryIcons;

      console.log("🔍 useCountryIcons - Total icons:", icons.length);
      console.log("🔍 useCountryIcons - Icons with timelinePointId:", icons.filter(i => i.timelinePointId).length);
      console.log("🔍 useCountryIcons - Icon types:", icons.map(i => ({ id: i.id, country: i.country, iconType: i.iconType, timelinePointId: i.timelinePointId })));

      // Filter icons - show icons based on timeline progression
      const timelinePoints = activeEvent.timelinePoints || [];
      const currentPoint = activeTimelinePointId
        ? timelinePoints.find((p: any) => p.id === activeTimelinePointId)
        : null;
      const currentPosition = currentPoint?.position ?? 0;

      const visibleIcons = icons.filter((icon) => {
        // Icons must have a timelinePointId to be displayed
        if (!icon.timelinePointId) {
          console.warn(`⚠️ Icon ${icon.id} (${icon.country}) has no timelinePointId - will not be displayed`);
          return false;
        }

        const extendedIcon = icon as ExtendedCountryIcon;

        // Check if icon should appear
        let shouldAppear = false;

        // If icon is linked to a timeline point, check if we're at that point
        if (icon.timelinePointId && !icon.timelinePointId.startsWith('area-') && !icon.timelinePointId.startsWith('unified-area-')) {
          // Regular timeline point icon
          // Handle duplicate IDs by stripping index suffix if present
          const cleanActiveId = activeTimelinePointId?.replace(/-index-\d+$/, '') || activeTimelinePointId;
          const cleanIconTimelinePointId = icon.timelinePointId?.replace(/-index-\d+$/, '') || icon.timelinePointId;

          // Show icon if:
          // 1. The timeline point is active, OR
          // 2. No timeline point is active (show all icons when timeline is not playing)
          if (!activeTimelinePointId) {
            // No active timeline point - show all icons
            shouldAppear = true;
          } else {
            // Timeline point is active - show only matching icons
            shouldAppear = cleanActiveId === cleanIconTimelinePointId ||
              activeTimelinePointId === icon.timelinePointId ||
              cleanActiveId === icon.timelinePointId ||
              activeTimelinePointId === cleanIconTimelinePointId;
          }

          if (!shouldAppear) {
            console.log(`🔍 Icon ${icon.id} (${icon.country}) not visible:`, {
              iconTimelinePointId: icon.timelinePointId,
              cleanIconTimelinePointId,
              activeTimelinePointId,
              cleanActiveId,
              shouldAppear: false
            });
          }
        } else {
          // Unified area icon with position-based or auto-generated timeline point
          if (icon.appearAtPosition !== undefined) {
            // Position-based appearance
            if (!activeTimelinePointId) {
              shouldAppear = icon.appearAtPosition <= 0;
            } else {
              shouldAppear = currentPosition >= icon.appearAtPosition;
            }
          } else {
            // Default: show when timeline point is active (for auto-generated timeline points)
            shouldAppear = activeTimelinePointId === icon.timelinePointId;
          }
        }

        if (!shouldAppear) {
          return false;
        }

        // Check if icon should disappear (for unified areas)
        if (extendedIcon.disappearAtTimelinePoint) {
          const disappearIndex = timelinePoints.findIndex(
            (p: any) => p.id === extendedIcon.disappearAtTimelinePoint
          );
          const currentIndex = timelinePoints.findIndex(
            (p: any) => p.id === activeTimelinePointId
          );
          // Hide if we've reached or passed the disappear point
          if (disappearIndex >= 0 && currentIndex >= disappearIndex) {
            return false;
          }
        } else if (extendedIcon.disappearAtPosition !== undefined) {
          // Position-based disappearance
          if (activeTimelinePointId && currentPosition >= extendedIcon.disappearAtPosition) {
            return false;
          }
        }

        return true;
      });

      console.log("✅ useCountryIcons - Visible icons to render:", visibleIcons.length);
      console.log("✅ useCountryIcons - Active timeline point ID:", activeTimelinePointId);
      console.log("✅ useCountryIcons - Visible icon details:", visibleIcons.map(i => ({
        id: i.id,
        country: i.country,
        iconType: i.iconType,
        timelinePointId: i.timelinePointId
      })));

      // Add markers: show the same diamond as the timeline on the map for the active timeline point's country
      visibleIcons.forEach((icon) => {

        // Skip if marker already exists (safety check)
        if (markersRef.current.has(icon.id)) {
          console.warn(`Icon ${icon.id} already exists, skipping duplicate`);
          return;
        }

        // Convert [lat, lng] to [lng, lat] for MapLibre
        // Ensure coordinates are valid
        const lat = typeof icon.coordinates[0] === 'number' ? icon.coordinates[0] : null;
        const lng = typeof icon.coordinates[1] === 'number' ? icon.coordinates[1] : null;

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
          console.warn(`❌ Icon ${icon.id} (${icon.country}) has invalid coordinates:`, icon.coordinates);
          return;
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn(`❌ Icon ${icon.id} (${icon.country}) has out-of-range coordinates: [${lat}, ${lng}]`);
          return;
        }

        console.log(`📍 Creating marker for icon ${icon.id} (${icon.country}) at [${lat}, ${lng}] linked to timeline point: ${icon.timelinePointId}`);

        const el = document.createElement("div");
        el.className = "country-icon-marker";
        el.style.width = "52px";
        el.style.height = "52px";
        el.style.cursor = "pointer";
        el.style.position = "absolute"; // Changed from relative to absolute
        el.style.pointerEvents = "auto"; // Ensure clicks work
        el.style.zIndex = "1000"; // Ensure marker appears above map layers

        // Check if this icon is selected
        const isSelected = selectedIconId === icon.id;

        // Resolve linked timeline point, icon type, and turning-point status (before building diamonds)
        let iconType = "map-pin";
        let linkedPoint: { isTurningPoint?: boolean; eventType?: string } | undefined;
        if (icon.timelinePointId && activeEvent?.timelinePoints) {
          linkedPoint = activeEvent.timelinePoints.find(
            (p: any) => p.id === icon.timelinePointId ||
              p.id?.replace(/-index-\d+$/, '') === icon.timelinePointId?.replace(/-index-\d+$/, '')
          ) as { isTurningPoint?: boolean; eventType?: string } | undefined;
          if (linkedPoint?.eventType) {
            const eventTypeToIconType: Record<string, string> = {
              military: "military",
              diplomatic: "flag",
              economic: "finance",
              ideological: "users",
              technological: "zap",
              mixed: "globe",
            };
            const normalizedEventType = (linkedPoint.eventType || "").toLowerCase();
            iconType = eventTypeToIconType[normalizedEventType] || icon.iconType || "map-pin";
            if (iconType === "tank") iconType = "military";
          } else {
            iconType = icon.iconType || "map-pin";
          }
        } else {
          iconType = icon.iconType || "map-pin";
        }
        if (iconType === "tank") iconType = "military";

        const isTurningPoint = Boolean(linkedPoint?.isTurningPoint);
        const theoryForColor = activeTheory ?? activeEvent?.theory;
        const theoryColor = isTurningPoint && theoryForColor ? getTheoryColor(theoryForColor as import("@/stores/useTheoryStore").TheoryType) : null;
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        };

        // Same structure as timeline: container has no background/border; only the two diamonds are visible
        const outerDiv = document.createElement("div");
        outerDiv.className = "country-icon-marker-inner" + (isTurningPoint ? " map-icon-turning-point" : "");
        outerDiv.style.width = "52px";
        outerDiv.style.height = "52px";
        outerDiv.style.position = "relative";
        outerDiv.style.display = "flex";
        outerDiv.style.alignItems = "center";
        outerDiv.style.justifyContent = "center";
        outerDiv.style.zIndex = "1000";
        outerDiv.style.cursor = "pointer";
        outerDiv.style.backgroundColor = "transparent";
        outerDiv.style.border = "none";

        const borderColor = theoryColor ? hexToRgba(theoryColor, 0.95) : "rgba(255, 228, 190, 0.9)";
        const fillColor = theoryColor || "#ffe4be";
        const glowColor = theoryColor ? hexToRgba(theoryColor, 0.6) : "rgba(255, 228, 190, 0.6)";

        // Outer diamond - border only, rotated 45deg; use theory color for turning points
        const outerDiamond = document.createElement("div");
        outerDiamond.className = "map-outer-diamond";
        outerDiamond.style.position = "absolute";
        outerDiamond.style.width = "42px";
        outerDiamond.style.height = "42px";
        outerDiamond.style.border = `2px solid ${borderColor}`;
        outerDiamond.style.backgroundColor = "transparent";
        outerDiamond.style.borderRadius = "0";
        outerDiamond.style.top = "50%";
        outerDiamond.style.left = "50%";
        outerDiamond.style.transform = "translate(-50%, -50%) rotate(45deg)";
        outerDiamond.style.boxShadow = isSelected
          ? `0 0 18px ${glowColor}, 0 0 30px ${theoryColor ? hexToRgba(theoryColor, 0.4) : "rgba(255, 228, 190, 0.4)"}`
          : `0 0 12px ${glowColor}`;
        outerDiamond.style.pointerEvents = "none";
        outerDiv.appendChild(outerDiamond);

        // Inner diamond - filled; use theory color for turning points
        const innerDiamond = document.createElement("div");
        innerDiamond.className = "map-inner-diamond";
        innerDiamond.style.position = "absolute";
        innerDiamond.style.width = "26px";
        innerDiamond.style.height = "26px";
        innerDiamond.style.top = "50%";
        innerDiamond.style.left = "50%";
        innerDiamond.style.transform = "translate(-50%, -50%) rotate(45deg)";
        innerDiamond.style.backgroundColor = fillColor;
        innerDiamond.style.border = "none";
        innerDiamond.style.borderRadius = "0";
        innerDiamond.style.boxShadow = isSelected
          ? `0 0 12px ${glowColor}, 0 0 20px ${glowColor}`
          : "none";
        innerDiamond.style.display = "flex";
        innerDiamond.style.alignItems = "center";
        innerDiamond.style.justifyContent = "center";
        innerDiamond.style.zIndex = "10";
        innerDiamond.style.overflow = "visible";
        
        // Inner div for symbol - counter-rotate to show symbol upright
        const innerDiv = document.createElement("div");
        innerDiv.className = "map-icon-symbol";
        innerDiv.style.transform = "rotate(-45deg)";
        innerDiv.style.display = "flex";
        innerDiv.style.alignItems = "center";
        innerDiv.style.justifyContent = "center";
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.top = "0";
        innerDiv.style.left = "0";
        innerDiamond.appendChild(innerDiv);
        outerDiv.appendChild(innerDiamond);

        console.log(`🎨 Rendering icon ${icon.id} (${icon.country}) with type: ${iconType}`);
        const iconSVG = getIconSVG(iconType);
        if (!iconSVG) {
          console.error(`❌ No SVG found for icon type: ${iconType}, using map-pin`);
          innerDiv.innerHTML = getIconSVG("map-pin");
        } else {
          console.log(`✅ Icon SVG for ${iconType} loaded successfully`);
          // Wrap SVG in a container to ensure proper styling
          innerDiv.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: inherit;">${iconSVG}</div>`;
        }
        
        // Ensure all SVG elements inside have proper styling - make them larger and more visible
        const svgElements = innerDiv.querySelectorAll('svg');
        svgElements.forEach(svg => {
          // Check if this is a fill-based icon (finance, tank, flag) - has fill paths but no stroke paths
          const hasFillPaths = svg.querySelectorAll('path[fill="currentColor"], path[fill]:not([fill="none"]):not([fill=""])').length > 0;
          const hasOnlyStrokePaths = svg.querySelectorAll('path[stroke="currentColor"], path[stroke]:not([stroke="none"]):not([stroke=""])').length > 0 && 
                                     svg.querySelectorAll('path[fill="currentColor"], path[fill]:not([fill="none"]):not([fill=""])').length === 0;
          const isFillBased = hasFillPaths && !hasOnlyStrokePaths;
          
          // Check if this is the flag icon (diplomatic) - it needs special handling
          // Flag icon has viewBox "0 0 1500 1499.999933" and uses currentColor fill
          const isFlagIcon = svg.getAttribute('viewBox')?.includes('1500') || 
                            (iconType === "flag" && svg.querySelectorAll('path[fill="currentColor"]').length > 0);
          
          // Size icons to fit nicely in the inner diamond (large for visibility)
          if (iconType === "military") {
            svg.style.width = "24px";
            svg.style.height = "24px";
            svg.style.color = "#1e293b";
          } else if (iconType === "flag") {
            svg.style.width = "24px";
            svg.style.height = "24px";
            svg.setAttribute("stroke-width", "2");
            svg.style.color = "#1e293b";
          } else if (isFlagIcon) {
            svg.style.width = '21px';
            svg.style.height = '21px';
          } else if (isFillBased) {
            svg.style.width = '18px';
            svg.style.height = '18px';
          } else {
            svg.style.width = '18px';
            svg.style.height = '18px';
          }
          
          // Ensure SVG has transparent background - no black background
          svg.style.backgroundColor = 'transparent';
          
          svg.style.display = 'block';
          svg.style.color = '#0f172a'; // Darker color for better contrast (#0f172a is slate-900)
          
          // Make sure fill and stroke use explicit dark colors for better visibility
          const allPaths = svg.querySelectorAll('path, circle, polygon, line, rect');
          allPaths.forEach(element => {
            // For flag icon, don't modify anything - use exactly as provided
            if (isFlagIcon) {
              // Skip all modifications - the SVG is already correct with fill="#fee4be"
              return; // Don't modify flag icon paths at all
            }
            
            const fill = element.getAttribute('fill');
            const stroke = element.getAttribute('stroke');
            
            // For fill-based icons (finance, tank), use dark fill with light stroke outline for visibility
            if (isFillBased) {
              element.setAttribute('fill', '#0f172a');
              element.setAttribute('stroke', '#ffe4be');
              element.setAttribute('stroke-width', '1.2');
              element.setAttribute('stroke-linecap', 'round');
              element.setAttribute('stroke-linejoin', 'round');
            } else {
              // For non-fill-based icons, just set fill if needed
              if (fill === 'currentColor' || (fill === null && !stroke)) {
                element.setAttribute('fill', '#0f172a');
              }
            }
            
            // For stroke-based icons (flag, users, zap, globe), use thicker, darker strokes
            if (stroke === 'currentColor' || (stroke && stroke !== 'none' && stroke !== '')) {
              element.setAttribute('stroke', '#0f172a'); // Very dark stroke
              const currentStrokeWidth = element.getAttribute('stroke-width');
              const strokeWidth = currentStrokeWidth ? Math.max(3, parseFloat(currentStrokeWidth) * 1.5) : 3;
              element.setAttribute('stroke-width', strokeWidth.toString());
              element.setAttribute('stroke-linecap', 'round');
              element.setAttribute('stroke-linejoin', 'round');
            }
          });
        });

        // innerDiv is already appended to innerDiamond (line 326) - do NOT move it to outerDiv
        el.appendChild(outerDiv);

        // Add hover effect - scale only; do NOT rotate outerDiv (diamond shape comes from inner elements' rotate(45deg))
        el.addEventListener("mouseenter", () => {
          outerDiv.style.transform = "scale(1.15)";
        });
        el.addEventListener("mouseleave", () => {
          outerDiv.style.transform = "scale(1)";
        });

        // Add click handler
        const clickHandler = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          console.log("Icon clicked:", icon);
          const handler = onIconClickRef.current;
          if (handler) {
            console.log("Calling onIconClick handler");
            handler(icon);
          } else {
            console.warn("onIconClick handler is not defined");
          }
        };
        el.addEventListener("click", clickHandler);

        // Create marker with proper coordinates
        console.log(`🗺️ Adding marker to map at [lng, lat]: [${lng}, ${lat}] for ${icon.country} (${icon.iconType})`);
        console.log(`🗺️ Marker element created:`, {
          width: el.offsetWidth,
          height: el.offsetHeight,
          innerHTML: el.innerHTML.substring(0, 100) + '...'
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center' // Center the marker on the coordinates
        })
          .setLngLat([lng, lat]) // MapLibre expects [lng, lat]
          .addTo(map);

        markersRef.current.set(icon.id, marker);

        // Verify marker was added
        const markerElement = marker.getElement();
        console.log(`✅ Marker successfully added to map for ${icon.country}.`, {
          markerExists: !!marker,
          elementVisible: markerElement.offsetParent !== null || markerElement.offsetWidth > 0,
          elementDimensions: { width: markerElement.offsetWidth, height: markerElement.offsetHeight },
          mapBounds: map.getBounds(),
          markerLngLat: marker.getLngLat()
        });
      });
    };

    setupIcons();

    return () => {
      // Cleanup function - remove all markers
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          // Marker might already be removed
        }
      });
      markersRef.current.clear();
    };
  }, [map, activeEvent?.id, countryIcons, activeTimelinePointId, countryIconsKey]);

  // Update icon colors when selectedIconId or activeTheory changes
  useEffect(() => {
    if (!map || !activeEvent) return;

    console.log("🎨 Updating icon colors - selectedIconId:", selectedIconId, "activeTheory:", activeTheory);

    markersRef.current.forEach((marker, iconId) => {
      try {
        const markerElement = marker.getElement();
        if (!markerElement) {
          console.warn(`⚠️ Marker element not found for icon ${iconId}`);
          return;
        }

        // Container stays transparent (no square frame) - same as timeline
        const outerDiv = markerElement.firstElementChild as HTMLElement;
        if (!outerDiv) return;
        outerDiv.style.backgroundColor = "transparent";
        outerDiv.style.border = "none";
        outerDiv.style.transform = ""; // keep container unrotated; diamond shape is from inner elements

        const isSelected = iconId === selectedIconId;
        let iconColor = "rgba(255, 228, 190, 0.9)";
        let iconBgColor = "#ffe4be";
        let iconShadowColor = "rgba(255, 228, 190, 0.6)";

        // Update OUTER diamond (border only, keep 45deg rotation so it looks like a diamond)
        const outerDiamond = outerDiv.querySelector(".map-outer-diamond") as HTMLElement;
        if (outerDiamond) {
          outerDiamond.style.border = `2px solid ${iconColor}`;
          outerDiamond.style.backgroundColor = "transparent";
          outerDiamond.style.transform = "translate(-50%, -50%) rotate(45deg)";
          outerDiamond.style.boxShadow = isSelected
            ? `0 0 18px ${iconShadowColor}, 0 0 30px ${iconShadowColor}80`
            : `0 0 12px ${iconShadowColor}`;
        }

        // Update INNER diamond (filled, keep 45deg rotation so it looks like a diamond)
        const innerDiamond = outerDiv.querySelector(".map-inner-diamond") as HTMLElement;
        if (innerDiamond) {
          innerDiamond.style.backgroundColor = iconBgColor;
          innerDiamond.style.transform = "translate(-50%, -50%) rotate(45deg)";
          innerDiamond.style.boxShadow = isSelected
            ? `0 0 12px ${iconShadowColor}, 0 0 20px ${iconShadowColor}99`
            : "none";
        }

        // Inner icon (SVG) - dark for contrast
        const innerIcon = outerDiv.querySelector(".map-icon-symbol") as HTMLElement;
        if (innerIcon) {
          innerIcon.style.color = "#1e293b";
          innerIcon.style.filter = "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))";
        }

        console.log(`✅ Updated icon ${iconId} - isSelected: ${isSelected}, color: ${iconBgColor}`);
      } catch (error) {
        console.error(`❌ Error updating icon ${iconId}:`, error);
      }
    });
  }, [selectedIconId, activeTheory, getTheoryColor, map, activeEvent]);

  // Debug: Log when activeEvent or countryIcons change
  useEffect(() => {
    console.log("🔄 useCountryIcons - activeEvent changed:", {
      eventId: activeEvent?.id,
      iconCount: activeEvent?.countryIcons?.length || 0,
      icons: activeEvent?.countryIcons?.map(i => ({
        id: i.id,
        country: i.country,
        iconType: i.iconType,
        timelinePointId: i.timelinePointId,
        coordinates: i.coordinates
      }))
    });
  }, [activeEvent?.id, activeEvent?.countryIcons]);
}

// Helper function to get icon SVG
// Icons are designed to match the website's dark/gold theme and clearly represent each event type
function getIconSVG(iconType: string): string {
  const iconMap: Record<string, string> = {
    // Economic - investment chart (from economic-investment-svgrepo-com.svg)
    "finance": `<svg width="22" height="22" viewBox="0 0 47 47" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.371,19.227H2.137C0.957,19.227,0,20.184,0,21.364v23.5C0,46.043,0.957,47,2.137,47h5.234c1.18,0,2.136-0.957,2.136-2.136v-23.5C9.507,20.184,8.551,19.227,7.371,19.227z"/><path d="M19.869,25.635h-5.234c-1.181,0-2.137,0.957-2.137,2.137v17.09c0,1.181,0.956,2.137,2.137,2.137h5.234c1.18,0,2.136-0.957,2.136-2.137v-17.09C22.005,26.592,21.049,25.635,19.869,25.635z"/><path d="M32.365,25.635h-5.234c-1.18,0-2.136,0.957-2.136,2.137v17.09c0,1.181,0.956,2.137,2.136,2.137h5.234c1.181,0,2.137-0.957,2.137-2.137v-17.09C34.502,26.592,33.546,25.635,32.365,25.635z"/><path d="M44.863,19.227h-5.234c-1.18,0-2.136,0.957-2.136,2.137v23.5c0,1.18,0.956,2.136,2.136,2.136h5.234C46.043,47,47,46.042,47,44.864v-23.5C47,20.184,46.043,19.227,44.863,19.227z"/><path d="M24.123,12.87v3.846c1.164-0.077,2.391-0.623,2.391-1.904C26.514,13.49,25.169,13.103,24.123,12.87z"/><path d="M20.778,8.267c0,0.972,0.723,1.534,2.18,1.826V6.614C21.634,6.653,20.778,7.431,20.778,8.267z"/><path d="M23.5,0C17.021,0,11.75,5.272,11.75,11.75c0,6.476,5.271,11.748,11.75,11.748c6.479,0,11.75-5.272,11.75-11.748C35.25,5.272,29.979,0,23.5,0z M24.123,18.699v1.203c0,0.331-0.254,0.661-0.586,0.661c-0.328,0-0.579-0.33-0.579-0.661v-1.203c-3.283-0.08-4.916-2.042-4.916-3.577c0-0.775,0.469-1.223,1.203-1.223c2.176,0,0.484,2.681,3.713,2.816v-4.06c-2.88-0.523-4.624-1.786-4.624-3.942c0-2.641,2.196-4.003,4.624-4.079V3.598c0-0.331,0.251-0.661,0.579-0.661c0.332,0,0.586,0.33,0.586,0.661v1.036c1.514,0.04,4.623,0.99,4.623,2.895c0,0.757-0.566,1.203-1.227,1.203c-1.264,0-1.246-2.077-3.396-2.117v3.691c2.564,0.545,4.835,1.302,4.835,4.294C28.958,17.202,27.016,18.522,24.123,18.699z"/></svg>`,
    "tank": `<svg width="22" height="22" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,
    // Default map pin icon
    "map-pin": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',

    // Military - Exact icon from 2.svg (mapped to "shield" icon type)
    "shield": `<svg width="18" height="18" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,
    // Military: microchip icon for military timeline points on the map
    "military": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1500 1499.999933" fill="currentColor" preserveAspectRatio="xMidYMid meet"><path fill="currentColor" fill-opacity="1" fill-rule="evenodd" d="M 744.488281 313.234375 C 733.882812 314.4375 725.285156 318.5625 717.199219 326.328125 C 707.785156 335.367188 703.3125 344.355469 701.851562 357.183594 C 700.800781 366.410156 705.511719 382.277344 711.617188 390.078125 C 713.246094 392.164062 713.328125 395.09375 713.328125 452.589844 L 713.328125 512.917969 L 680.964844 513.203125 L 648.597656 513.484375 L 641.59375 516.949219 C 633.789062 520.808594 629.761719 524.847656 625.929688 532.675781 C 618.078125 548.710938 625.425781 568.5 642.398438 577.046875 C 648.097656 579.917969 656.085938 580.847656 675.054688 580.855469 L 692.242188 580.863281 L 692.242188 600.460938 C 692.242188 615.152344 691.953125 620.300781 691.082031 621.023438 C 689.011719 622.738281 671.898438 630.996094 660.617188 635.722656 C 647.355469 641.273438 638.796875 644.117188 623.03125 648.199219 C 608.703125 651.910156 603.476562 652.742188 576.734375 655.558594 C 555.011719 657.847656 550.742188 658.863281 544.359375 663.253906 C 535.242188 669.527344 529.890625 678.207031 528.171875 689.496094 C 527.515625 693.820312 527.296875 726.230469 527.507812 788.960938 C 527.839844 888.957031 527.738281 886.613281 532.804688 911.742188 C 540.195312 948.394531 563.097656 992.785156 591.957031 1026.394531 C 602.117188 1038.226562 625.597656 1061.089844 636.78125 1070.042969 C 653.875 1083.730469 672.675781 1096.851562 685.050781 1103.734375 C 688.40625 1105.597656 691.558594 1107.628906 692.058594 1108.242188 C 692.554688 1108.855469 693.628906 1111.972656 694.4375 1115.167969 C 699.464844 1134.964844 712.207031 1156.5625 728.058594 1172.152344 C 736.269531 1180.234375 746.058594 1186.820312 749.847656 1186.820312 C 757.074219 1186.820312 775.179688 1171.570312 786.085938 1156.296875 C 795.183594 1143.550781 803.191406 1126.4375 806.816406 1111.976562 C 807.671875 1108.570312 808.449219 1107.777344 814.40625 1104.253906 C 864.601562 1074.554688 908.691406 1032.765625 934.820312 990.125 C 950.292969 964.882812 959.8125 942.835938 965.835938 918.292969 C 972.613281 890.707031 972.304688 897.019531 972.304688 785.292969 L 972.304688 684.914062 L 969.242188 678.75 C 964.324219 668.859375 955.457031 661.160156 945.84375 658.4375 C 943.253906 657.703125 933.917969 656.425781 925.09375 655.59375 C 902.234375 653.441406 891.734375 651.757812 875.867188 647.710938 C 855.230469 642.445312 829.925781 632.59375 813.636719 623.484375 L 807.75 620.191406 L 807.75 580.863281 L 824.480469 580.835938 C 844.109375 580.800781 853.019531 579.824219 858.316406 577.121094 C 864.527344 573.953125 871.390625 566.804688 874.328125 560.441406 C 876.675781 555.363281 876.964844 553.730469 876.964844 545.570312 C 876.964844 537.101562 876.761719 536.054688 874.304688 531.875 C 870.09375 524.714844 864.847656 519.667969 858.269531 516.449219 L 852.214844 513.484375 L 819.667969 513.027344 L 787.125 512.566406 L 786.890625 452.695312 L 786.652344 392.824219 L 789.285156 388.984375 C 802.949219 369.03125 801.28125 345.117188 785.011719 327.722656 C 774.597656 316.59375 760.214844 311.449219 744.488281 313.234375 M 744.746094 331.5625 C 738.351562 332.824219 732.871094 335.730469 728.609375 340.113281 C 721.601562 347.320312 718.945312 355.972656 720.726562 365.796875 C 721.910156 372.308594 723.386719 375.445312 727.882812 380.992188 L 731.203125 385.09375 L 731.453125 449.078125 L 731.699219 513.0625 L 750.246094 512.816406 L 768.789062 512.566406 L 769.25 448.371094 L 769.707031 384.175781 L 773.230469 379.875 C 777.027344 375.242188 780.257812 366.542969 780.238281 360.996094 C 780.222656 356.371094 778.070312 348.695312 775.71875 344.894531 C 769.730469 335.203125 756.078125 329.328125 744.746094 331.5625 M 649.566406 532.238281 C 648.53125 532.660156 646.382812 534.480469 644.796875 536.285156 C 639.570312 542.238281 639.722656 550.117188 645.183594 556.160156 C 647.027344 558.199219 649.894531 560.1875 651.78125 560.730469 C 654.050781 561.390625 686.160156 561.613281 752.453125 561.425781 C 849.117188 561.15625 849.804688 561.140625 852.316406 559.261719 C 856.820312 555.902344 858.488281 552.816406 858.851562 547.1875 C 859.257812 540.808594 857.355469 536.507812 852.765625 533.441406 L 849.648438 531.359375 L 750.550781 531.417969 C 696.042969 531.449219 650.601562 531.820312 649.566406 532.238281 M 710.578125 841.984375 C 710.578125 1100.492188 710.597656 1103.179688 712.421875 1110.355469 C 714.753906 1119.546875 723.691406 1137.675781 730.003906 1146.027344 C 735.101562 1152.773438 746.085938 1164.132812 749.035156 1165.710938 C 752.65625 1167.652344 768.230469 1151.621094 776.527344 1137.410156 C 781.015625 1129.730469 786.328125 1116.796875 788.082031 1109.285156 C 789.300781 1104.078125 789.671875 965.820312 789.433594 605.84375 L 789.417969 580.863281 L 759.164062 580.863281 L 759.164062 1086.757812 L 756.847656 1089.511719 C 753.914062 1093 750.117188 1093.898438 746.414062 1091.980469 C 740.359375 1088.851562 740.832031 1110.722656 740.832031 833.007812 L 740.832031 580.863281 L 710.578125 580.863281 Z M 685.367188 644.320312 C 668.164062 653.277344 645.203125 661.628906 624.3125 666.53125 C 612.96875 669.191406 586.492188 673.074219 573.984375 673.910156 C 559.425781 674.886719 552.914062 677.808594 548.457031 685.371094 L 546.027344 689.496094 L 546.027344 783.460938 C 546.027344 883.9375 546.117188 886.375 550.703125 906.761719 C 559.332031 945.121094 578.914062 983.34375 606.128906 1014.933594 C 615.195312 1025.457031 634.386719 1044.257812 645.03125 1053.039062 C 649.570312 1056.785156 653.488281 1060.054688 653.742188 1060.308594 C 657.046875 1063.632812 690.238281 1085.980469 691.875 1085.980469 C 692.078125 1085.980469 692.242188 985.941406 692.242188 863.675781 C 692.242188 741.40625 691.933594 641.386719 691.554688 641.410156 C 691.179688 641.433594 688.394531 642.746094 685.367188 644.320312 M 807.75 863.675781 C 807.75 985.941406 807.910156 1085.980469 808.105469 1085.980469 C 808.78125 1085.980469 827.902344 1074.074219 832.707031 1070.660156 C 849.195312 1058.949219 863.882812 1046.335938 880.460938 1029.640625 C 892.707031 1017.308594 901.246094 1007.039062 911.023438 992.878906 C 929.496094 966.128906 939.511719 944.878906 947.601562 915.257812 C 954.054688 891.632812 953.742188 897.660156 954.140625 790.121094 C 954.398438 721.304688 954.210938 691.636719 953.5 689 C 952.949219 686.945312 951.042969 683.65625 949.265625 681.691406 C 944.582031 676.507812 938.65625 674.605469 923.511719 673.433594 C 882.433594 670.246094 847.878906 661.03125 814.878906 644.460938 C 811.488281 642.761719 808.496094 641.367188 808.234375 641.367188 C 807.96875 641.367188 807.75 741.40625 807.75 863.675781 "/></svg>`,

    // Diplomatic - people (from people-svgrepo-com.svg) for map marker
    "flag": `<svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.313 26.102l-6.296-3.488c2.34-1.841 2.976-5.459 2.976-7.488v-4.223c0-2.796-3.715-5.91-7.447-5.91-3.73 0-7.544 3.114-7.544 5.91v4.223c0 1.845 0.78 5.576 3.144 7.472l-6.458 3.503s-1.688 0.752-1.688 1.689v2.534c0 0.933 0.757 1.689 1.688 1.689h21.625c0.931 0 1.688-0.757 1.688-1.689v-2.534c0-0.994-1.689-1.689-1.689-1.689zM23.001 30.015h-21.001v-1.788c0.143-0.105 0.344-0.226 0.502-0.298 0.047-0.021 0.094-0.044 0.139-0.070l6.459-3.503c0.589-0.32 0.979-0.912 1.039-1.579s-0.219-1.32-0.741-1.739c-1.677-1.345-2.396-4.322-2.396-5.911v-4.223c0-1.437 2.708-3.91 5.544-3.91 2.889 0 5.447 2.44 5.447 3.91v4.223c0 1.566-0.486 4.557-2.212 5.915-0.528 0.416-0.813 1.070-0.757 1.739s0.446 1.267 1.035 1.589l6.296 3.488c0.055 0.030 0.126 0.063 0.184 0.089 0.148 0.063 0.329 0.167 0.462 0.259v1.809zM30.312 21.123l-6.39-3.488c2.34-1.841 3.070-5.459 3.070-7.488v-4.223c0-2.796-3.808-5.941-7.54-5.941-2.425 0-4.904 1.319-6.347 3.007 0.823 0.051 1.73 0.052 2.514 0.302 1.054-0.821 2.386-1.308 3.833-1.308 2.889 0 5.54 2.47 5.54 3.941v4.223c0 1.566-0.58 4.557-2.305 5.915-0.529 0.416-0.813 1.070-0.757 1.739 0.056 0.67 0.445 1.267 1.035 1.589l6.39 3.488c0.055 0.030 0.126 0.063 0.184 0.089 0.148 0.063 0.329 0.167 0.462 0.259v1.779h-4.037c0.61 0.46 0.794 1.118 1.031 2h3.319c0.931 0 1.688-0.757 1.688-1.689v-2.503c-0.001-0.995-1.689-1.691-1.689-1.691z"/></svg>`,

    // Economic - Building with dollar sign or coins (represents commerce/economy)
    "building": `<svg width="18" height="18" viewBox="0 0 185 185" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M112.96,77.43s-.07.99-.17,2.16c-.11,1.18-.29,2.95-.38,3.94-.2,2.12-.21,2.15-.35,2.15-.07,0-.39-.23-.73-.5-1.49-1.2-1.75-1.3-2.15-.97-.1.09-.57.67-1.04,1.29-.41.54-.82,1.09-1.23,1.64-.28.37-.54.74-.82,1.11-.71.99-.89,1.22-1.94,2.61-1.27,1.68-1.79,2.39-1.94,2.67-.07.11-.25.36-.42.55-.37.39-.81.97-1.14,1.5-.13.21-.35.5-.49.66-.13.14-.57.71-.97,1.28-1.57,2.16-2.46,2.92-3.91,3.33-.69.2-2,.21-2.64.04-1.29-.35-2.05-.94-4.25-3.35-.55-.6-1.27-1.35-1.57-1.67-.3-.31-.78-.82-1.07-1.12-.5-.56-1.39-1.29-1.69-1.41-.5-.19-1.28-.12-1.86.16-.67.32-1.11.86-3.42,4.08-.52.72-1.25,1.72-1.61,2.21-.36.5-.89,1.24-1.18,1.65-.29.41-.69.97-.91,1.25-.21.28-.72.97-1.12,1.55-.62.88-.78,1.07-1.02,1.18-.46.22-.88.16-1.24-.18-.44-.41-.5-.9-.18-1.34.1-.14.46-.64.77-1.08.31-.45.84-1.17,1.17-1.6.32-.44.75-1.02.94-1.3s.46-.66.59-.82.38-.5.56-.75c.17-.25.59-.82.91-1.28.32-.45.82-1.12,1.08-1.49.27-.38.65-.89.85-1.14.2-.26.58-.75.84-1.12.57-.81,1.46-1.56,2.26-1.91.31-.14,1.39-.32,1.9-.32.57,0,1.47.19,1.88.39.5.25,1.78,1.34,2.3,1.98.23.28.6.67.84.88.23.2.54.53.71.73.32.41.44.53,1.82,1.98,1.58,1.67,1.99,1.91,3.11,1.87.9-.04,1.2-.2,2.07-1.09.65-.66,1.04-1.15,2.98-3.81,1.05-1.43,1.68-2.27,2.01-2.7.17-.22.9-1.19,1.64-2.16.72-.97,1.63-2.17,2.01-2.67.38-.5.84-1.13,1.01-1.4.18-.27.5-.71.72-.98.75-.92.87-1.15.74-1.57-.08-.3-.27-.49-1.28-1.24-.43-.32-.78-.62-.78-.67,0-.09,1.06-.56,2.51-1.12.59-.23,1.72-.67,2.51-.99.79-.31,1.64-.63,1.87-.71.24-.08.51-.19.62-.25s.2-.09.23-.08v-.03ZM121.74,86.34c-.47-2.1-.66-2.79-1.24-4.31-1.61-4.26-4.24-8.17-7.64-11.36-2.31-2.16-5.58-4.28-8.43-5.47-2.23-.93-3.91-1.47-5.91-1.87-1.8-.36-2.56-.48-3.79-.56-1.08-.08-3.26-.08-4.42,0-3.69.26-8.03,1.47-11.36,3.17-2.81,1.44-5.31,3.26-7.57,5.5-1.49,1.47-2.21,2.33-3.54,4.22-.78,1.11-2.01,3.26-2.62,4.63-1.3,2.89-2.12,5.91-2.51,9.35-.11.96-.11,4.58,0,5.65.36,3.46,1.4,7.07,2.93,10.12,1.64,3.27,3.35,5.62,5.98,8.2,2.49,2.44,4.62,3.97,7.61,5.47,4.25,2.13,8.72,3.24,13.16,3.24,4.81,0,9.24-1.09,13.74-3.36,3.82-1.94,7.36-4.91,10.11-8.49,2.56-3.34,4.26-6.82,5.24-10.74,1.17-4.66,1.25-8.86.27-13.38ZM114.15,80.36c-.06.43-.2,1.84-.32,3.12-.13,1.29-.26,2.46-.3,2.62-.1.37-.54.79-.99.92-.62.19-1.15,0-2.18-.77-.31-.24-.62-.44-.66-.44s-.62.74-1.27,1.65c-.67.9-2.67,3.58-4.45,5.96-1.77,2.37-3.38,4.52-3.56,4.77-.74,1.03-1.88,2.37-2.28,2.7-.85.7-1.65,1.09-2.91,1.42-.56.14-.71.16-1.57.13-.84-.03-1.02-.05-1.54-.23-1.3-.44-2.01-.9-3.09-2.02-.72-.75-.78-.8-3.07-3.26-1.85-1.97-2.13-2.23-2.43-2.28s-.71.07-.97.28c-.36.3-1.78,2.23-6.15,8.35-.97,1.36-1.92,2.65-2.12,2.85-.43.45-.84.69-1.41.78-1.07.2-2.21-.35-2.7-1.29-.25-.47-.3-.66-.29-1.2,0-.79.03-.82,2.56-4.26,1.42-1.92,3.05-4.17,4.04-5.55,2.37-3.3,3.08-4.02,4.52-4.55.87-.31,1.37-.4,2.34-.4s1.52.1,2.41.5c1.04.45,1.29.69,4.03,3.57.87.91,1.9,2.03,2.31,2.47.99,1.09,1.18,1.21,1.79,1.24.34.02.53,0,.67-.08.29-.14.89-.85,1.83-2.1.99-1.32,1.97-2.64,2.96-3.95,1.91-2.55,3.01-4.03,4.02-5.39.59-.79,1.17-1.58,1.75-2.38.28-.37.5-.69.5-.73,0-.03-.32-.3-.71-.58-1.09-.81-1.29-1.09-1.24-1.83.05-.75.39-1.05,1.91-1.64.47-.18,1.55-.61,2.42-.94.87-.34,1.63-.64,1.7-.68.07-.03.5-.2.94-.38.45-.18,1.09-.45,1.44-.59.56-.24.66-.27,1.06-.24.3.02.5.07.67.17.25.16.5.59.58.97.05.23-.09,1.98-.26,3.31l.04-.02ZM92.51,24.59L24.59,92.5l67.92,67.92,67.91-67.92L92.51,24.59ZM119.61,108.12c-1.68,2.79-3.82,5.37-6.23,7.52-1.66,1.48-2.8,2.34-4.58,3.47-1.28.81-2.22,1.3-3.59,1.91-3.4,1.49-6.63,2.34-10.22,2.67-1.18.1-4.15.1-5.06,0-4.34-.51-7.43-1.4-11.04-3.14-5.5-2.66-10.54-7.35-13.62-12.71-.83-1.44-1.91-3.82-2.44-5.35-.86-2.5-1.29-4.55-1.62-7.61-.11-1.11-.1-4.13.04-5.29.34-3.02.84-5.16,1.76-7.7,1.68-4.65,4.61-9.1,8.01-12.17,3.28-2.96,6.15-4.78,9.9-6.26,3.28-1.3,6.35-1.98,9.9-2.2,1.18-.08,3.68-.02,4.79.1,6.43.69,12.16,3.11,17.09,7.22,1.69,1.4,4.05,3.93,5.19,5.51.75,1.06,1.65,2.47,2.05,3.2,2.07,3.83,3.29,7.66,3.78,11.79.34,2.92.19,6.35-.42,9.34-.69,3.44-2.05,7.02-3.66,9.7h-.02ZM92.5,4.04l88.46,88.46-88.46,88.46L4.04,92.5,92.5,4.04M92.5,0L0,92.5l92.5,92.5,92.5-92.5L92.5,0Z" />
</svg>`,

    // Ideological - brainstorm/idea (from brainstorm-idea-svgrepo-com.svg)
    "users": `<svg width="22" height="22" viewBox="0 0 512.001 512.001" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M463.344,419.582c14.605-10.454,24.147-27.55,24.147-46.84c0-31.747-25.828-57.575-57.575-57.575c-31.747,0-57.575,25.828-57.575,57.575c0,19.296,9.548,36.397,24.16,46.849c-28.652,12.822-48.671,41.591-48.671,74.958c0,4.93,3.997,8.927,8.927,8.927c4.93,0,8.927-3.997,8.927-8.927c0-35.418,28.814-64.232,64.232-64.232c35.418,0,64.232,28.814,64.232,64.232c0,4.93,3.997,8.927,8.927,8.927s8.927-3.997,8.927-8.927C512,461.184,491.991,432.406,463.344,419.582z M429.916,412.463c-21.903,0-39.721-17.819-39.721-39.721s17.819-39.721,39.721-39.721c21.903,0,39.721,17.819,39.721,39.721C469.637,394.644,451.819,412.463,429.916,412.463z"/><path d="M312.952,31.882c-15.58-15.363-36.24-23.668-58.116-23.346c-44.673,0.627-80.537,37.503-79.946,82.201c0.275,20.771,8.391,40.427,22.854,55.35c9.843,10.156,15.263,23.277,15.263,36.947v10.353c0,20.883,16.989,37.872,37.872,37.872h10.242c20.883,0,37.872-16.989,37.872-37.872v-10.354c0-13.69,5.4-26.791,15.206-36.888c14.779-15.219,22.919-35.285,22.919-56.502C337.118,67.761,328.536,47.249,312.952,31.882z M281.14,193.388c0,11.038-8.98,20.018-20.018,20.018H250.88c-11.038,0-20.018-8.98-20.018-20.018v-1.426h50.279V193.388z M301.392,133.709c-10.923,11.248-17.722,25.346-19.661,40.4h-16.804v-51.468l26.419-26.419c3.486-3.486,3.486-9.139,0-12.624c-3.486-3.486-9.139-3.486-12.624,0L256,106.321l-22.721-22.723c-3.486-3.486-9.139-3.486-12.624,0c-3.486,3.486-3.486,9.139,0,12.624l26.419,26.419v51.468h-16.806c-1.945-15.039-8.759-29.153-19.703-40.446c-11.279-11.638-17.607-26.966-17.822-43.161c-0.461-34.863,27.507-63.625,62.345-64.114c0.306-0.004,0.612-0.006,0.918-0.006c16.738,0,32.479,6.447,44.412,18.214c12.155,11.984,18.847,27.983,18.847,45.05C319.264,106.191,312.917,121.84,301.392,133.709z"/><path d="M171.148,233.874c-3.485-3.486-9.137-3.486-12.624,0l-53.558,53.558c-3.486,3.485-3.486,9.137,0,12.624c1.742,1.744,4.028,2.615,6.312,2.615s4.569-0.871,6.312-2.615l53.558-53.558C174.634,243.013,174.634,237.36,171.148,233.874z"/><path d="M407.035,287.432l-53.558-53.558c-3.485-3.486-9.137-3.486-12.624,0c-3.486,3.485-3.486,9.137,0,12.624l53.558,53.558c1.742,1.744,4.028,2.615,6.312,2.615s4.569-0.871,6.312-2.615C410.521,296.57,410.521,290.918,407.035,287.432z"/><path d="M256,252.528c-4.93,0-8.927,3.997-8.927,8.927v34.074c0,4.93,3.997,8.927,8.927,8.927c4.93,0,8.927-3.997,8.927-8.927v-34.074C264.927,256.525,260.93,252.528,256,252.528z"/><circle cx="409.545" cy="352.724" r="8.927"/><circle cx="442.276" cy="352.724" r="8.927"/><path d="M289.429,419.582c14.605-10.454,24.147-27.55,24.147-46.84c0-31.747-25.828-57.575-57.575-57.575c-31.747,0-57.575,25.828-57.575,57.575c0,19.296,9.548,36.397,24.16,46.849c-28.652,12.822-48.671,41.591-48.671,74.958c0,4.93,3.997,8.927,8.927,8.927s8.927-3.997,8.927-8.927c0-35.418,28.814-64.232,64.232-64.232s64.232,28.814,64.232,64.232c0,4.93,3.997,8.927,8.927,8.927s8.927-3.997,8.927-8.927C338.085,461.184,318.076,432.406,289.429,419.582z M256,412.463c-21.903,0-39.721-17.819-39.721-39.721S234.099,333.02,256,333.02c21.903,0,39.721,17.819,39.721,39.721C295.721,394.644,277.903,412.463,256,412.463z"/><circle cx="239.64" cy="352.724" r="8.927"/><circle cx="272.372" cy="352.724" r="8.927"/><path d="M115.5,419.59c14.612-10.453,24.16-27.553,24.16-46.849c0-31.747-25.828-57.575-57.575-57.575S24.51,340.994,24.51,372.741c0,19.29,9.542,36.388,24.147,46.84C20.009,432.406,0,461.184,0,494.548c0,4.93,3.997,8.927,8.927,8.927c4.93,0,8.927-3.997,8.927-8.927c0-35.418,28.814-64.232,64.232-64.232s64.232,28.814,64.232,64.232c0,4.93,3.997,8.927,8.927,8.927s8.927-3.997,8.927-8.927C164.17,461.181,144.152,432.413,115.5,419.59z M82.085,412.463c-21.903,0-39.721-17.819-39.721-39.721s17.819-39.721,39.721-39.721c21.903,0,39.721,17.819,39.721,39.721S103.988,412.463,82.085,412.463z"/><circle cx="102.455" cy="352.724" r="8.927"/><circle cx="69.723" cy="352.724" r="8.927"/></svg>`,

    // Technological - microchip/tools (from tools-and-utensils-microchip-svgrepo-com.svg)
    "zap": `<svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M54.857,110.237c-5.77,0-10.449,4.679-10.449,10.449v46.498H10.449C4.679,167.184,0,171.863,0,177.633c0,5.77,4.679,10.449,10.449,10.449h33.959v31.347H10.449C4.679,219.429,0,224.108,0,229.878c0,5.77,4.679,10.449,10.449,10.449h33.959v31.347H10.449C4.679,271.673,0,276.353,0,282.122c0,5.77,4.679,10.449,10.449,10.449h33.959v31.347H10.449C4.679,323.918,0,328.597,0,334.367c0,5.77,4.679,10.449,10.449,10.449h33.959v46.498c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449V120.686C65.306,114.916,60.627,110.237,54.857,110.237z"/><path d="M391.314,446.694H120.686c-5.77,0-10.449,4.679-10.449,10.449c0,5.77,4.679,10.449,10.449,10.449h46.498v33.959c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-33.959h31.347v33.959c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-33.959h31.347v33.959c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-33.959h31.347v33.959c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-33.959h46.498c5.77,0,10.449-4.679,10.449-10.449C401.763,451.373,397.084,446.694,391.314,446.694z"/><path d="M120.686,65.306h270.629c5.77,0,10.449-4.679,10.449-10.449c0-5.77-4.679-10.449-10.449-10.449h-46.498V10.449c0-5.77-4.679-10.449-10.449-10.449c-5.77,0-10.449,4.679-10.449,10.449v33.959h-31.347V10.449c0-5.77-4.679-10.449-10.449-10.449c-5.77,0-10.449,4.679-10.449,10.449v33.959h-31.347V10.449c0-5.77-4.679-10.449-10.449-10.449c-5.77,0-10.449,4.679-10.449,10.449v33.959h-31.347V10.449c0-5.77-4.679-10.449-10.449-10.449c-5.77,0-10.449,4.679-10.449,10.449v33.959h-46.498c-5.77,0-10.449,4.679-10.449,10.449C110.237,60.627,114.916,65.306,120.686,65.306z"/><path d="M391.314,86.204H120.686c-19.013,0-34.482,15.469-34.482,34.482v270.629c0,19.013,15.469,34.482,34.482,34.482h270.629c19.013,0,34.482-15.469,34.482-34.482V120.686C425.796,101.673,410.327,86.204,391.314,86.204z M404.898,391.314c0,7.49-6.094,13.584-13.584,13.584H120.686c-7.49,0-13.584-6.094-13.584-13.584V120.686c0-7.49,6.094-13.584,13.584-13.584h270.629c7.49,0,13.584,6.094,13.584,13.584V391.314z"/><path d="M373.551,128H138.449c-5.77,0-10.449,4.679-10.449,10.449v235.102c0,5.77,4.679,10.449,10.449,10.449h235.102c5.77,0,10.449-4.679,10.449-10.449v-61.127c0-5.77-4.679-10.449-10.449-10.449c-5.77,0-10.449,4.679-10.449,10.449v50.678H148.898V148.898h214.204v32.914c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-43.363C384,132.679,379.321,128,373.551,128z"/><path d="M373.551,238.676c-5.77,0-10.449,4.679-10.449,10.449v1.045c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-1.045C384,243.354,379.321,238.676,373.551,238.676z"/><path d="M501.551,240.327c5.77,0,10.449-4.679,10.449-10.449c0-5.77-4.679-10.449-10.449-10.449h-33.959v-31.347h33.959c5.77,0,10.449-4.679,10.449-10.449c0-5.77-4.679-10.449-10.449-10.449h-33.959v-46.498c0-5.77-4.679-10.449-10.449-10.449c-5.77,0-10.449,4.679-10.449,10.449v270.629c0,5.77,4.679,10.449,10.449,10.449c5.77,0,10.449-4.679,10.449-10.449v-46.498h33.959c5.77,0,10.449-4.679,10.449-10.449c0-5.77-4.679-10.449-10.449-10.449h-33.959v-31.347h33.959c5.77,0,10.449-4.679,10.449-10.449c0-5.77-4.679-10.449-10.449-10.449h-33.959v-31.347H501.551z"/><circle cx="186.378" cy="186.378" r="10.449"/><circle cx="325.611" cy="325.611" r="10.449"/></svg>`,

    // Mixed - Globe/world icon (represents global or multi-faceted events)
    "globe": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  };

  const normalizedType = iconType?.toLowerCase();
  return iconMap[normalizedType] || iconMap[iconType] || iconMap["map-pin"];
}
