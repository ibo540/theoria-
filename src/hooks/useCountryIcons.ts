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
          svg.style.width = '22px'; // Increased from 18px for better visibility
          svg.style.height = '22px'; // Increased from 18px for better visibility
          svg.style.display = 'block';
          svg.style.color = '#0f172a'; // Darker color for better contrast (#0f172a is slate-900)
          
          // Make sure fill and stroke use explicit dark colors for better visibility
          const allPaths = svg.querySelectorAll('path, circle, polygon, line, rect');
          allPaths.forEach(element => {
            const fill = element.getAttribute('fill');
            const stroke = element.getAttribute('stroke');
            
            // For fill-based icons (finance, tank), use dark fill
            if (fill === 'currentColor' || fill === null || fill === 'none') {
              element.setAttribute('fill', '#0f172a'); // Very dark for good contrast
            }
            
            // For stroke-based icons (flag, users, zap, globe), use thicker, darker strokes
            if (stroke === 'currentColor' || (stroke && stroke !== 'none')) {
              element.setAttribute('stroke', '#0f172a'); // Very dark stroke
              const currentStrokeWidth = element.getAttribute('stroke-width');
              const strokeWidth = currentStrokeWidth ? Math.max(2.5, parseFloat(currentStrokeWidth) * 1.5) : 2.5;
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
    "flag": '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',

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
