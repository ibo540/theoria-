"use client";

import { useEffect, useRef, useMemo } from "react";
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
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore((state) => state.activeTimelinePointId);
  const activeTheory = useTheoryStore((state) => state.activeTheory);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);
  
  // Keep callback ref up to date
  useEffect(() => {
    onIconClickRef.current = onIconClick;
  }, [onIconClick]);

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

  useEffect(() => {
    if (!map || !activeEvent) {
      // Remove all markers when map or event is not available
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    const setupIcons = () => {
      if (!map.isStyleLoaded()) {
        map.once("styledata", setupIcons);
        return;
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

      const icons = activeEvent.countryIcons || [];
      
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
        if (icon.timelinePointId && !icon.timelinePointId.startsWith('area-')) {
          // Regular timeline point icon - show only when that point is active
          shouldAppear = activeTimelinePointId === icon.timelinePointId;
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
        
        // Create outer container with fixed positioning
        const outerDiv = document.createElement("div");
        outerDiv.style.width = "40px";
        outerDiv.style.height = "40px";
        outerDiv.style.position = "relative";
        outerDiv.style.transform = "rotate(45deg)";
        outerDiv.style.border = "2px solid rgba(255, 228, 190, 0.6)";
        outerDiv.style.backgroundColor = "#ffe4be";
        outerDiv.style.borderRadius = "4px";
        outerDiv.style.boxShadow = "0 0 12px rgba(255, 228, 190, 0.6)";
        outerDiv.style.display = "flex";
        outerDiv.style.alignItems = "center";
        outerDiv.style.justifyContent = "center";
        outerDiv.style.transition = "transform 0.3s ease"; // Only transform, not all
        
        // Create inner div for icon - use iconType from icon data
        const innerDiv = document.createElement("div");
        innerDiv.style.transform = "rotate(-45deg)";
        innerDiv.style.color = "#1e293b";
        innerDiv.style.display = "flex";
        innerDiv.style.alignItems = "center";
        innerDiv.style.justifyContent = "center";
        // Use the icon type from the icon data, fallback to map-pin
        // If iconType is missing, try to infer from event type if available
        let iconType = icon.iconType || "map-pin";
        
        // If iconType is still missing and we have the icon data, default to map-pin
        if (!iconType || iconType === "") {
          iconType = "map-pin";
          console.warn(`⚠️ Icon ${icon.id} (${icon.country}) has no iconType, defaulting to map-pin`);
        }
        
        console.log(`🎨 Rendering icon ${icon.id} (${icon.country}) with type: ${iconType}`);
        const iconSVG = getIconSVG(iconType);
        if (!iconSVG) {
          console.error(`❌ No SVG found for icon type: ${iconType}, using map-pin`);
          innerDiv.innerHTML = getIconSVG("map-pin");
        } else {
          console.log(`✅ Icon SVG for ${iconType} loaded successfully`);
          innerDiv.innerHTML = iconSVG;
        }
        
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
        const marker = new maplibregl.Marker({ 
          element: el,
          anchor: 'center' // Center the marker on the coordinates
        })
          .setLngLat([lng, lat]) // MapLibre expects [lng, lat]
          .addTo(map);

        markersRef.current.set(icon.id, marker);
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
  }, [map, activeEvent?.id, activeEvent?.countryIcons, activeTimelinePointId, countryIconsKey]);
  
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
function getIconSVG(iconType: string): string {
  const iconMap: Record<string, string> = {
    "map-pin": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    "shield": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    "users": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    "flag": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
    "zap": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    "building": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><line x1="9" y1="6" x2="9" y2="10"></line><line x1="12" y1="6" x2="12" y2="10"></line><line x1="15" y1="6" x2="15" y2="10"></line><line x1="9" y1="14" x2="9" y2="18"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="15" y1="14" x2="15" y2="18"></line></svg>',
    "globe": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  };

  return iconMap[iconType] || iconMap["map-pin"];
}
