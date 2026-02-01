/**
 * Historical map configuration
 * Maps time periods to GeoJSON files for historical borders
 */

export interface HistoricalMapConfig {
  /** Unique identifier for this historical period */
  id: string;
  /** Display name */
  name: string;
  /** Start year (inclusive) */
  startYear: number;
  /** End year (inclusive) */
  endYear: number;
  /** Path to GeoJSON file with historical borders */
  geojsonPath: string;
  /** Mapping of historical country names to modern equivalents for highlighting */
  countryNameMapping?: Record<string, string[]>;
}

/**
 * Available historical map periods
 * Add more periods as needed with their corresponding GeoJSON files
 */
export const HISTORICAL_MAP_PERIODS: HistoricalMapConfig[] = [
  {
    id: "modern",
    name: "Modern Borders (2024)",
    startYear: 2024,
    endYear: 9999,
    geojsonPath: "/geo/countries.geojson", // Current borders
  },
  {
    id: "post-cold-war",
    name: "Post-Cold War (1991-2023)",
    startYear: 1991,
    endYear: 2023,
    geojsonPath: "/geo/countries.geojson", // Same as modern for now
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "USSR": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "Yugoslavia": ["Serbia", "Croatia", "Bosnia and Herzegovina", "Slovenia", "Macedonia", "Montenegro", "Kosovo"],
      "East Germany": ["Germany"],
      "West Germany": ["Germany"],
    },
  },
  {
    id: "cold-war",
    name: "Cold War Era (1947-1991)",
    startYear: 1947,
    endYear: 1991,
    geojsonPath: "/geo/countries.geojson", // Will need historical GeoJSON file
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "USSR": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "Yugoslavia": ["Serbia", "Croatia", "Bosnia and Herzegovina", "Slovenia", "Macedonia", "Montenegro"],
      "East Germany": ["Germany"],
      "West Germany": ["Germany"],
      "Czechoslovakia": ["Czech Republic", "Slovakia"],
    },
  },
  {
    id: "ww2-era",
    name: "World War II Era (1939-1945)",
    startYear: 1939,
    endYear: 1945,
    geojsonPath: "/geo/countries.geojson", // Will need historical GeoJSON file
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "USSR": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "Nazi Germany": ["Germany"],
      "Third Reich": ["Germany"],
      "British Empire": ["United Kingdom", "India", "Australia", "Canada", "South Africa", "New Zealand"],
    },
  },
  {
    id: "interwar",
    name: "Interwar Period (1918-1939)",
    startYear: 1918,
    endYear: 1939,
    geojsonPath: "/geo/countries.geojson", // Will need historical GeoJSON file
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "USSR": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "British Empire": ["United Kingdom", "India", "Australia", "Canada", "South Africa", "New Zealand"],
      "Ottoman Empire": ["Turkey", "Syria", "Iraq", "Lebanon", "Jordan", "Palestine", "Saudi Arabia"],
    },
  },
];

/**
 * Get the appropriate historical map configuration for a given year
 */
export function getHistoricalMapForYear(year: number): HistoricalMapConfig {
  // Find the period that contains this year
  for (const period of HISTORICAL_MAP_PERIODS) {
    if (year >= period.startYear && year <= period.endYear) {
      return period;
    }
  }
  
  // Default to modern if no match found
  return HISTORICAL_MAP_PERIODS[0];
}

/**
 * Get historical map configuration for an event based on its date/period
 */
export function getHistoricalMapForEvent(event: { date?: string; period?: { startYear?: number; endYear?: number } }): HistoricalMapConfig {
  // Try to get year from period
  if (event.period?.startYear) {
    return getHistoricalMapForYear(event.period.startYear);
  }
  
  // Try to extract year from date string
  if (event.date) {
    const yearMatch = event.date.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      return getHistoricalMapForYear(year);
    }
  }
  
  // Default to modern
  return HISTORICAL_MAP_PERIODS[0];
}

/**
 * Map historical country names to modern equivalents for highlighting
 */
export function mapHistoricalCountryNames(
  countries: string[],
  config: HistoricalMapConfig
): string[] {
  if (!config.countryNameMapping) {
    return countries;
  }
  
  const mappedCountries = new Set<string>();
  
  for (const country of countries) {
    // Check if this country has a mapping
    const mapping = config.countryNameMapping[country];
    if (mapping) {
      // Add all modern equivalents
      mapping.forEach(modernName => mappedCountries.add(modernName));
    } else {
      // No mapping, use the country name as-is
      mappedCountries.add(country);
    }
  }
  
  return Array.from(mappedCountries);
}

/**
 * Get all available historical map periods
 */
export function getAvailableHistoricalMaps(): HistoricalMapConfig[] {
  return HISTORICAL_MAP_PERIODS;
}
