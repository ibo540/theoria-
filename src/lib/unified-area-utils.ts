/**
 * Utilities for handling Unified Areas and converting them to timeline icons
 */

import { UnifiedArea, CountryIcon } from "@/data/events";
import { getCountryCoordinates } from "./country-coordinates";
import { calculateCenterPoint } from "./map-utils";

/**
 * Calculate the center coordinates of a unified area from its countries
 * Returns [lng, lat] format (for MapLibre) or null if no valid coordinates found
 */
export function calculateUnifiedAreaCenter(countries: string[]): [number, number] | null {
  if (!countries || countries.length === 0) {
    return null;
  }

  const coordinates: [number, number][] = [];
  
  for (const countryName of countries) {
    const coords = getCountryCoordinates(countryName);
    if (coords) {
      // getCountryCoordinates returns [lat, lng], convert to [lng, lat] for MapLibre
      coordinates.push([coords[1], coords[0]]);
    }
  }

  if (coordinates.length === 0) {
    return null;
  }

  // Calculate center point
  const center = calculateCenterPoint(coordinates);
  return center;
}

/**
 * Convert a Unified Area to a CountryIcon for timeline display
 * Only creates icon if the area has timeline appearance settings
 */
export function unifiedAreaToIcon(area: UnifiedArea): CountryIcon | null {
  // Only create icon if area has timeline appearance settings
  if (!area.appearAtTimelinePoint && !area.appearAtYear && area.appearAtPosition === undefined) {
    return null;
  }

  // Calculate center coordinates
  const coordinates = calculateUnifiedAreaCenter(area.countries);
  if (!coordinates) {
    console.warn(`Could not calculate center for unified area: ${area.name}`);
    return null;
  }

  // Use timeline point ID if available, otherwise generate one
  const timelinePointId = area.appearAtTimelinePoint || `area-${area.id}`;

  // Create icon with extended properties for disappear settings
  const icon: CountryIcon & { 
    disappearAtTimelinePoint?: string;
    disappearAtPosition?: number;
  } = {
    id: `unified-area-${area.id}`,
    country: area.name, // Use area name as "country"
    iconType: "globe", // Use globe icon for unified areas/blocs
    coordinates: coordinates,
    title: area.name,
    description: area.description || `Unified area: ${area.name}`,
    timelinePointId: timelinePointId, // Link to timeline point
    appearAtPosition: area.appearAtPosition,
    // Store disappear settings as custom properties
    disappearAtTimelinePoint: area.disappearAtTimelinePoint,
    disappearAtPosition: area.disappearAtPosition,
  };

  return icon as CountryIcon;
}

/**
 * Convert all unified areas with timeline settings to icons
 */
export function unifiedAreasToIcons(unifiedAreas: UnifiedArea[]): (CountryIcon & { 
  disappearAtTimelinePoint?: string;
  disappearAtPosition?: number;
})[] {
  const icons: (CountryIcon & { 
    disappearAtTimelinePoint?: string;
    disappearAtPosition?: number;
  })[] = [];
  
  for (const area of unifiedAreas) {
    const icon = unifiedAreaToIcon(area);
    if (icon) {
      icons.push(icon as CountryIcon & { 
        disappearAtTimelinePoint?: string;
        disappearAtPosition?: number;
      });
    }
  }
  
  return icons;
}
