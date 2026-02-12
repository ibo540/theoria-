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

    const setupIcons = () => {
      const map = mapRef.current;
      if (!map) {
        console.log("⚠️ setupIcons - Map became null");
        return;
      }
      
      console.log("🎬 setupIcons called, map style loaded:", map.isStyleLoaded());
      if (!map.isStyleLoaded()) {
        console.log("⏳ Map style not loaded, waiting...");
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
          // Regular timeline point icon - show only when that point is active
          // Handle duplicate IDs by stripping index suffix if present
          const cleanActiveId = activeTimelinePointId?.replace(/-index-\d+$/, '') || activeTimelinePointId;
          const cleanIconTimelinePointId = icon.timelinePointId?.replace(/-index-\d+$/, '') || icon.timelinePointId;
          
          // Match with both clean and original IDs
          shouldAppear = cleanActiveId === cleanIconTimelinePointId || 
                        activeTimelinePointId === icon.timelinePointId ||
                        cleanActiveId === icon.timelinePointId ||
                        activeTimelinePointId === cleanIconTimelinePointId;
          
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
        
        // Determine color based on theory - red for Realism, theory color for others
        // Default: Always use gold/beige border for unselected icons (matching the drawing)
        let iconColor = "rgba(255, 228, 190, 0.9)"; // More opaque gold/beige border
        let iconBgColor = "#ffe4be"; // Default beige background
        let iconShadowColor = "rgba(255, 228, 190, 0.6)"; // Default beige shadow
        let borderWidth = "3px"; // Thicker border for better visibility
        
        if (isSelected && activeTheory) {
          if (activeTheory === "realism") {
            // Red for Realism
            iconColor = "rgba(249, 70, 76, 0.9)"; // #f9464c with opacity
            iconBgColor = "#f9464c";
            iconShadowColor = "rgba(249, 70, 76, 0.8)";
            borderWidth = "3px";
          } else {
            // Theory color for others
            const theoryColor = getTheoryColor(activeTheory);
            if (theoryColor) {
              // Convert hex to rgba
              const hex = theoryColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              iconColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
              iconBgColor = theoryColor;
              iconShadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
              borderWidth = "3px";
            }
          }
        }
        
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
        
        // Add inner diamond layer when selected
        if (isSelected) {
          outerDiv.style.position = "relative";
          outerDiv.style.overflow = "visible";
        }
        
        // Create inner div for icon - use iconType from icon data
        const innerDiv = document.createElement("div");
        innerDiv.style.transform = "rotate(-45deg)";
        innerDiv.style.color = "#1e293b";
        innerDiv.style.display = "flex";
        innerDiv.style.alignItems = "center";
        innerDiv.style.justifyContent = "center";
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        
        // Get icon type - if missing, try to infer from timeline point's eventType
        let iconType = icon.iconType;
        
        // If iconType is missing or is "map-pin" (default), try to infer from timeline point
        if (!iconType || iconType === "" || iconType === "map-pin") {
          if (icon.timelinePointId && activeEvent?.timelinePoints) {
            // Find the timeline point linked to this icon
            const linkedPoint = activeEvent.timelinePoints.find(
              (p: any) => p.id === icon.timelinePointId || 
                         p.id?.replace(/-index-\d+$/, '') === icon.timelinePointId?.replace(/-index-\d+$/, '')
            );
            
            if (linkedPoint?.eventType) {
              // Map event type to icon type
              const eventTypeToIconType: Record<string, string> = {
                military: "shield",
                diplomatic: "flag",
                economic: "building",
                ideological: "users",
                technological: "zap",
                mixed: "globe",
              };
              iconType = eventTypeToIconType[linkedPoint.eventType] || "map-pin";
              console.log(`🔄 Inferred iconType "${iconType}" from timeline point eventType "${linkedPoint.eventType}" for icon ${icon.id}`);
            } else {
              iconType = "map-pin";
              console.warn(`⚠️ Icon ${icon.id} (${icon.country}) has no iconType and linked timeline point has no eventType, defaulting to map-pin`);
            }
          } else {
            iconType = "map-pin";
            console.warn(`⚠️ Icon ${icon.id} (${icon.country}) has no iconType and no linked timeline point, defaulting to map-pin`);
          }
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
        console.log(`🗺️ Adding marker to map at [lng, lat]: [${lng}, ${lat}] for ${icon.country} (${icon.iconType})`);
        const marker = new maplibregl.Marker({ 
          element: el,
          anchor: 'center' // Center the marker on the coordinates
        })
          .setLngLat([lng, lat]) // MapLibre expects [lng, lat]
          .addTo(map);

        markersRef.current.set(icon.id, marker);
        console.log(`✅ Marker successfully added to map for ${icon.country}. Element visible:`, el.offsetParent !== null || el.offsetWidth > 0);
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
        let iconColor = "rgba(255, 228, 190, 0.6)";
        let iconBgColor = "#ffe4be";
        let iconShadowColor = "rgba(255, 228, 190, 0.6)";
        
        if (isSelected && activeTheory) {
          console.log(`✨ Icon ${iconId} is selected with theory ${activeTheory}`);
          if (activeTheory === "realism") {
            iconColor = "rgba(249, 70, 76, 0.9)";
            iconBgColor = "#f9464c";
            iconShadowColor = "rgba(249, 70, 76, 0.8)";
          } else {
            const theoryColor = getTheoryColor(activeTheory);
            if (theoryColor) {
              const hex = theoryColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              iconColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
              iconBgColor = theoryColor;
              iconShadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
          }
        }
        
        // Update outer diamond
        outerDiv.style.border = isSelected ? `2px solid rgba(0, 0, 0, 0.3)` : `2px solid ${iconColor}`;
        outerDiv.style.backgroundColor = iconBgColor;
        outerDiv.style.borderRadius = isSelected ? "0" : "4px"; // Diamond shape when selected
        outerDiv.style.boxShadow = isSelected 
          ? `0 0 20px ${iconShadowColor}, 0 0 30px ${iconShadowColor}80` 
          : `0 0 12px ${iconShadowColor}`;
        
        // Update or create inner diamond
        if (isSelected && activeTheory) {
          let innerDiamond = outerDiv.querySelector('.inner-diamond') as HTMLElement;
          if (!innerDiamond) {
            innerDiamond = document.createElement("div");
            innerDiamond.className = "inner-diamond";
            innerDiamond.style.position = "absolute";
            innerDiamond.style.width = "60%";
            innerDiamond.style.height = "60%";
            innerDiamond.style.transform = "rotate(45deg)";
            innerDiamond.style.borderRadius = "0";
            innerDiamond.style.zIndex = "1";
            outerDiv.appendChild(innerDiamond);
          }
          
          innerDiamond.style.backgroundColor = activeTheory === "realism" 
            ? "rgba(200, 30, 40, 0.9)" // Darker red for inner diamond
            : (() => {
                const theoryColor = getTheoryColor(activeTheory);
                if (theoryColor) {
                  const hex = theoryColor.replace('#', '');
                  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 30);
                  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 30);
                  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 30);
                  return `rgb(${r}, ${g}, ${b})`;
                }
                return "rgba(200, 30, 40, 0.9)";
              })();
        } else {
          // Remove inner diamond if not selected
          const innerDiamond = outerDiv.querySelector('.inner-diamond');
          if (innerDiamond) {
            innerDiamond.remove();
          }
        }
        
        // Update inner icon color
        const innerDiamondEl = outerDiv.querySelector('.inner-diamond') as HTMLElement;
        const innerIcon = outerDiv.querySelector('div:not(.inner-diamond)') as HTMLElement;
        if (innerIcon && innerIcon !== innerDiamondEl) {
          innerIcon.style.color = isSelected ? "#ffffff" : "#1e293b";
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
    // Default map pin icon
    "map-pin": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    
    // Military - Custom military icon (star/cross design)
    "shield": '<svg width="18" height="18" viewBox="0 0 1500 1499.999933" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><path fill="currentColor" d="M 635.40625 769.433594 C 635.40625 765.289062 636.308594 763.726562 641.414062 758.800781 C 643.996094 756.335938 647.960938 752.671875 650.304688 750.570312 C 652.648438 748.589844 657.875 743.78125 661.960938 739.878906 C 666.046875 735.972656 673.074219 729.304688 677.640625 725.160156 C 691.097656 712.722656 718.609375 687.191406 726.300781 679.984375 C 733.75 672.894531 735.671875 671.453125 738.316406 670.492188 C 740.777344 669.589844 742.941406 669.769531 745.703125 671.089844 C 748.707031 672.59375 750.929688 674.515625 760.722656 683.828125 C 768.050781 690.796875 792.503906 713.625 806.742188 726.78125 C 810.40625 730.085938 813.949219 733.449219 817.554688 736.753906 C 821.097656 740.058594 824.761719 743.421875 828.367188 746.726562 C 839.902344 757.359375 844.46875 761.746094 845.371094 763.1875 C 848.253906 767.453125 847.773438 773.757812 844.226562 777.484375 C 842.003906 779.828125 839.960938 780.667969 836.417969 780.667969 C 832.273438 780.667969 830.171875 779.527344 824.042969 773.578125 C 821.398438 771.117188 817.976562 767.871094 816.472656 766.492188 C 815.089844 765.167969 809.984375 760.484375 805.238281 756.097656 C 793.105469 744.804688 786.976562 739.15625 778.925781 731.765625 C 775.082031 728.28125 767.8125 721.554688 762.707031 716.808594 C 757.71875 712.0625 752.433594 707.257812 751.050781 705.996094 C 749.667969 704.734375 747.328125 702.570312 745.765625 701.1875 C 743.300781 698.847656 742.761719 698.605469 741.257812 698.605469 C 739.457031 698.605469 740.898438 697.285156 719.753906 717.046875 C 714.585938 721.855469 706.777344 729.003906 702.449219 732.96875 C 698.125 736.875 693.921875 740.839844 693.140625 741.621094 C 692.296875 742.460938 689.835938 744.863281 687.492188 746.847656 C 685.269531 748.949219 679.203125 754.476562 674.214844 759.222656 C 654.390625 777.964844 654.03125 778.265625 651.386719 779.585938 C 649.042969 780.726562 648.382812 780.847656 646.101562 780.667969 C 639.792969 780.246094 635.40625 775.621094 635.40625 769.433594 Z M 635.40625 769.433594 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 907.605469 696.921875 C 907.546875 626.996094 907.425781 625.675781 906.707031 623.089844 C 905.5625 619.605469 903.640625 616.722656 901.058594 614.621094 C 896.554688 611.078125 894.8125 610.65625 884.539062 610.113281 C 873.003906 609.515625 856.601562 607.472656 846.332031 605.308594 C 818.035156 599.242188 791.660156 588.609375 767.691406 573.589844 C 764.269531 571.425781 760.542969 569.023438 759.402344 568.183594 C 753.152344 563.855469 750.75 562.355469 748.589844 561.515625 C 745.523438 560.371094 739.9375 560.011719 736.453125 560.851562 C 732.546875 561.753906 730.386719 562.835938 725.578125 566.441406 C 719.753906 570.765625 715.605469 573.410156 706.65625 578.574219 C 676.015625 596.117188 639.972656 607.171875 604.886719 609.632812 C 601.464844 609.875 596.175781 610.296875 593.175781 610.476562 C 588.609375 610.835938 587.347656 611.078125 585.363281 611.976562 C 581.21875 613.960938 577.496094 618.285156 575.8125 623.03125 C 575.089844 625.195312 574.789062 777.242188 575.570312 784.332031 C 576.292969 791.722656 577.976562 800.191406 580.617188 810.644531 C 584.34375 825.363281 591.492188 842.546875 599.363281 855.761719 C 608.914062 871.621094 618.527344 884.417969 630.121094 896.132812 C 653.851562 920.28125 678.480469 938.183594 710.5 954.585938 C 718.972656 958.910156 728.945312 963.117188 734.109375 964.558594 C 741.859375 966.660156 748.167969 965.640625 760.363281 960.351562 C 768.894531 956.628906 780.308594 950.621094 792.742188 943.230469 C 814.308594 930.496094 838.820312 911.152344 854.019531 894.75 C 859.246094 889.042969 866.636719 880.453125 869.578125 876.546875 C 872.402344 872.824219 879.492188 862.070312 882.976562 856.363281 C 886.160156 851.136719 892.886719 837.320312 895.710938 830.230469 C 900.636719 818.214844 904.542969 803.136719 906.40625 789.679688 C 907.546875 781.269531 907.789062 768.171875 907.667969 696.984375 Z M 630.058594 758.859375 C 631.082031 757.179688 634.386719 753.875 641.835938 746.964844 C 647.542969 741.679688 658.957031 731.105469 667.066406 723.476562 C 675.296875 715.847656 686.769531 705.214844 692.660156 699.808594 C 698.546875 694.398438 708.21875 685.449219 714.105469 679.863281 C 730.804688 664.183594 731.765625 663.402344 737.355469 662.199219 C 741.980469 661.117188 747.507812 662.140625 751.832031 664.785156 C 752.914062 665.445312 759.222656 671.089844 765.949219 677.398438 C 777.425781 688.210938 808.785156 717.410156 814.851562 722.816406 C 822.601562 729.90625 843.746094 749.488281 847.472656 753.035156 C 850.234375 755.675781 852.097656 758.019531 852.9375 759.523438 C 859.007812 770.816406 853.839844 784.210938 841.886719 788.175781 C 835.996094 790.160156 828.488281 788.359375 822.960938 783.671875 C 821.820312 782.652344 818.757812 779.945312 816.050781 777.425781 C 810.226562 772.015625 802.777344 765.109375 789.800781 753.332031 C 784.511719 748.347656 778.023438 742.398438 775.5 739.9375 C 772.980469 737.472656 767.753906 732.726562 763.847656 729.242188 C 759.941406 725.699219 754.296875 720.351562 751.113281 717.347656 C 748.046875 714.34375 744.5625 711.101562 743.363281 710.140625 L 741.199219 708.398438 L 738.375 710.558594 C 736.8125 711.820312 733.808594 714.527344 731.648438 716.6875 C 727.382812 720.953125 720.351562 727.5 714.644531 732.546875 C 712.664062 734.230469 708.578125 738.015625 705.515625 741.019531 C 702.332031 744.023438 698.367188 747.925781 696.441406 749.550781 C 685.148438 759.820312 672.59375 771.476562 668.269531 775.683594 C 657.214844 786.375 654.089844 788.476562 648.023438 788.777344 C 640.632812 789.257812 634.144531 786.015625 630.242188 779.945312 C 626.035156 773.460938 625.855469 765.410156 629.878906 758.679688 Z M 843.6875 854.5 C 840.382812 856.0625 835.15625 856.421875 831.132812 855.339844 C 826.386719 854.019531 824.824219 852.757812 807.703125 837.078125 C 803.316406 832.933594 795.144531 825.425781 789.679688 820.496094 C 784.210938 815.453125 777.726562 809.382812 775.140625 806.980469 C 772.679688 804.578125 767.332031 799.652344 763.367188 796.046875 C 759.402344 792.382812 754.175781 787.578125 751.710938 785.234375 C 749.308594 783.011719 746.003906 780.007812 744.324219 778.503906 L 741.320312 775.742188 L 737.234375 779.40625 C 732.066406 784.03125 719.933594 795.265625 712.484375 802.234375 C 709.300781 805.238281 704.253906 809.863281 701.1875 812.628906 C 697.644531 815.871094 694.039062 819.117188 690.554688 822.421875 C 687.730469 825.003906 683.585938 828.789062 681.242188 830.890625 C 679.019531 832.992188 673.914062 837.679688 670.011719 841.464844 C 657.632812 853.359375 654.210938 855.582031 647.78125 855.941406 C 639.550781 856.363281 632.582031 852.277344 629.039062 844.886719 C 627.535156 841.703125 627.296875 840.921875 627.117188 837.738281 C 626.9375 833.414062 627.777344 829.75 629.699219 826.625 C 630.960938 824.464844 639.851562 815.753906 648.625 807.941406 C 650.847656 805.960938 654.628906 802.535156 657.035156 800.191406 C 662.921875 794.546875 674.695312 783.671875 680.464844 778.6875 C 682.925781 776.34375 686.769531 772.859375 688.933594 770.695312 C 691.15625 768.59375 698.484375 761.804688 705.394531 755.496094 C 712.183594 749.25 720.351562 741.738281 723.476562 738.734375 C 729.605469 732.726562 733.027344 730.625 737.65625 729.605469 C 741.078125 728.882812 742.21875 728.882812 745.402344 729.605469 C 749.789062 730.6875 752.492188 732.429688 758.441406 738.074219 C 763.425781 742.820312 773.640625 752.371094 781.929688 759.824219 C 783.671875 761.382812 788.058594 765.53125 791.722656 768.953125 C 798.628906 775.441406 806.320312 782.46875 818.875 793.886719 C 822.960938 797.550781 826.265625 800.613281 826.324219 800.855469 C 826.324219 801.035156 829.328125 803.738281 832.8125 806.859375 C 843.507812 816.234375 850.777344 823.140625 852.097656 825.304688 C 854.261719 828.609375 855.582031 832.933594 855.582031 836.539062 C 855.523438 844.527344 851.078125 851.257812 843.628906 854.621094 Z M 840.683594 825.0625 C 833.472656 818.394531 827.167969 812.628906 817.496094 803.558594 C 803.558594 790.519531 797.550781 784.933594 792.382812 780.308594 C 785.234375 774 776.824219 766.191406 776.28125 765.347656 C 775.921875 764.929688 773.640625 762.765625 771.054688 760.542969 C 766.070312 756.21875 760.363281 750.992188 753.515625 744.625 C 747.386719 738.917969 745.285156 737.535156 742.039062 737.292969 C 740.359375 737.234375 738.796875 737.355469 737.773438 737.714844 C 735.3125 738.617188 733.027344 740.359375 729.785156 743.601562 C 726.960938 746.484375 720.171875 752.792969 706.535156 765.347656 C 702.992188 768.652344 698.425781 772.917969 696.382812 774.722656 C 694.402344 776.523438 689.292969 781.207031 685.089844 785.113281 C 680.945312 789.019531 675.957031 793.585938 674.15625 795.328125 C 672.351562 797.007812 668.566406 800.492188 665.863281 802.957031 C 659.078125 809.203125 642.796875 824.28125 639.613281 827.347656 C 635.464844 831.25 634.386719 835.757812 636.1875 840.742188 C 637.75 845.007812 641.472656 847.53125 646.101562 847.53125 C 651.085938 847.53125 652.40625 846.628906 666.527344 833.414062 C 675.238281 825.304688 687.3125 814.070312 694.941406 807.101562 C 703.652344 799.050781 710.859375 792.382812 718.011719 785.773438 C 730.023438 774.480469 737.714844 767.390625 738.496094 766.851562 C 739.398438 766.25 740.660156 766.011719 742.339844 766.191406 C 742.941406 766.191406 744.984375 767.871094 747.566406 770.273438 C 749.910156 772.496094 756.277344 778.386719 761.746094 783.492188 C 767.210938 788.476562 775.261719 795.867188 779.585938 799.832031 C 783.914062 803.917969 788.660156 808.121094 790.039062 809.382812 C 791.363281 810.644531 794.847656 813.890625 797.667969 816.472656 C 800.492188 819.054688 806.980469 825.003906 812.148438 829.75 C 817.3125 834.375 823.203125 839.902344 825.363281 841.882812 C 829.871094 846.03125 832.152344 847.292969 835.515625 847.53125 C 841.886719 848.011719 847.050781 843.144531 847.050781 836.597656 C 847.050781 831.851562 846.148438 830.230469 840.5625 825.125 Z M 840.683594 825.0625 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 750.03125 188.207031 L 1311.792969 749.96875 L 750.03125 1311.730469 L 188.207031 750.03125 L 750.03125 188.207031 M 731.046875 535.082031 C 722.574219 537.0625 717.46875 540.308594 705.875 548.117188 C 693.378906 556.589844 675.238281 565.71875 660.757812 570.945312 C 639.492188 578.757812 620.085938 582.601562 595.9375 583.800781 C 585.726562 584.28125 580.378906 585.0625 573.230469 588.609375 C 562.296875 594.136719 554.90625 602.785156 550.699219 615.042969 C 548.777344 620.328125 548.777344 621.230469 548.660156 697.464844 C 548.539062 772.078125 548.839844 777.726562 548.957031 779.707031 C 551 814.070312 562.894531 848.734375 583.382812 879.914062 C 591.914062 892.828125 601.703125 904.84375 614.441406 917.699219 C 640.875 944.191406 671.152344 965.277344 707.136719 982.21875 C 721.792969 989.1875 730.265625 992.253906 741.621094 992.253906 C 753.515625 992.253906 765.828125 987.328125 783.070312 978.734375 C 805.359375 967.5625 825.664062 954.585938 845.007812 938.90625 C 873.542969 915.777344 896.371094 888.683594 911.03125 860.449219 C 922.207031 839 929.953125 814.910156 932.777344 792.503906 C 934.21875 780.367188 934.402344 770.515625 934.339844 696.441406 L 934.160156 623.511719 L 934.160156 620.507812 C 934.160156 620.507812 933.199219 617.683594 933.199219 617.683594 L 932.238281 614.859375 C 928.152344 602.726562 921.003906 594.375 909.769531 588.609375 L 909.648438 588.609375 C 909.648438 588.609375 909.53125 588.488281 909.53125 588.488281 C 902.019531 584.824219 896.433594 584.222656 886.339844 583.742188 C 876.488281 583.261719 872.761719 582.902344 864.113281 581.578125 C 845.429688 578.816406 827.886719 573.648438 807.28125 564.757812 C 798.03125 560.734375 781.328125 551.363281 774.722656 546.433594 C 765.050781 539.285156 755.976562 534.480469 742.941406 534 C 742.160156 534 741.378906 534 740.597656 534 C 736.875 534 733.929688 534.300781 731.347656 534.960938 M 750.03125 162.734375 L 162.734375 750.03125 L 749.96875 1337.265625 L 1337.203125 750.03125 Z M 741.4375 974.230469 C 734.109375 974.230469 728.703125 972.546875 714.707031 965.941406 C 680.644531 949.898438 651.988281 929.953125 627.117188 904.964844 C 615.460938 893.1875 606.332031 882.136719 598.402344 870 C 579.777344 841.703125 568.722656 809.683594 566.921875 778.625 C 566.679688 774 566.5625 745.222656 566.679688 697.464844 C 566.742188 623.992188 566.742188 623.570312 567.703125 621.046875 C 570.34375 613.238281 574.671875 608.074219 581.398438 604.707031 C 585.363281 602.726562 588.066406 602.246094 596.839844 601.824219 C 622.671875 600.503906 644.117188 596.238281 667.007812 587.886719 C 683.105469 582.058594 702.449219 572.207031 716.027344 563.078125 C 727.683594 555.265625 730.324219 553.765625 735.371094 552.625 C 736.574219 552.324219 738.375 552.203125 740.359375 552.203125 C 740.957031 552.203125 741.558594 552.203125 742.160156 552.203125 C 749.609375 552.441406 755.136719 554.664062 763.726562 561.09375 C 771.476562 566.800781 789.320312 576.894531 799.832031 581.460938 C 821.699219 590.832031 840.921875 596.597656 861.230469 599.542969 C 870.421875 600.984375 874.746094 601.34375 885.257812 601.882812 C 894.75 602.304688 897.273438 602.785156 901.359375 604.769531 C 908.328125 608.3125 912.414062 613.058594 914.996094 620.6875 L 916.015625 623.570312 L 916.199219 696.503906 C 916.257812 770.273438 916.136719 779.40625 914.816406 790.339844 C 912.234375 810.527344 905.082031 832.691406 894.992188 852.15625 C 881.472656 878.230469 860.207031 903.402344 833.59375 924.910156 C 815.390625 939.628906 796.226562 952.003906 774.960938 962.636719 C 757.960938 971.105469 748.886719 974.289062 741.558594 974.289062 Z M 741.4375 974.230469 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 635.40625 769.433594 C 635.40625 765.289062 636.308594 763.726562 641.414062 758.800781 C 643.996094 756.335938 647.960938 752.671875 650.304688 750.570312 C 652.648438 748.589844 657.875 743.78125 661.960938 739.878906 C 666.046875 735.972656 673.074219 729.304688 677.640625 725.160156 C 691.097656 712.722656 718.609375 687.191406 726.300781 679.984375 C 733.75 672.894531 735.671875 671.453125 738.316406 670.492188 C 740.777344 669.589844 742.941406 669.769531 745.703125 671.089844 C 748.707031 672.59375 750.929688 674.515625 760.722656 683.828125 C 768.050781 690.796875 792.503906 713.625 806.742188 726.78125 C 810.40625 730.085938 813.949219 733.449219 817.554688 736.753906 C 821.097656 740.058594 824.761719 743.421875 828.367188 746.726562 C 839.902344 757.359375 844.46875 761.746094 845.371094 763.1875 C 848.253906 767.453125 847.773438 773.757812 844.226562 777.484375 C 842.003906 779.828125 839.960938 780.667969 836.417969 780.667969 C 832.273438 780.667969 830.171875 779.527344 824.042969 773.578125 C 821.398438 771.117188 817.976562 767.871094 816.472656 766.492188 C 815.089844 765.167969 809.984375 760.484375 805.238281 756.097656 C 793.105469 744.804688 786.976562 739.15625 778.925781 731.765625 C 775.082031 728.28125 767.8125 721.554688 762.707031 716.808594 C 757.71875 712.0625 752.433594 707.257812 751.050781 705.996094 C 749.667969 704.734375 747.328125 702.570312 745.765625 701.1875 C 743.300781 698.847656 742.761719 698.605469 741.257812 698.605469 C 739.457031 698.605469 740.898438 697.285156 719.753906 717.046875 C 714.585938 721.855469 706.777344 729.003906 702.449219 732.96875 C 698.125 736.875 693.921875 740.839844 693.140625 741.621094 C 692.296875 742.460938 689.835938 744.863281 687.492188 746.847656 C 685.269531 748.949219 679.203125 754.476562 674.214844 759.222656 C 654.390625 777.964844 654.03125 778.265625 651.386719 779.585938 C 649.042969 780.726562 648.382812 780.847656 646.101562 780.667969 C 639.792969 780.246094 635.40625 775.621094 635.40625 769.433594 Z M 635.40625 769.433594 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 907.605469 696.921875 C 907.546875 626.996094 907.425781 625.675781 906.707031 623.089844 C 905.5625 619.605469 903.640625 616.722656 901.058594 614.621094 C 896.554688 611.078125 894.8125 610.65625 884.539062 610.113281 C 873.003906 609.515625 856.601562 607.472656 846.332031 605.308594 C 818.035156 599.242188 791.660156 588.609375 767.691406 573.589844 C 764.269531 571.425781 760.542969 569.023438 759.402344 568.183594 C 753.152344 563.855469 750.75 562.355469 748.589844 561.515625 C 745.523438 560.371094 739.9375 560.011719 736.453125 560.851562 C 732.546875 561.753906 730.386719 562.835938 725.578125 566.441406 C 719.753906 570.765625 715.605469 573.410156 706.65625 578.574219 C 676.015625 596.117188 639.972656 607.171875 604.886719 609.632812 C 601.464844 609.875 596.175781 610.296875 593.175781 610.476562 C 588.609375 610.835938 587.347656 611.078125 585.363281 611.976562 C 581.21875 613.960938 577.496094 618.285156 575.8125 623.03125 C 575.089844 625.195312 574.789062 777.242188 575.570312 784.332031 C 576.292969 791.722656 577.976562 800.191406 580.617188 810.644531 C 584.34375 825.363281 591.492188 842.546875 599.363281 855.761719 C 608.914062 871.621094 618.527344 884.417969 630.121094 896.132812 C 653.851562 920.28125 678.480469 938.183594 710.5 954.585938 C 718.972656 958.910156 728.945312 963.117188 734.109375 964.558594 C 741.859375 966.660156 748.167969 965.640625 760.363281 960.351562 C 768.894531 956.628906 780.308594 950.621094 792.742188 943.230469 C 814.308594 930.496094 838.820312 911.152344 854.019531 894.75 C 859.246094 889.042969 866.636719 880.453125 869.578125 876.546875 C 872.402344 872.824219 879.492188 862.070312 882.976562 856.363281 C 886.160156 851.136719 892.886719 837.320312 895.710938 830.230469 C 900.636719 818.214844 904.542969 803.136719 906.40625 789.679688 C 907.546875 781.269531 907.789062 768.171875 907.667969 696.984375 Z M 630.058594 758.859375 C 631.082031 757.179688 634.386719 753.875 641.835938 746.964844 C 647.542969 741.679688 658.957031 731.105469 667.066406 723.476562 C 675.296875 715.847656 686.769531 705.214844 692.660156 699.808594 C 698.546875 694.398438 708.21875 685.449219 714.105469 679.863281 C 730.804688 664.183594 731.765625 663.402344 737.355469 662.199219 C 741.980469 661.117188 747.507812 662.140625 751.832031 664.785156 C 752.914062 665.445312 759.222656 671.089844 765.949219 677.398438 C 777.425781 688.210938 808.785156 717.410156 814.851562 722.816406 C 822.601562 729.90625 843.746094 749.488281 847.472656 753.035156 C 850.234375 755.675781 852.097656 758.019531 852.9375 759.523438 C 859.007812 770.816406 853.839844 784.210938 841.886719 788.175781 C 835.996094 790.160156 828.488281 788.359375 822.960938 783.671875 C 821.820312 782.652344 818.757812 779.945312 816.050781 777.425781 C 810.226562 772.015625 802.777344 765.109375 789.800781 753.332031 C 784.511719 748.347656 778.023438 742.398438 775.5 739.9375 C 772.980469 737.472656 767.753906 732.726562 763.847656 729.242188 C 759.941406 725.699219 754.296875 720.351562 751.113281 717.347656 C 748.046875 714.34375 744.5625 711.101562 743.363281 710.140625 L 741.199219 708.398438 L 738.375 710.558594 C 736.8125 711.820312 733.808594 714.527344 731.648438 716.6875 C 727.382812 720.953125 720.351562 727.5 714.644531 732.546875 C 712.664062 734.230469 708.578125 738.015625 705.515625 741.019531 C 702.332031 744.023438 698.367188 747.925781 696.441406 749.550781 C 685.148438 759.820312 672.59375 771.476562 668.269531 775.683594 C 657.214844 786.375 654.089844 788.476562 648.023438 788.777344 C 640.632812 789.257812 634.144531 786.015625 630.242188 779.945312 C 626.035156 773.460938 625.855469 765.410156 629.878906 758.679688 Z M 843.6875 854.5 C 840.382812 856.0625 835.15625 856.421875 831.132812 855.339844 C 826.386719 854.019531 824.824219 852.757812 807.703125 837.078125 C 803.316406 832.933594 795.144531 825.425781 789.679688 820.496094 C 784.210938 815.453125 777.726562 809.382812 775.140625 806.980469 C 772.679688 804.578125 767.332031 799.652344 763.367188 796.046875 C 759.402344 792.382812 754.175781 787.578125 751.710938 785.234375 C 749.308594 783.011719 746.003906 780.007812 744.324219 778.503906 L 741.320312 775.742188 L 737.234375 779.40625 C 732.066406 784.03125 719.933594 795.265625 712.484375 802.234375 C 709.300781 805.238281 704.253906 809.863281 701.1875 812.628906 C 697.644531 815.871094 694.039062 819.117188 690.554688 822.421875 C 687.730469 825.003906 683.585938 828.789062 681.242188 830.890625 C 679.019531 832.992188 673.914062 837.679688 670.011719 841.464844 C 657.632812 853.359375 654.210938 855.582031 647.78125 855.941406 C 639.550781 856.363281 632.582031 852.277344 629.039062 844.886719 C 627.535156 841.703125 627.296875 840.921875 627.117188 837.738281 C 626.9375 833.414062 627.777344 829.75 629.699219 826.625 C 630.960938 824.464844 639.851562 815.753906 648.625 807.941406 C 650.847656 805.960938 654.628906 802.535156 657.035156 800.191406 C 662.921875 794.546875 674.695312 783.671875 680.464844 778.6875 C 682.925781 776.34375 686.769531 772.859375 688.933594 770.695312 C 691.15625 768.59375 698.484375 761.804688 705.394531 755.496094 C 712.183594 749.25 720.351562 741.738281 723.476562 738.734375 C 729.605469 732.726562 733.027344 730.625 737.65625 729.605469 C 741.078125 728.882812 742.21875 728.882812 745.402344 729.605469 C 749.789062 730.6875 752.492188 732.429688 758.441406 738.074219 C 763.425781 742.820312 773.640625 752.371094 781.929688 759.824219 C 783.671875 761.382812 788.058594 765.53125 791.722656 768.953125 C 798.628906 775.441406 806.320312 782.46875 818.875 793.886719 C 822.960938 797.550781 826.265625 800.613281 826.324219 800.855469 C 826.324219 801.035156 829.328125 803.738281 832.8125 806.859375 C 843.507812 816.234375 850.777344 823.140625 852.097656 825.304688 C 854.261719 828.609375 855.582031 832.933594 855.582031 836.539062 C 855.523438 844.527344 851.078125 851.257812 843.628906 854.621094 Z M 840.683594 825.0625 C 833.472656 818.394531 827.167969 812.628906 817.496094 803.558594 C 803.558594 790.519531 797.550781 784.933594 792.382812 780.308594 C 785.234375 774 776.824219 766.191406 776.28125 765.347656 C 775.921875 764.929688 773.640625 762.765625 771.054688 760.542969 C 766.070312 756.21875 760.363281 750.992188 753.515625 744.625 C 747.386719 738.917969 745.285156 737.535156 742.039062 737.292969 C 740.359375 737.234375 738.796875 737.355469 737.773438 737.714844 C 735.3125 738.617188 733.027344 740.359375 729.785156 743.601562 C 726.960938 746.484375 720.171875 752.792969 706.535156 765.347656 C 702.992188 768.652344 698.425781 772.917969 696.382812 774.722656 C 694.402344 776.523438 689.292969 781.207031 685.089844 785.113281 C 680.945312 789.019531 675.957031 793.585938 674.15625 795.328125 C 672.351562 797.007812 668.566406 800.492188 665.863281 802.957031 C 659.078125 809.203125 642.796875 824.28125 639.613281 827.347656 C 635.464844 831.25 634.386719 835.757812 636.1875 840.742188 C 637.75 845.007812 641.472656 847.53125 646.101562 847.53125 C 651.085938 847.53125 652.40625 846.628906 666.527344 833.414062 C 675.238281 825.304688 687.3125 814.070312 694.941406 807.101562 C 703.652344 799.050781 710.859375 792.382812 718.011719 785.773438 C 730.023438 774.480469 737.714844 767.390625 738.496094 766.851562 C 739.398438 766.25 740.660156 766.011719 742.339844 766.191406 C 742.941406 766.191406 744.984375 767.871094 747.566406 770.273438 C 749.910156 772.496094 756.277344 778.386719 761.746094 783.492188 C 767.210938 788.476562 775.261719 795.867188 779.585938 799.832031 C 783.914062 803.917969 788.660156 808.121094 790.039062 809.382812 C 791.363281 810.644531 794.847656 813.890625 797.667969 816.472656 C 800.492188 819.054688 806.980469 825.003906 812.148438 829.75 C 817.3125 834.375 823.203125 839.902344 825.363281 841.882812 C 829.871094 846.03125 832.152344 847.292969 835.515625 847.53125 C 841.886719 848.011719 847.050781 843.144531 847.050781 836.597656 C 847.050781 831.851562 846.148438 830.230469 840.5625 825.125 Z M 840.683594 825.0625 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 749.308594 318.8125 L 318.148438 750.03125 L 749.371094 1181.25 L 1180.46875 750.03125 Z M 894.871094 852.15625 C 881.355469 878.230469 860.085938 903.402344 833.472656 924.910156 C 815.273438 939.625 796.109375 952.003906 774.839844 962.636719 C 757.839844 971.105469 748.769531 974.289062 741.4375 974.289062 C 734.109375 974.289062 728.703125 972.609375 714.707031 966 C 680.644531 949.960938 651.988281 930.015625 627.117188 905.023438 C 615.460938 893.25 606.332031 882.195312 598.402344 870.058594 C 579.777344 841.765625 568.722656 809.746094 566.921875 778.6875 C 566.679688 774.058594 566.5625 745.285156 566.679688 697.523438 C 566.742188 624.050781 566.742188 623.632812 567.703125 621.109375 C 570.34375 613.300781 574.671875 608.132812 581.398438 604.769531 C 585.363281 602.785156 588.066406 602.304688 596.839844 601.882812 C 622.671875 600.5625 644.117188 596.296875 667.007812 587.945312 C 683.105469 582.121094 702.449219 572.269531 716.027344 563.136719 C 727.683594 555.328125 730.324219 553.824219 735.371094 552.683594 C 736.933594 552.261719 739.457031 552.203125 742.160156 552.261719 C 749.609375 552.503906 755.136719 554.726562 763.726562 561.152344 C 771.476562 566.859375 789.320312 576.953125 799.832031 581.519531 C 821.699219 590.890625 840.921875 596.65625 861.230469 599.601562 C 870.421875 600.984375 874.746094 601.402344 885.257812 601.945312 C 894.75 602.367188 897.273438 602.847656 901.359375 604.828125 C 908.328125 608.371094 912.414062 613.117188 914.996094 620.75 L 916.015625 623.632812 L 916.199219 696.5625 C 916.257812 770.335938 916.136719 779.464844 914.816406 790.402344 C 912.234375 810.585938 905.082031 832.753906 894.992188 852.21875 Z M 894.871094 852.15625 " fill-opacity="1" fill-rule="nonzero"/></svg>',
    
    // Diplomatic - Flag icon (represents diplomacy, international relations, and treaties)
    "flag": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
    
    // Economic - Building with dollar sign or coins (represents commerce/economy)
    "building": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><line x1="9" y1="6" x2="9" y2="10"></line><line x1="12" y1="6" x2="12" y2="10"></line><line x1="15" y1="6" x2="15" y2="10"></line><line x1="9" y1="14" x2="9" y2="18"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="15" y1="14" x2="15" y2="18"></line><circle cx="12" cy="12" r="1" fill="currentColor"></circle></svg>',
    
    // Ideological - People/users icon (represents social movements, ideologies)
    "users": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    
    // Technological - Lightning bolt/zap (represents technology and innovation)
    "zap": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    
    // Mixed - Globe/world icon (represents global or multi-faceted events)
    "globe": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  };

  return iconMap[iconType] || iconMap["map-pin"];
}
