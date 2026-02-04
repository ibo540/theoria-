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
  /** Reverse mapping: modern country names to historical names in GeoJSON */
  modernToHistoricalMapping?: Record<string, string[]>;
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
    geojsonPath: "/geo/countries-post-cold-war.geojson", // Historical borders for post-Cold War period (or use countries.geojson if same as modern)
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
    geojsonPath: "/geo/countries-cold-war.geojson", // Historical borders for Cold War period
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
    geojsonPath: "/geo/countries-ww2.geojson", // Historical borders for WW2 period
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "USSR": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "Nazi Germany": ["Germany"],
      "Third Reich": ["Germany"],
      "British Empire": ["United Kingdom", "India", "Australia", "Canada", "South Africa", "New Zealand"],
    },
  },
  {
    id: "ww1-era",
    name: "World War I Era (1914-1918)",
    startYear: 1914,
    endYear: 1918,
    geojsonPath: "/geo/countries-ww1.geojson", // Historical borders for WW1 period
    countryNameMapping: {
      "Russian Empire": ["Russia", "Ukraine", "Belarus", "Poland", "Finland", "Estonia", "Latvia", "Lithuania", "Georgia", "Armenia", "Azerbaijan", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Moldova"],
      "Austria-Hungary": ["Austria", "Hungary", "Czech Republic", "Slovakia", "Slovenia", "Croatia", "Bosnia and Herzegovina", "Serbia", "Romania", "Ukraine", "Poland", "Italy"],
      "Ottoman Empire": ["Turkey", "Syria", "Iraq", "Lebanon", "Jordan", "Palestine", "Saudi Arabia", "Yemen", "Egypt", "Libya", "Greece", "Bulgaria"],
      "German Empire": ["Germany", "Poland", "France", "Belgium", "Denmark"],
      "British Empire": ["United Kingdom", "India", "Australia", "Canada", "South Africa", "New Zealand", "Egypt", "Sudan", "Kenya", "Nigeria", "Ghana"],
    },
    modernToHistoricalMapping: {
      "United Kingdom": ["United Kingdom of Great Britain and Ireland", "United Kingdom", "British Empire"],
      "UK": ["United Kingdom of Great Britain and Ireland", "United Kingdom", "British Empire"],
      "Germany": ["German Empire", "Germany", "Prussia"],
      "Russia": ["Russian Empire", "Russia"],
      "Austria": ["Austria-Hungary", "Austrian Empire", "Austria"],
      "Hungary": ["Austria-Hungary", "Hungary"],
      "Turkey": ["Ottoman Empire", "Turkey", "Ottoman Sultanate"],
      "Czech Republic": ["Austria-Hungary", "Bohemia", "Czechoslovakia", "Czech Republic"],
      "Slovakia": ["Austria-Hungary", "Slovakia", "Czechoslovakia"],
      "Slovenia": ["Austria-Hungary", "Slovenia", "Yugoslavia"],
      "Croatia": ["Austria-Hungary", "Croatia", "Yugoslavia"],
      "Bosnia and Herzegovina": ["Austria-Hungary", "Bosnia and Herzegovina", "Yugoslavia"],
      "Serbia": ["Serbia", "Yugoslavia"],
      "Poland": ["Russian Empire", "Austria-Hungary", "German Empire", "Poland"],
      "Finland": ["Russian Empire", "Finland"],
      "Estonia": ["Russian Empire", "Estonia"],
      "Latvia": ["Russian Empire", "Latvia"],
      "Lithuania": ["Russian Empire", "Lithuania"],
      "Romania": ["Romania", "Austria-Hungary"],
      "Italy": ["Italy", "Austria-Hungary"],
      "France": ["France"],
      "Belgium": ["Belgium"],
      "Netherlands": ["Netherlands"],
      "Switzerland": ["Switzerland"],
      "Spain": ["Spain"],
      "Portugal": ["Portugal"],
      "Greece": ["Greece", "Ottoman Empire"],
      "Bulgaria": ["Bulgaria", "Ottoman Empire"],
      "Albania": ["Albania", "Ottoman Empire"],
      "Syria": ["Ottoman Empire", "Syria"],
      "Iraq": ["Ottoman Empire", "Iraq"],
      "Lebanon": ["Ottoman Empire", "Lebanon"],
      "Jordan": ["Ottoman Empire", "Jordan"],
      "Palestine": ["Ottoman Empire", "Palestine"],
      "Saudi Arabia": ["Ottoman Empire", "Nejd and Hejaz", "Saudi Arabia"],
      "Yemen": ["Ottoman Empire", "Yemen"],
      "Egypt": ["British Empire", "Ottoman Empire", "Egypt"],
      "Libya": ["Ottoman Empire", "Italy", "Libya"],
      "China": ["China"],
      "Japan": ["Japan"],
      "India": ["British Empire", "India"],
      "Australia": ["British Empire", "Australia"],
      "Canada": ["British Empire", "Canada"],
      "South Africa": ["British Empire", "South Africa"],
      "New Zealand": ["British Empire", "New Zealand"],
    },
  },
  {
    id: "pre-ww1",
    name: "Pre-World War I (1900-1913)",
    startYear: 1900,
    endYear: 1913,
    geojsonPath: "/geo/countries-pre-ww1.geojson", // Historical borders for pre-WW1 period
    countryNameMapping: {
      "Russian Empire": ["Russia", "Ukraine", "Belarus", "Poland", "Finland", "Estonia", "Latvia", "Lithuania", "Georgia", "Armenia", "Azerbaijan", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Moldova"],
      "Austria-Hungary": ["Austria", "Hungary", "Czech Republic", "Slovakia", "Slovenia", "Croatia", "Bosnia and Herzegovina", "Serbia", "Romania", "Ukraine", "Poland", "Italy"],
      "Ottoman Empire": ["Turkey", "Syria", "Iraq", "Lebanon", "Jordan", "Palestine", "Saudi Arabia", "Yemen", "Egypt", "Libya", "Greece", "Bulgaria"],
      "German Empire": ["Germany", "Poland", "France", "Belgium", "Denmark"],
      "British Empire": ["United Kingdom", "India", "Australia", "Canada", "South Africa", "New Zealand", "Egypt", "Sudan", "Kenya", "Nigeria", "Ghana"],
    },
    modernToHistoricalMapping: {
      "United Kingdom": ["United Kingdom of Great Britain and Ireland", "United Kingdom", "British Empire"],
      "UK": ["United Kingdom of Great Britain and Ireland", "United Kingdom", "British Empire"],
      "Germany": ["German Empire", "Germany", "Prussia"],
      "Russia": ["Russian Empire", "Russia"],
      "Austria": ["Austria-Hungary", "Austrian Empire", "Austria"],
      "Hungary": ["Austria-Hungary", "Hungary"],
      "Turkey": ["Ottoman Empire", "Turkey", "Ottoman Sultanate"],
      "Czech Republic": ["Austria-Hungary", "Bohemia", "Czechoslovakia", "Czech Republic"],
      "Slovakia": ["Austria-Hungary", "Slovakia", "Czechoslovakia"],
      "Slovenia": ["Austria-Hungary", "Slovenia", "Yugoslavia"],
      "Croatia": ["Austria-Hungary", "Croatia", "Yugoslavia"],
      "Bosnia and Herzegovina": ["Austria-Hungary", "Bosnia and Herzegovina", "Yugoslavia"],
      "Serbia": ["Serbia", "Yugoslavia"],
      "Poland": ["Russian Empire", "Austria-Hungary", "German Empire", "Poland"],
      "Finland": ["Russian Empire", "Finland"],
      "Estonia": ["Russian Empire", "Estonia"],
      "Latvia": ["Russian Empire", "Latvia"],
      "Lithuania": ["Russian Empire", "Lithuania"],
      "Romania": ["Romania", "Austria-Hungary"],
      "Italy": ["Italy", "Austria-Hungary"],
      "France": ["France"],
      "Belgium": ["Belgium"],
      "Netherlands": ["Netherlands"],
      "Switzerland": ["Switzerland"],
      "Spain": ["Spain"],
      "Portugal": ["Portugal"],
      "Greece": ["Greece", "Ottoman Empire"],
      "Bulgaria": ["Bulgaria", "Ottoman Empire"],
      "Albania": ["Albania", "Ottoman Empire"],
      "Syria": ["Ottoman Empire", "Syria"],
      "Iraq": ["Ottoman Empire", "Iraq"],
      "Lebanon": ["Ottoman Empire", "Lebanon"],
      "Jordan": ["Ottoman Empire", "Jordan"],
      "Palestine": ["Ottoman Empire", "Palestine"],
      "Saudi Arabia": ["Ottoman Empire", "Nejd and Hejaz", "Saudi Arabia"],
      "Yemen": ["Ottoman Empire", "Yemen"],
      "Egypt": ["British Empire", "Ottoman Empire", "Egypt"],
      "Libya": ["Ottoman Empire", "Italy", "Libya"],
      "China": ["China"],
      "Japan": ["Japan"],
      "India": ["British Empire", "India"],
      "Australia": ["British Empire", "Australia"],
      "Canada": ["British Empire", "Canada"],
      "South Africa": ["British Empire", "South Africa"],
      "New Zealand": ["British Empire", "New Zealand"],
    },
  },
  {
    id: "interwar",
    name: "Interwar Period (1918-1939)",
    startYear: 1918,
    endYear: 1939,
    geojsonPath: "/geo/countries-interwar.geojson", // Historical borders for Interwar period
    countryNameMapping: {
      "Soviet Union": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "USSR": ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"],
      "British Empire": ["United Kingdom", "India", "Australia", "Canada", "South Africa", "New Zealand"],
      "Ottoman Empire": ["Turkey", "Syria", "Iraq", "Lebanon", "Jordan", "Palestine", "Saudi Arabia"],
    },
    modernToHistoricalMapping: {
      "United Kingdom": ["United Kingdom of Great Britain and Ireland", "United Kingdom"],
      "UK": ["United Kingdom of Great Britain and Ireland", "United Kingdom"],
      "Germany": ["German Reich", "Germany", "Weimar Republic"],
      "Russia": ["Soviet Union", "USSR", "Russia", "Russian Soviet Federative Socialist Republic"],
      "Soviet Union": ["Soviet Union", "USSR", "Russia"],
      "USSR": ["Soviet Union", "USSR"],
      "Turkey": ["Ottoman Empire", "Turkey", "Ottoman Sultanate"],
      "Ottoman Sultanate": ["Ottoman Empire", "Turkey", "Ottoman Sultanate"],
      "Belarus": ["White Russia", "Belarus", "Byelorussia"],
      "White Russia": ["White Russia", "Belarus", "Byelorussia"],
      "Algeria": ["Algeria", "French Algeria"],
      "France": ["France"],
      "Italy": ["Italy"],
      "Spain": ["Spain"],
      "Portugal": ["Portugal"],
      "Belgium": ["Belgium"],
      "Netherlands": ["Netherlands"],
      "Switzerland": ["Switzerland"],
      "Austria": ["Austria"],
      "Poland": ["Poland"],
      "Czech Republic": ["Czechoslovakia", "Czech Republic"],
      "Czechoslovakia": ["Czechoslovakia"],
      "Slovakia": ["Czechoslovakia", "Slovakia"],
      "Hungary": ["Hungary"],
      "Romania": ["Romania"],
      "Bulgaria": ["Bulgaria"],
      "Greece": ["Greece"],
      "Yugoslavia": ["Yugoslavia", "Serbia", "Croatia", "Bosnia and Herzegovina", "Slovenia"],
      "Serbia": ["Serbia", "Yugoslavia"],
      "Croatia": ["Croatia", "Yugoslavia"],
      "Bosnia and Herzegovina": ["Bosnia and Herzegovina", "Yugoslavia"],
      "Slovenia": ["Slovenia", "Yugoslavia"],
      "Albania": ["Albania"],
      "Estonia": ["Estonia"],
      "Latvia": ["Latvia"],
      "Lithuania": ["Lithuania"],
      "Finland": ["Finland"],
      "Sweden": ["Sweden"],
      "Norway": ["Norway"],
      "Denmark": ["Denmark"],
      "Iceland": ["Iceland"],
      "Ireland": ["Ireland"],
      "Sri Lanka": ["Ceylon"],
      "Iran": ["Persia"],
      "Saudi Arabia": ["Nejd and Hejaz", "Saudi Arabia"],
      "Afghanistan": ["Afghanistan"],
      "Tunisia": ["Tunisia"],
      "Morocco": ["Morocco"],
      "Egypt": ["Egypt"],
      "Sudan": ["Sudan"],
      "Ethiopia": ["Ethiopia"],
      "Kenya": ["Kenya"],
      "Tanzania": ["Tanzania, United Republic of", "Tanzania"],
      "Angola": ["Angola"],
      "Mozambique": ["Mozambique"],
      "South Africa": ["South Africa"],
      "Zimbabwe": ["Zimbabwe"],
      "Zambia": ["Zambia"],
      "Malawi": ["Malawi"],
      "Botswana": ["Botswana"],
      "Namibia": ["Namibia"],
      "Madagascar": ["Madagascar (france)", "Madagascar"],
      "Liberia": ["Liberia"],
      "Ghana": ["Gold Coast", "Ghana"],
      "Nigeria": ["Nigeria"],
      "Senegal": ["Senegal"],
      "Ivory Coast": ["Ivory Coast", "Côte d'Ivoire"],
      "Cameroon": ["Cameroon"],
      "Congo": ["Zaire (belgium)", "Congo"],
      "Rwanda": ["Rwanda (belgium)", "Rwanda"],
      "Burundi": ["Burundi"],
      "Uganda": ["Uganda"],
      "China": ["China"],
      "Japan": ["Japan"],
      "India": ["India"],
      "Pakistan": ["Pakistan"],
      "Bangladesh": ["Bangladesh"],
      "Indonesia": ["Indonesia"],
      "Philippines": ["Philippines"],
      "Vietnam": ["Vietnam", "French Indochina"],
      "Thailand": ["Siam", "Thailand"],
      "Myanmar": ["Burma", "Myanmar"],
      "Malaysia": ["Malaysia"],
      "Singapore": ["Singapore"],
      "Australia": ["Australia"],
      "New Zealand": ["New Zealand"],
      "Canada": ["Canada"],
      "United States": ["United States", "United States of America"],
      "USA": ["United States", "United States of America"],
      "Mexico": ["Mexico"],
      "Brazil": ["Brazil"],
      "Argentina": ["Argentina"],
      "Chile": ["Chile"],
      "Peru": ["Peru"],
      "Colombia": ["Colombia"],
      "Venezuela": ["Venezuela"],
      "Bolivia": ["Bolivia"],
      "Paraguay": ["Paraguay"],
      "Uruguay": ["Uruguay"],
      "Ecuador": ["Ecuador"],
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
 * Map country names for highlighting on historical maps
 * This function handles both directions:
 * - Historical names → modern equivalents (for display)
 * - Modern names → historical names (for matching GeoJSON features)
 */
export function mapHistoricalCountryNames(
  countries: string[],
  config: HistoricalMapConfig
): string[] {
  const mappedCountries = new Set<string>();
  
  for (const country of countries) {
    let foundMapping = false;
    
    // First, try reverse mapping: modern name → historical name in GeoJSON
    if (config.modernToHistoricalMapping) {
      const historicalNames = config.modernToHistoricalMapping[country];
      if (historicalNames && historicalNames.length > 0) {
        // Add all possible historical names that might exist in GeoJSON
        historicalNames.forEach(historicalName => mappedCountries.add(historicalName));
        // Also add original name as fallback (in case GeoJSON has both names)
        mappedCountries.add(country);
        foundMapping = true;
      }
    }
    
    // Second, try forward mapping: historical name → modern equivalents
    if (!foundMapping && config.countryNameMapping) {
      const mapping = config.countryNameMapping[country];
      if (mapping) {
        // Add all modern equivalents
        mapping.forEach(modernName => mappedCountries.add(modernName));
        // Also add original name as fallback
        mappedCountries.add(country);
        foundMapping = true;
      }
    }
    
    // No mapping found, use the country name as-is (for exact matches)
    // This will work if the GeoJSON uses the same name
    if (!foundMapping) {
      mappedCountries.add(country);
    }
  }
  
  const result = Array.from(mappedCountries);
  console.log("🗺️ Country name mapping:", {
    input: countries,
    output: result,
    mapConfig: config.id,
  });
  
  return result;
}

/**
 * Get all available historical map periods
 */
export function getAvailableHistoricalMaps(): HistoricalMapConfig[] {
  return HISTORICAL_MAP_PERIODS;
}
