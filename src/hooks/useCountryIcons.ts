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

      // Add new markers
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
        el.style.width = "40px";
        el.style.height = "40px";
        el.style.cursor = "pointer";
        el.style.position = "absolute"; // Changed from relative to absolute
        el.style.pointerEvents = "auto"; // Ensure clicks work
        el.style.zIndex = "1000"; // Ensure marker appears above map layers

        // Check if this icon is selected
        const isSelected = selectedIconId === icon.id;

        // Always use gold/beige colors regardless of theory selection
        let iconColor = "rgba(255, 228, 190, 0.9)"; // More opaque gold/beige border
        let iconBgColor = "#ffe4be"; // Default beige background
        let iconShadowColor = "rgba(255, 228, 190, 0.6)"; // Default beige shadow
        let borderWidth = "3px"; // Thicker border for better visibility

        // Create outer container with fixed positioning
        // Always use diamond shape (no border radius) to match the drawing
        const outerDiv = document.createElement("div");
        outerDiv.style.width = "40px";
        outerDiv.style.height = "40px";
        outerDiv.style.position = "relative";
        outerDiv.style.transform = "rotate(45deg)"; // Always rotated to create diamond
        outerDiv.style.border = `${borderWidth} solid ${iconColor}`; // Thicker, more visible border
        outerDiv.style.backgroundColor = iconBgColor;
        outerDiv.style.borderRadius = "0"; // Always diamond shape (no rounded corners)
        outerDiv.style.boxShadow = isSelected
          ? `0 0 20px ${iconShadowColor}, 0 0 30px ${iconShadowColor}80`
          : `0 0 12px ${iconShadowColor}`;
        outerDiv.style.display = "flex";
        outerDiv.style.alignItems = "center";
        outerDiv.style.justifyContent = "center";
        outerDiv.style.transition = "all 0.3s ease"; // Transition all properties for smooth color change
        outerDiv.style.zIndex = "1000"; // Ensure icons appear above map layers
        outerDiv.style.overflow = "visible"; // Ensure icon content is visible

        // Create inner div for icon - use iconType from icon data
        const innerDiv = document.createElement("div");
        innerDiv.style.transform = "rotate(-45deg)";
        innerDiv.style.color = "#1e293b"; // Dark color for good contrast against beige background
        innerDiv.style.display = "flex";
        innerDiv.style.alignItems = "center";
        innerDiv.style.justifyContent = "center";
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.zIndex = "10"; // Ensure icon is above background
        innerDiv.style.backgroundColor = "transparent"; // No background - transparent
        // Make SVG icons more visible
        innerDiv.style.filter = "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))";

        // Always determine icon type from timeline point's eventType (most reliable source)
        // This ensures icons update correctly when event type changes
        let iconType = "map-pin"; // Default fallback
        
        if (icon.timelinePointId && activeEvent?.timelinePoints) {
          // Find the timeline point linked to this icon
          const linkedPoint = activeEvent.timelinePoints.find(
            (p: any) => p.id === icon.timelinePointId ||
              p.id?.replace(/-index-\d+$/, '') === icon.timelinePointId?.replace(/-index-\d+$/, '')
          );

          if (linkedPoint?.eventType) {
            // Map event type to icon type (must match TimelineBuilder mapping)
            const eventTypeToIconType: Record<string, string> = {
              military: "tank",
              diplomatic: "flag",
              economic: "finance",  // Match TimelineBuilder - economic uses finance icon
              ideological: "users",
              technological: "zap",
              mixed: "globe",
            };
            iconType = eventTypeToIconType[linkedPoint.eventType] || icon.iconType || "map-pin";
            console.log(`🎯 Using iconType "${iconType}" from timeline point eventType "${linkedPoint.eventType}" for icon ${icon.id}`);
          } else {
            // Fallback to icon's stored iconType if timeline point has no eventType
            iconType = icon.iconType || "map-pin";
            console.warn(`⚠️ Icon ${icon.id} (${icon.country}) - timeline point has no eventType, using stored iconType: ${iconType}`);
          }
        } else {
          // Fallback to icon's stored iconType if no timeline point link
          iconType = icon.iconType || "map-pin";
          console.warn(`⚠️ Icon ${icon.id} (${icon.country}) has no timeline point link, using stored iconType: ${iconType}`);
        }

        console.log(`🎨 Rendering icon ${icon.id} (${icon.country}) with type: ${iconType}`);
        const iconSVG = getIconSVG(iconType);
        if (!iconSVG) {
          console.error(`❌ No SVG found for icon type: ${iconType}, using map-pin`);
          innerDiv.innerHTML = getIconSVG("map-pin");
        } else {
          console.log(`✅ Icon SVG for ${iconType} loaded successfully`);
          // Wrap SVG in a container to ensure proper styling
          innerDiv.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${iconSVG}</div>`;
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
          
          // Make fill-based icons larger for better visibility, especially flag icon
          if (isFlagIcon) {
            svg.style.width = '40px'; // Extra large for flag icon to match original size
            svg.style.height = '40px';
          } else if (isFillBased) {
            svg.style.width = '30px'; // Even larger for fill-based icons
            svg.style.height = '30px';
          } else {
            svg.style.width = '26px'; // Standard size for stroke-based icons
            svg.style.height = '26px';
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
              // Force dark fill for all paths in other fill-based icons
              element.setAttribute('fill', '#0f172a'); // Very dark for good contrast
              // Add a light stroke outline to make fill-based icons stand out more
              element.setAttribute('stroke', '#ffe4be'); // Light beige stroke for contrast
              element.setAttribute('stroke-width', '1.2'); // Thicker stroke for better visibility
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

        outerDiv.appendChild(innerDiv);
        el.appendChild(outerDiv);

        // Add hover effect - modify only the outer div's transform
        el.addEventListener("mouseenter", () => {
          outerDiv.style.transform = "rotate(45deg) scale(1.15)";
        });
        el.addEventListener("mouseleave", () => {
          outerDiv.style.transform = "rotate(45deg) scale(1)";
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

        // The outerDiv is the first direct child div of the marker element
        const outerDiv = markerElement.firstElementChild as HTMLElement;
        if (!outerDiv) {
          console.warn(`⚠️ Outer div not found for icon ${iconId}`);
          return;
        }

        const isSelected = iconId === selectedIconId;
        // Always use gold/beige colors regardless of theory selection
        let iconColor = "rgba(255, 228, 190, 0.9)";
        let iconBgColor = "#ffe4be";
        let iconShadowColor = "rgba(255, 228, 190, 0.6)";

        // Update outer diamond - always gold/beige
        outerDiv.style.border = `3px solid ${iconColor}`;
        outerDiv.style.backgroundColor = iconBgColor;
        outerDiv.style.borderRadius = "0"; // Always diamond shape
        outerDiv.style.boxShadow = isSelected
          ? `0 0 20px ${iconShadowColor}, 0 0 30px ${iconShadowColor}80`
          : `0 0 12px ${iconShadowColor}`;
        outerDiv.style.overflow = "visible"; // Ensure icon content is visible

        // Remove inner diamond if it exists (no theory color effects)
        const innerDiamond = outerDiv.querySelector('.inner-diamond');
        if (innerDiamond) {
          innerDiamond.remove();
        }

        // Update inner icon color - always dark for visibility against beige background
        const innerIcon = outerDiv.querySelector('div:not(.inner-diamond)') as HTMLElement;
        if (innerIcon) {
          innerIcon.style.color = "#1e293b"; // Dark color for good contrast
          innerIcon.style.filter = "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))"; // Make icon more visible
          innerIcon.style.zIndex = "10"; // Ensure icon is above background
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
    "finance": `<svg width="22" height="22" viewBox="0 0 185 185" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M112.96,77.43s-.07.99-.17,2.16c-.11,1.18-.29,2.95-.38,3.94-.2,2.12-.21,2.15-.35,2.15-.07,0-.39-.23-.73-.5-1.49-1.2-1.75-1.3-2.15-.97-.1.09-.57.67-1.04,1.29-.41.54-.82,1.09-1.23,1.64-.28.37-.54.74-.82,1.11-.71.99-.89,1.22-1.94,2.61-1.27,1.68-1.79,2.39-1.94,2.67-.07.11-.25.36-.42.55-.37.39-.81.97-1.14,1.5-.13.21-.35.5-.49.66-.13.14-.57.71-.97,1.28-1.57,2.16-2.46,2.92-3.91,3.33-.69.2-2,.21-2.64.04-1.29-.35-2.05-.94-4.25-3.35-.55-.6-1.27-1.35-1.57-1.67-.3-.31-.78-.82-1.07-1.12-.5-.56-1.39-1.29-1.69-1.41-.5-.19-1.28-.12-1.86.16-.67.32-1.11.86-3.42,4.08-.52.72-1.25,1.72-1.61,2.21-.36.5-.89,1.24-1.18,1.65-.29.41-.69.97-.91,1.25-.21.28-.72.97-1.12,1.55-.62.88-.78,1.07-1.02,1.18-.46.22-.88.16-1.24-.18-.44-.41-.5-.9-.18-1.34.1-.14.46-.64.77-1.08.31-.45.84-1.17,1.17-1.6.32-.44.75-1.02.94-1.3s.46-.66.59-.82.38-.5.56-.75c.17-.25.59-.82.91-1.28.32-.45.82-1.12,1.08-1.49.27-.38.65-.89.85-1.14.2-.26.58-.75.84-1.12.57-.81,1.46-1.56,2.26-1.91.31-.14,1.39-.32,1.9-.32.57,0,1.47.19,1.88.39.5.25,1.78,1.34,2.3,1.98.23.28.6.67.84.88.23.2.54.53.71.73.32.41.44.53,1.82,1.98,1.58,1.67,1.99,1.91,3.11,1.87.9-.04,1.2-.2,2.07-1.09.65-.66,1.04-1.15,2.98-3.81,1.05-1.43,1.68-2.27,2.01-2.7.17-.22.9-1.19,1.64-2.16.72-.97,1.63-2.17,2.01-2.67.38-.5.84-1.13,1.01-1.4.18-.27.5-.71.72-.98.75-.92.87-1.15.74-1.57-.08-.3-.27-.49-1.28-1.24-.43-.32-.78-.62-.78-.67,0-.09,1.06-.56,2.51-1.12.59-.23,1.72-.67,2.51-.99.79-.31,1.64-.63,1.87-.71.24-.08.51-.19.62-.25s.2-.09.23-.08v-.03ZM121.74,86.34c-.47-2.1-.66-2.79-1.24-4.31-1.61-4.26-4.24-8.17-7.64-11.36-2.31-2.16-5.58-4.28-8.43-5.47-2.23-.93-3.91-1.47-5.91-1.87-1.8-.36-2.56-.48-3.79-.56-1.08-.08-3.26-.08-4.42,0-3.69.26-8.03,1.47-11.36,3.17-2.81,1.44-5.31,3.26-7.57,5.5-1.49,1.47-2.21,2.33-3.54,4.22-.78,1.11-2.01,3.26-2.62,4.63-1.3,2.89-2.12,5.91-2.51,9.35-.11.96-.11,4.58,0,5.65.36,3.46,1.4,7.07,2.93,10.12,1.64,3.27,3.35,5.62,5.98,8.2,2.49,2.44,4.62,3.97,7.61,5.47,4.25,2.13,8.72,3.24,13.16,3.24,4.81,0,9.24-1.09,13.74-3.36,3.82-1.94,7.36-4.91,10.11-8.49,2.56-3.34,4.26-6.82,5.24-10.74,1.17-4.66,1.25-8.86.27-13.38ZM114.15,80.36c-.06.43-.2,1.84-.32,3.12-.13,1.29-.26,2.46-.3,2.62-.1.37-.54.79-.99.92-.62.19-1.15,0-2.18-.77-.31-.24-.62-.44-.66-.44s-.62.74-1.27,1.65c-.67.9-2.67,3.58-4.45,5.96-1.77,2.37-3.38,4.52-3.56,4.77-.74,1.03-1.88,2.37-2.28,2.7-.85.7-1.65,1.09-2.91,1.42-.56.14-.71.16-1.57.13-.84-.03-1.02-.05-1.54-.23-1.3-.44-2.01-.9-3.09-2.02-.72-.75-.78-.8-3.07-3.26-1.85-1.97-2.13-2.23-2.43-2.28s-.71.07-.97.28c-.36.3-1.78,2.23-6.15,8.35-.97,1.36-1.92,2.65-2.12,2.85-.43.45-.84.69-1.41.78-1.07.2-2.21-.35-2.7-1.29-.25-.47-.3-.66-.29-1.2,0-.79.03-.82,2.56-4.26,1.42-1.92,3.05-4.17,4.04-5.55,2.37-3.3,3.08-4.02,4.52-4.55.87-.31,1.37-.4,2.34-.4s1.52.1,2.41.5c1.04.45,1.29.69,4.03,3.57.87.91,1.9,2.03,2.31,2.47.99,1.09,1.18,1.21,1.79,1.24.34.02.53,0,.67-.08.29-.14.89-.85,1.83-2.1.99-1.32,1.97-2.64,2.96-3.95,1.91-2.55,3.01-4.03,4.02-5.39.59-.79,1.17-1.58,1.75-2.38.28-.37.5-.69.5-.73,0-.03-.32-.3-.71-.58-1.09-.81-1.29-1.09-1.24-1.83.05-.75.39-1.05,1.91-1.64.47-.18,1.55-.61,2.42-.94.87-.34,1.63-.64,1.7-.68.07-.03.5-.2.94-.38.45-.18,1.09-.45,1.44-.59.56-.24.66-.27,1.06-.24.3.02.5.07.67.17.25.16.5.59.58.97.05.23-.09,1.98-.26,3.31l.04-.02ZM92.51,24.59L24.59,92.5l67.92,67.92,67.91-67.92L92.51,24.59ZM119.61,108.12c-1.68,2.79-3.82,5.37-6.23,7.52-1.66,1.48-2.8,2.34-4.58,3.47-1.28.81-2.22,1.3-3.59,1.91-3.4,1.49-6.63,2.34-10.22,2.67-1.18.1-4.15.1-5.06,0-4.34-.51-7.43-1.4-11.04-3.14-5.5-2.66-10.54-7.35-13.62-12.71-.83-1.44-1.91-3.82-2.44-5.35-.86-2.5-1.29-4.55-1.62-7.61-.11-1.11-.1-4.13.04-5.29.34-3.02.84-5.16,1.76-7.7,1.68-4.65,4.61-9.1,8.01-12.17,3.28-2.96,6.15-4.78,9.9-6.26,3.28-1.3,6.35-1.98,9.9-2.2,1.18-.08,3.68-.02,4.79.1,6.43.69,12.16,3.11,17.09,7.22,1.69,1.4,4.05,3.93,5.19,5.51.75,1.06,1.65,2.47,2.05,3.2,2.07,3.83,3.29,7.66,3.78,11.79.34,2.92.19,6.35-.42,9.34-.69,3.44-2.05,7.02-3.66,9.7h-.02ZM92.5,4.04l88.46,88.46-88.46,88.46L4.04,92.5,92.5,4.04M92.5,0L0,92.5l92.5,92.5,92.5-92.5L92.5,0Z" />
</svg>`,
    "tank": `<svg width="22" height="22" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,
    // Default map pin icon
    "map-pin": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',

    // Military - Exact icon from 2.svg (mapped to "shield" icon type)
    "shield": `<svg width="18" height="18" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,
    "military": `<svg width="18" height="18" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,

    // Diplomatic - Flag icon (represents diplomacy, international relations, and treaties)
    "flag": `<svg width="22" height="22" viewBox="0 0 1500 1499.999933" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><path fill="currentColor" fill-rule="nonzero" d="M 613.296875 673.191406 C 610.605469 679.0625 607.121094 686.34375 605.589844 689.585938 C 604.0625 692.707031 601.675781 697.90625 600.328125 700.964844 C 597.269531 707.941406 595.558594 710.144531 592.679688 711.671875 C 589.132812 713.445312 587.664062 713.261719 579.710938 709.714844 C 567.476562 704.269531 560.6875 700.722656 558.910156 699.007812 C 556.894531 696.867188 555.667969 693.5625 556.097656 690.871094 C 556.28125 689.832031 557.382812 686.957031 558.542969 684.449219 C 561.417969 678.515625 567.171875 666.402344 570.839844 658.507812 C 573.105469 653.675781 575.429688 648.902344 577.632812 644.191406 C 582.527344 633.855469 587.910156 622.535156 589.867188 618.375 C 590.722656 616.601562 593.539062 610.484375 596.230469 604.792969 C 598.921875 599.105469 602.347656 591.640625 603.9375 588.277344 C 609.261719 576.285156 610.667969 574.449219 614.949219 572.980469 C 616.664062 572.492188 619.785156 572.921875 622.351562 574.082031 C 623.699219 574.695312 626.941406 576.226562 629.570312 577.449219 C 632.203125 578.734375 636.789062 580.933594 639.726562 582.28125 C 642.726562 583.75 645.722656 585.339844 646.457031 586.011719 C 648.046875 587.359375 649.578125 589.929688 649.945312 591.886719 C 650.433594 595.007812 650.003906 596.109375 633.792969 629.878906 C 632.628906 632.324219 630.734375 636.421875 629.570312 638.871094 C 628.410156 641.441406 625.410156 647.800781 622.84375 653.0625 C 620.273438 658.386719 616.050781 667.378906 613.238281 673.253906 Z M 613.296875 673.191406 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 663.160156 746.296875 C 660.773438 749.664062 652.023438 758.535156 650.1875 759.511719 C 641.5625 764.101562 632.691406 759.511719 632.203125 750.089844 C 632.019531 745.75 633.242188 743.363281 638.382812 737.613281 C 644.316406 731.066406 647.128906 728.863281 650.496094 727.761719 C 652.207031 727.273438 655.082031 727.394531 657.039062 728.007812 C 659.242188 728.742188 662.117188 731.308594 663.464844 733.511719 C 665.667969 737.304688 665.605469 742.933594 663.097656 746.238281 Z M 663.160156 746.296875 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 699.3125 754.191406 C 698.152344 755.902344 682 773.09375 678.699219 776.335938 C 675.820312 779.152344 673.4375 780.128906 669.765625 780.128906 C 664.933594 780.128906 661.015625 777.867188 658.875 773.707031 C 656.734375 769.484375 657.285156 765.140625 660.40625 760.738281 C 662.117188 758.351562 682.0625 737.976562 683.714844 736.878906 C 684.324219 736.449219 685.609375 735.960938 686.527344 735.59375 C 688.914062 734.859375 692.402344 735.164062 695.03125 736.449219 C 701.578125 739.570312 703.597656 748.316406 699.253906 754.191406 Z M 699.3125 754.191406 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 728.25 769.117188 C 727.148438 771.382812 723.050781 775.910156 710.691406 788.390625 C 703.167969 796.097656 702.066406 796.710938 697.296875 796.464844 C 692.09375 796.097656 688.300781 793.40625 686.527344 788.757812 C 685.425781 785.757812 685.609375 782.394531 686.894531 779.824219 C 687.8125 777.925781 693.625 771.566406 703.839844 761.042969 C 710.203125 754.496094 711.242188 753.761719 714.300781 752.722656 C 716.261719 752.050781 720.480469 752.292969 722.621094 753.152344 C 728.375 755.597656 731.1875 763.246094 728.3125 769.117188 Z M 728.25 769.117188 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 748.5625 788.328125 C 748.5625 792.550781 747.523438 794.445312 741.28125 801.417969 C 733.820312 809.738281 730.757812 811.574219 725.683594 811.269531 C 722.621094 811.023438 719.929688 809.921875 717.851562 807.90625 C 715.710938 805.886719 714.851562 803.746094 714.851562 800.625 C 714.851562 795.730469 715.894531 794.078125 724.457031 785.328125 C 730.636719 778.96875 732.535156 777.5 735.410156 777.011719 C 742.445312 775.726562 748.5 780.988281 748.5625 788.390625 Z M 748.5625 788.328125 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 857.152344 747.828125 C 857.152344 751.375 857.089844 752.234375 856.234375 753.945312 C 855.195312 755.964844 854.890625 756.210938 850.914062 757.921875 C 847.792969 759.207031 843.878906 759.390625 841 758.351562 C 839.902344 757.984375 837.636719 756.394531 835.25 754.433594 C 832.4375 752.234375 829.621094 749.90625 826.871094 747.707031 C 819.710938 742.015625 815.429688 738.46875 811.515625 735.164062 C 809.496094 733.390625 805.394531 730.148438 802.582031 727.882812 C 799.707031 725.621094 795.609375 722.253906 793.589844 720.480469 C 784.167969 712.40625 783.066406 711.734375 780.804688 712.652344 C 779.519531 713.140625 778.417969 714.851562 778.417969 716.136719 C 778.417969 717.667969 780.3125 719.625 786.675781 724.765625 C 791.019531 728.25 795.300781 731.738281 799.585938 735.226562 C 803.070312 737.917969 811.023438 744.464844 817.386719 749.542969 C 823.8125 754.617188 829.683594 759.636719 830.539062 760.554688 C 834.945312 765.753906 834.945312 771.992188 830.480469 776.582031 C 827.480469 779.578125 826.074219 780.253906 821.730469 780.253906 C 818.488281 780.253906 817.9375 780.191406 815.859375 779.089844 C 814.695312 778.417969 809.496094 774.5625 804.601562 770.523438 C 799.585938 766.425781 792.976562 761.105469 789.855469 758.535156 C 784.78125 754.433594 777.5 748.378906 771.503906 743.421875 C 766.609375 739.203125 764.222656 738.40625 762.265625 740.363281 C 761.226562 741.40625 760.980469 743.054688 761.777344 744.707031 C 762.019531 745.320312 763.550781 746.847656 765.082031 748.074219 C 769.242188 751.4375 773.398438 754.863281 777.4375 758.351562 C 782.699219 762.695312 790.589844 769.117188 794.933594 772.605469 C 799.277344 776.09375 803.253906 779.578125 803.867188 780.4375 C 806.253906 783.921875 806.558594 787.65625 804.90625 791.570312 C 803.195312 795.363281 799.828125 797.6875 795.242188 797.992188 C 790.164062 798.359375 788.082031 797.320312 777.988281 788.941406 C 774.441406 786.125 771.136719 783.679688 770.585938 783.496094 C 769.117188 783.128906 767.34375 783.984375 766.671875 785.390625 C 765.386719 787.777344 766.179688 789.0625 771.441406 793.464844 C 776.460938 797.566406 777.316406 798.972656 777.621094 803.132812 C 777.804688 806.804688 776.765625 809.433594 774.074219 811.882812 C 770.339844 815.183594 765.082031 815.980469 760.738281 813.777344 C 758.472656 812.675781 750.703125 807.355469 749.175781 805.824219 C 748.5625 805.152344 748.683594 805.089844 750.519531 802.828125 C 757.066406 795.117188 758.351562 786.371094 754.007812 778.90625 C 751.191406 774.257812 744.585938 769.914062 739.386719 769.484375 L 736.9375 769.300781 L 737.183594 766.058594 C 737.855469 756.394531 731.859375 747.582031 722.746094 745.199219 C 719.6875 744.339844 714.484375 744.464844 712.039062 745.382812 C 710.9375 745.871094 709.835938 746.113281 709.652344 745.992188 C 709.46875 745.929688 709.285156 745.320312 709.285156 744.648438 C 709.285156 741.40625 705.800781 734.734375 702.863281 732.167969 C 700.660156 730.207031 696.5625 728.375 693.378906 727.824219 C 691.117188 727.394531 690.015625 727.394531 687.015625 728.007812 C 682.183594 728.863281 678.941406 730.390625 675.761719 733.453125 C 674.292969 734.796875 673.070312 735.898438 672.886719 735.898438 C 672.824219 735.898438 672.640625 735.226562 672.457031 734.367188 C 671.417969 729.292969 665.238281 722.746094 659.363281 720.789062 C 651.960938 718.21875 644.742188 720.113281 638.808594 726.109375 L 635.933594 728.984375 L 622.351562 715.769531 C 611.890625 705.675781 608.769531 702.371094 608.953125 701.699219 C 609.015625 701.273438 615.929688 686.40625 624.308594 668.601562 C 632.691406 650.800781 640.949219 633.242188 642.664062 629.511719 C 644.375 625.777344 646.824219 620.578125 648.109375 618.070312 C 649.394531 615.441406 650.496094 613.296875 650.679688 613.296875 C 650.863281 613.296875 652.574219 614.15625 654.472656 615.195312 C 663.21875 619.84375 669.582031 621.496094 679.246094 621.496094 C 685.671875 621.496094 686.894531 621.433594 706.167969 619.355469 C 712.160156 618.683594 718.523438 618.070312 720.175781 618.007812 C 723.847656 617.765625 724.089844 617.519531 715.28125 622.84375 C 704.820312 629.203125 704.269531 629.878906 692.953125 649.515625 C 678.453125 674.660156 678.269531 675.027344 679.0625 678.023438 C 680.105469 681.574219 684.082031 684.324219 691.117188 686.101562 C 697.664062 687.8125 706.898438 686.589844 713.507812 683.222656 C 719.011719 680.410156 725.316406 675.394531 732.105469 668.234375 C 734.917969 665.238281 737.613281 662.730469 738.101562 662.484375 C 738.589844 662.300781 743.179688 661.628906 748.195312 660.957031 C 756.332031 659.914062 757.554688 659.855469 758.289062 660.28125 C 758.71875 660.648438 761.59375 662.914062 764.589844 665.484375 C 767.589844 667.929688 773.644531 672.945312 778.109375 676.617188 C 782.636719 680.164062 788.449219 685 791.082031 687.199219 C 793.710938 689.402344 798.972656 693.625 802.703125 696.683594 C 818.671875 709.777344 834.578125 722.804688 850.484375 735.777344 C 856.785156 740.855469 857.335938 742.078125 857.335938 748.011719 Z M 857.152344 747.828125 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 879.484375 695.152344 L 882.726562 702.128906 L 877.953125 706.65625 C 875.324219 709.226562 868.960938 715.21875 863.882812 720.054688 L 854.644531 728.800781 L 853.113281 727.761719 C 851.769531 726.84375 828.09375 707.511719 809.679688 692.402344 C 805.761719 689.160156 799.769531 684.140625 796.34375 681.390625 C 792.976562 678.699219 786.921875 673.679688 782.945312 670.4375 C 765.8125 656.246094 762.816406 653.980469 760.554688 652.878906 L 758.105469 651.59375 L 750.398438 652.695312 C 739.140625 654.164062 735.714844 654.839844 733.695312 655.9375 C 732.59375 656.550781 729.476562 659.488281 725.558594 663.464844 C 722.070312 667.132812 718.277344 670.867188 716.996094 671.785156 C 709.042969 677.902344 700.046875 680.164062 691.789062 678.085938 C 686.285156 676.738281 686.34375 676.984375 690.871094 669.09375 C 693.503906 664.257812 696.195312 659.488281 698.824219 654.65625 C 705.554688 642.601562 708.917969 637.28125 711.121094 635.140625 C 713.324219 632.9375 719.503906 629.019531 735.898438 619.355469 C 738.773438 617.640625 742.75 615.195312 744.890625 613.910156 C 749.113281 611.28125 752.355469 609.933594 755.84375 609.078125 C 758.902344 608.402344 767.464844 608.648438 771.625 609.503906 C 774.867188 610.238281 793.957031 613.726562 799.769531 614.707031 C 801.726562 615.074219 806.3125 615.867188 809.863281 616.601562 C 821.546875 618.742188 828.09375 618.070312 838.003906 613.605469 C 839.289062 612.992188 840.390625 612.5625 840.449219 612.5625 C 840.632812 612.5625 847.058594 626.207031 858.804688 651.230469 C 862.71875 659.488281 866.511719 667.625 870.429688 675.820312 C 873.671875 682.613281 877.707031 691.238281 879.484375 695.152344 Z M 879.484375 695.152344 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 931.117188 681.207031 C 934.847656 688.914062 934.910156 689.28125 935.03125 692.09375 C 935.03125 695.398438 934.175781 697.417969 931.789062 699.558594 C 928.914062 702.007812 906.769531 712.222656 903.34375 712.527344 C 901.566406 712.773438 900.957031 712.589844 898.691406 711.488281 C 895.390625 709.898438 894.105469 708.183594 891.230469 701.882812 C 890.128906 699.3125 887.3125 693.378906 885.109375 688.730469 C 882.847656 683.957031 879.847656 677.597656 878.382812 674.476562 C 876.914062 671.417969 873.179688 663.464844 870 656.734375 C 866.878906 650.003906 862.476562 640.707031 860.273438 635.933594 C 857.457031 630 854.582031 623.941406 851.769531 618.007812 C 843.144531 599.839844 841.675781 596.472656 841.492188 593.660156 C 841.0625 588.582031 843.386719 585.828125 850.484375 582.648438 C 852.871094 581.546875 857.765625 579.160156 861.496094 577.324219 C 865.226562 575.550781 869.203125 573.65625 870.304688 573.226562 C 872.996094 572.308594 875.140625 572.308594 877.402344 573.472656 C 880.890625 575.0625 881.746094 576.285156 886.578125 586.871094 C 888.476562 590.96875 892.757812 600.390625 896.367188 607.855469 C 899.855469 615.316406 904.015625 624.066406 905.542969 627.371094 C 907.320312 631.039062 909.03125 634.773438 910.746094 638.382812 C 919.921875 657.46875 921.632812 661.140625 921.632812 661.261719 C 921.632812 661.382812 925.976562 670.4375 931.117188 681.144531 Z M 931.117188 681.207031 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 749.296875 309.488281 L 308.757812 749.96875 L 749.296875 1190.507812 L 1189.777344 749.96875 Z M 924.265625 769.972656 C 922.980469 783.984375 920.042969 797.992188 915.515625 811.148438 C 912.394531 820.386719 910.5 824.910156 905.910156 834.332031 C 896.671875 852.992188 883.335938 871.101562 867.980469 885.90625 C 858.375 895.082031 842.53125 906.769531 831.949219 912.640625 C 808.640625 925.550781 785.878906 932.585938 760.308594 934.785156 C 752.84375 935.398438 735.898438 935.398438 730.027344 934.785156 C 712.710938 932.828125 700.78125 930.199219 686.773438 925.121094 C 677.964844 922 674.476562 920.53125 666.339844 916.3125 C 657.835938 911.96875 653.796875 909.582031 646.761719 904.871094 C 641.867188 901.566406 639.484375 899.671875 631.835938 893.675781 C 628.164062 890.679688 619.601562 882.542969 615.683594 878.257812 C 602.164062 863.332031 592.925781 849.6875 584.605469 832.804688 C 578.425781 820.019531 575.183594 811.332031 571.699219 797.992188 C 568.394531 785.636719 567.046875 776.214844 566.253906 760.554688 C 565.761719 750.640625 565.886719 749.359375 567.78125 747.890625 C 570.167969 745.929688 572.617188 747.644531 573.410156 751.683594 C 573.65625 752.96875 573.898438 757.1875 574.082031 761.042969 C 575 788.878906 583.320312 816.53125 598.617188 842.226562 C 605.835938 854.460938 613.726562 864.984375 623.027344 874.648438 L 626.511719 878.199219 L 630 876.484375 C 640.277344 871.710938 649.578125 868.101562 663.402344 863.332031 C 665.667969 862.597656 665.667969 863.148438 663.160156 855.867188 C 659.058594 844 656 831.949219 653.554688 817.449219 C 651.414062 805.152344 651.105469 801.726562 651.839844 800.195312 C 653.125 797.75 657.039062 797.625 658.265625 800.136719 C 658.507812 800.746094 659.121094 803.253906 659.425781 805.761719 C 661.566406 821.058594 664.625 835.617188 667.378906 844.550781 C 668.847656 848.894531 672.703125 859.660156 673.070312 860.089844 C 673.070312 860.148438 674.355469 859.90625 675.699219 859.601562 C 679.859375 858.5 689.097656 856.539062 693.929688 855.683594 C 696.988281 855.195312 700.046875 854.644531 703.105469 854.15625 C 711.917969 852.625 730.453125 850.914062 737.980469 850.914062 L 741.464844 850.914062 L 741.464844 841.492188 C 741.464844 831.152344 741.648438 830.296875 743.851562 829.378906 C 745.566406 828.644531 747.765625 829.132812 748.625 830.480469 C 749.234375 831.335938 749.296875 832.863281 749.480469 841.0625 L 749.726562 850.667969 L 753.703125 850.667969 C 773.21875 851.402344 796.21875 854.582031 813.105469 858.988281 C 815.734375 859.660156 817.875 860.089844 817.9375 860.027344 C 818 859.964844 818.976562 857.640625 820.078125 854.949219 C 824.730469 843.144531 829.253906 824.421875 831.089844 808.761719 C 831.457031 805.945312 831.824219 802.828125 831.949219 801.910156 C 832.4375 798.542969 835.617188 797.136719 838.125 799.277344 C 839.226562 800.320312 839.289062 800.441406 839.289062 803.4375 C 839.289062 807.171875 836.230469 825.953125 834.273438 834.089844 C 832.683594 840.941406 829.929688 850.238281 827.480469 857.398438 C 826.5625 860.089844 825.769531 862.414062 825.769531 862.660156 C 825.828125 862.71875 827.054688 863.148438 828.460938 863.578125 C 839.226562 867.125 850.667969 871.652344 858.253906 875.261719 C 861.375 876.789062 864.128906 878.074219 864.371094 878.074219 C 864.859375 878.074219 872.753906 869.570312 877.464844 863.882812 C 894.410156 843.449219 907.011719 817.816406 912.945312 791.570312 C 915.761719 778.84375 916.617188 772.726562 917.167969 760.613281 C 917.351562 755.414062 917.78125 750.703125 918.023438 750.03125 C 918.453125 748.5 920.042969 747.03125 921.328125 747.03125 C 922.367188 747.03125 923.898438 748.378906 924.386719 749.726562 C 924.875 751.191406 924.816406 762.816406 924.140625 769.972656 Z M 937.417969 704.757812 C 934.789062 707.207031 933.6875 707.816406 920.347656 714.121094 C 907.257812 720.296875 904.808594 721.09375 900.34375 720.421875 C 895.023438 719.5625 889.453125 715.894531 887.253906 711.792969 C 886.761719 710.875 886.210938 710.082031 885.90625 710.082031 C 885.660156 710.144531 881.992188 713.386719 877.832031 717.363281 C 873.671875 721.339844 867.980469 726.722656 865.167969 729.230469 L 860.152344 734 L 861.742188 736.203125 C 863.882812 739.261719 864.859375 742.75 864.859375 747.09375 C 864.859375 752.539062 862.597656 757.984375 858.867188 761.347656 C 855.5 764.40625 847.914062 767.039062 843.753906 766.546875 L 841.367188 766.304688 L 841.367188 769.179688 C 841.308594 775.910156 836.839844 783.066406 830.785156 786.125 C 826.871094 788.144531 819.894531 788.816406 816.042969 787.65625 C 814.941406 787.289062 814.023438 787.164062 813.898438 787.226562 C 813.777344 787.289062 813.472656 788.511719 813.226562 789.917969 C 812.066406 795.609375 807.964844 801.296875 803.5 803.5625 C 799.15625 805.761719 793.222656 806.375 788.207031 805.027344 L 785.511719 804.355469 L 785.085938 806.558594 C 782.453125 819.652344 768.199219 826.746094 756.761719 820.75 C 755.230469 820.019531 751.742188 817.632812 748.867188 815.492188 C 746.054688 813.289062 743.546875 811.390625 743.363281 811.332031 C 743.117188 811.148438 742.015625 811.941406 740.792969 813.042969 C 733.757812 819.652344 724.398438 820.996094 716.503906 816.53125 C 711.976562 813.960938 708.796875 809.800781 707.511719 805.089844 C 706.839844 802.214844 706.898438 802.214844 703.597656 803.5 C 699.253906 805.027344 692.339844 804.355469 687.875 801.96875 C 683.347656 799.585938 678.882812 793.40625 678.207031 788.816406 C 678.023438 787.777344 677.839844 786.796875 677.78125 786.613281 C 677.71875 786.554688 676.617188 786.675781 675.394531 787.105469 C 669.277344 789.304688 659.425781 786.738281 655.144531 781.902344 C 652.695312 779.089844 650.554688 774.683594 650.066406 771.199219 C 649.636719 768.566406 649.578125 768.382812 648.78125 768.628906 C 645.539062 769.914062 640.828125 769.363281 635.566406 767.464844 C 632.570312 766.363281 627.613281 761.59375 626.144531 758.535156 C 622.78125 751.070312 623.882812 742.503906 629.019531 736.878906 C 629.753906 736.019531 630.488281 735.101562 630.488281 734.859375 C 630.304688 734.367188 605.285156 710.019531 605.039062 710.019531 C 604.976562 710.019531 604.367188 710.753906 603.878906 711.792969 C 602.53125 714.363281 599.105469 717.421875 596.046875 718.828125 C 590.847656 721.277344 586.195312 721.277344 580.445312 718.828125 C 574.449219 716.382812 556.402344 707.144531 554.628906 705.738281 C 550.101562 702.007812 548.082031 697.234375 548.328125 691.300781 C 548.511719 687.507812 549.246094 685.671875 555.792969 672.027344 C 561.480469 660.160156 565.945312 650.554688 567.046875 648.292969 C 568.332031 645.476562 599.105469 580.019531 601.308594 575.246094 C 604 569.617188 608.769531 565.886719 614.277344 565.089844 C 619.785156 564.355469 621.496094 564.90625 639.238281 573.59375 C 651.105469 579.34375 653.125 580.691406 655.207031 584.363281 C 658.203125 589.621094 658.449219 595.128906 655.878906 601.246094 C 655.023438 603.203125 654.347656 605.160156 654.164062 605.46875 C 653.980469 605.957031 654.898438 606.628906 658.082031 608.28125 C 660.34375 609.566406 663.523438 610.972656 665.054688 611.523438 C 668.726562 612.808594 674.539062 613.789062 678.636719 613.789062 C 681.757812 613.789062 683.714844 613.605469 704.757812 611.585938 C 713.8125 610.730469 725.558594 609.871094 734.980469 609.199219 C 737.121094 609.136719 738.039062 608.769531 742.628906 606.203125 C 745.441406 604.671875 749.175781 602.898438 750.949219 602.285156 C 754.863281 601.125 760.308594 600.390625 764.285156 600.757812 C 767.648438 601 777.070312 602.53125 782.945312 603.816406 C 787.472656 604.671875 811.820312 609.078125 816.101562 609.6875 C 820.261719 610.363281 823.261719 610.300781 826.625 609.445312 C 830.785156 608.34375 836.71875 605.710938 836.71875 604.917969 C 836.65625 604.550781 835.984375 602.714844 835.128906 600.757812 C 832.558594 594.457031 832.925781 588.949219 836.230469 583.6875 C 838.433594 580.324219 840.207031 579.101562 851.523438 573.59375 C 864.738281 567.171875 868.410156 565.640625 871.652344 565.027344 C 874.894531 564.417969 878.382812 565.027344 881.5625 566.558594 C 886.640625 569.128906 887.679688 570.78125 895.816406 588.214844 L 904.320312 606.386719 C 905.175781 608.160156 907.625 613.359375 909.828125 617.949219 C 911.96875 622.597656 916.433594 632.019531 919.675781 638.933594 C 922.917969 645.90625 926.527344 653.613281 927.75 656.183594 C 937.785156 677.167969 941.824219 685.792969 942.25 687.261719 C 943.105469 689.953125 942.984375 694.910156 942.007812 697.785156 C 940.964844 700.84375 939.804688 702.617188 937.417969 704.882812 Z M 822.648438 869.695312 L 821.976562 871.285156 C 818.734375 879.359375 810.839844 892.941406 803.929688 902.242188 C 800.808594 906.585938 792.550781 914.964844 787.042969 919.554688 C 784.839844 921.511719 782.945312 923.222656 782.945312 923.347656 C 783.433594 923.957031 802.398438 918.148438 808.332031 915.515625 C 819.34375 910.746094 833.171875 903.28125 840.941406 897.957031 C 846.8125 893.796875 858.683594 884.4375 858.683594 883.886719 C 858.683594 883.152344 836.167969 873.855469 828.398438 871.40625 L 822.710938 869.632812 Z M 807.539062 883.03125 C 810.78125 877.339844 815.183594 867.917969 814.757812 867.492188 C 814.574219 867.308594 811.941406 866.574219 808.882812 865.777344 C 794.875 862.292969 772.300781 859.171875 756.636719 858.558594 L 749.601562 858.316406 L 749.601562 886.824219 C 749.601562 921.757812 749.601562 927.199219 749.847656 927.445312 C 750.214844 927.8125 757.003906 926.589844 760.308594 925.671875 C 770.339844 922.796875 781.355469 915.820312 789.980469 906.828125 C 796.710938 899.976562 801.785156 892.941406 807.539062 882.96875 Z M 741.527344 858.375 L 738.894531 858.375 C 737.429688 858.4375 733.453125 858.621094 730.085938 858.804688 C 723.234375 859.234375 708.980469 860.824219 702.25 861.925781 C 691.238281 863.882812 688.363281 864.492188 682.796875 865.839844 C 679.492188 866.695312 676.800781 867.554688 676.679688 867.796875 C 676.496094 868.042969 677.71875 870.855469 679.125 873.976562 C 681.941406 879.972656 686.652344 888.230469 690.992188 894.53125 C 693.871094 898.632812 701.515625 907.257812 705.1875 910.5 C 713.324219 917.78125 723.355469 923.589844 731.25 925.671875 C 735.898438 926.835938 741.160156 927.628906 741.589844 927.199219 C 741.832031 927.015625 741.832031 911.476562 741.773438 892.695312 L 741.527344 858.4375 Z M 704.820312 920.289062 C 693.441406 911.292969 683.101562 898.203125 674.964844 882.96875 C 672.945312 879.238281 670.804688 874.832031 670.070312 873.121094 C 669.214844 871.164062 668.542969 870.0625 668.113281 870.0625 C 667.746094 870.0625 664.75 870.917969 661.324219 872.019531 C 652.269531 874.832031 632.996094 882.96875 632.996094 884.007812 C 632.996094 884.867188 644.558594 893.921875 651.777344 898.875 C 661.261719 905.300781 667.074219 908.542969 678.757812 913.621094 C 687.507812 917.535156 701.515625 922.246094 707.511719 923.40625 C 708.980469 923.652344 708.859375 923.589844 704.882812 920.347656 Z M 704.820312 920.289062 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" fill-rule="nonzero" d="M 749.96875 175.9375 L 1324 749.96875 L 749.96875 1324 L 175.9375 749.96875 L 749.96875 175.9375 M 749.96875 150 L 150 749.96875 L 749.96875 1349.9375 L 1349.9375 749.96875 Z M 749.96875 150 " fill-opacity="1" fill-rule="nonzero"/></svg>`,

    // Economic - Building with dollar sign or coins (represents commerce/economy)
    "building": `<svg width="18" height="18" viewBox="0 0 185 185" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M112.96,77.43s-.07.99-.17,2.16c-.11,1.18-.29,2.95-.38,3.94-.2,2.12-.21,2.15-.35,2.15-.07,0-.39-.23-.73-.5-1.49-1.2-1.75-1.3-2.15-.97-.1.09-.57.67-1.04,1.29-.41.54-.82,1.09-1.23,1.64-.28.37-.54.74-.82,1.11-.71.99-.89,1.22-1.94,2.61-1.27,1.68-1.79,2.39-1.94,2.67-.07.11-.25.36-.42.55-.37.39-.81.97-1.14,1.5-.13.21-.35.5-.49.66-.13.14-.57.71-.97,1.28-1.57,2.16-2.46,2.92-3.91,3.33-.69.2-2,.21-2.64.04-1.29-.35-2.05-.94-4.25-3.35-.55-.6-1.27-1.35-1.57-1.67-.3-.31-.78-.82-1.07-1.12-.5-.56-1.39-1.29-1.69-1.41-.5-.19-1.28-.12-1.86.16-.67.32-1.11.86-3.42,4.08-.52.72-1.25,1.72-1.61,2.21-.36.5-.89,1.24-1.18,1.65-.29.41-.69.97-.91,1.25-.21.28-.72.97-1.12,1.55-.62.88-.78,1.07-1.02,1.18-.46.22-.88.16-1.24-.18-.44-.41-.5-.9-.18-1.34.1-.14.46-.64.77-1.08.31-.45.84-1.17,1.17-1.6.32-.44.75-1.02.94-1.3s.46-.66.59-.82.38-.5.56-.75c.17-.25.59-.82.91-1.28.32-.45.82-1.12,1.08-1.49.27-.38.65-.89.85-1.14.2-.26.58-.75.84-1.12.57-.81,1.46-1.56,2.26-1.91.31-.14,1.39-.32,1.9-.32.57,0,1.47.19,1.88.39.5.25,1.78,1.34,2.3,1.98.23.28.6.67.84.88.23.2.54.53.71.73.32.41.44.53,1.82,1.98,1.58,1.67,1.99,1.91,3.11,1.87.9-.04,1.2-.2,2.07-1.09.65-.66,1.04-1.15,2.98-3.81,1.05-1.43,1.68-2.27,2.01-2.7.17-.22.9-1.19,1.64-2.16.72-.97,1.63-2.17,2.01-2.67.38-.5.84-1.13,1.01-1.4.18-.27.5-.71.72-.98.75-.92.87-1.15.74-1.57-.08-.3-.27-.49-1.28-1.24-.43-.32-.78-.62-.78-.67,0-.09,1.06-.56,2.51-1.12.59-.23,1.72-.67,2.51-.99.79-.31,1.64-.63,1.87-.71.24-.08.51-.19.62-.25s.2-.09.23-.08v-.03ZM121.74,86.34c-.47-2.1-.66-2.79-1.24-4.31-1.61-4.26-4.24-8.17-7.64-11.36-2.31-2.16-5.58-4.28-8.43-5.47-2.23-.93-3.91-1.47-5.91-1.87-1.8-.36-2.56-.48-3.79-.56-1.08-.08-3.26-.08-4.42,0-3.69.26-8.03,1.47-11.36,3.17-2.81,1.44-5.31,3.26-7.57,5.5-1.49,1.47-2.21,2.33-3.54,4.22-.78,1.11-2.01,3.26-2.62,4.63-1.3,2.89-2.12,5.91-2.51,9.35-.11.96-.11,4.58,0,5.65.36,3.46,1.4,7.07,2.93,10.12,1.64,3.27,3.35,5.62,5.98,8.2,2.49,2.44,4.62,3.97,7.61,5.47,4.25,2.13,8.72,3.24,13.16,3.24,4.81,0,9.24-1.09,13.74-3.36,3.82-1.94,7.36-4.91,10.11-8.49,2.56-3.34,4.26-6.82,5.24-10.74,1.17-4.66,1.25-8.86.27-13.38ZM114.15,80.36c-.06.43-.2,1.84-.32,3.12-.13,1.29-.26,2.46-.3,2.62-.1.37-.54.79-.99.92-.62.19-1.15,0-2.18-.77-.31-.24-.62-.44-.66-.44s-.62.74-1.27,1.65c-.67.9-2.67,3.58-4.45,5.96-1.77,2.37-3.38,4.52-3.56,4.77-.74,1.03-1.88,2.37-2.28,2.7-.85.7-1.65,1.09-2.91,1.42-.56.14-.71.16-1.57.13-.84-.03-1.02-.05-1.54-.23-1.3-.44-2.01-.9-3.09-2.02-.72-.75-.78-.8-3.07-3.26-1.85-1.97-2.13-2.23-2.43-2.28s-.71.07-.97.28c-.36.3-1.78,2.23-6.15,8.35-.97,1.36-1.92,2.65-2.12,2.85-.43.45-.84.69-1.41.78-1.07.2-2.21-.35-2.7-1.29-.25-.47-.3-.66-.29-1.2,0-.79.03-.82,2.56-4.26,1.42-1.92,3.05-4.17,4.04-5.55,2.37-3.3,3.08-4.02,4.52-4.55.87-.31,1.37-.4,2.34-.4s1.52.1,2.41.5c1.04.45,1.29.69,4.03,3.57.87.91,1.9,2.03,2.31,2.47.99,1.09,1.18,1.21,1.79,1.24.34.02.53,0,.67-.08.29-.14.89-.85,1.83-2.1.99-1.32,1.97-2.64,2.96-3.95,1.91-2.55,3.01-4.03,4.02-5.39.59-.79,1.17-1.58,1.75-2.38.28-.37.5-.69.5-.73,0-.03-.32-.3-.71-.58-1.09-.81-1.29-1.09-1.24-1.83.05-.75.39-1.05,1.91-1.64.47-.18,1.55-.61,2.42-.94.87-.34,1.63-.64,1.7-.68.07-.03.5-.2.94-.38.45-.18,1.09-.45,1.44-.59.56-.24.66-.27,1.06-.24.3.02.5.07.67.17.25.16.5.59.58.97.05.23-.09,1.98-.26,3.31l.04-.02ZM92.51,24.59L24.59,92.5l67.92,67.92,67.91-67.92L92.51,24.59ZM119.61,108.12c-1.68,2.79-3.82,5.37-6.23,7.52-1.66,1.48-2.8,2.34-4.58,3.47-1.28.81-2.22,1.3-3.59,1.91-3.4,1.49-6.63,2.34-10.22,2.67-1.18.1-4.15.1-5.06,0-4.34-.51-7.43-1.4-11.04-3.14-5.5-2.66-10.54-7.35-13.62-12.71-.83-1.44-1.91-3.82-2.44-5.35-.86-2.5-1.29-4.55-1.62-7.61-.11-1.11-.1-4.13.04-5.29.34-3.02.84-5.16,1.76-7.7,1.68-4.65,4.61-9.1,8.01-12.17,3.28-2.96,6.15-4.78,9.9-6.26,3.28-1.3,6.35-1.98,9.9-2.2,1.18-.08,3.68-.02,4.79.1,6.43.69,12.16,3.11,17.09,7.22,1.69,1.4,4.05,3.93,5.19,5.51.75,1.06,1.65,2.47,2.05,3.2,2.07,3.83,3.29,7.66,3.78,11.79.34,2.92.19,6.35-.42,9.34-.69,3.44-2.05,7.02-3.66,9.7h-.02ZM92.5,4.04l88.46,88.46-88.46,88.46L4.04,92.5,92.5,4.04M92.5,0L0,92.5l92.5,92.5,92.5-92.5L92.5,0Z" />
</svg>`,

    // Ideological - People/users icon (represents social movements, ideologies)
    "users": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',

    // Technological - Lightning bolt/zap (represents technology and innovation)
    "zap": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',

    // Mixed - Globe/world icon (represents global or multi-faceted events)
    "globe": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  };

  const normalizedType = iconType?.toLowerCase();
  return iconMap[normalizedType] || iconMap[iconType] || iconMap["map-pin"];
}
