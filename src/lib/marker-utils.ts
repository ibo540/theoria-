import { TheoryType } from "@/stores/useTheoryStore";
import { MarkerData } from "@/components/marker";
import { EventData } from "@/data/events";

// ============================================================================
// Theory Keys & Labels
// ============================================================================

export const THEORY_LABELS: Record<TheoryType, string> = {
  realism: "Realism",
  neorealism: "Neorealism",
  liberalism: "Liberalism",
  neoliberal: "Neoliberalism",
  englishschool: "English School",
  constructivism: "Constructivism",
};

const THEORY_DATA_KEY_MAP: Record<TheoryType, string> = {
  realism: "classical-realism",
  neorealism: "structural-realism",
  liberalism: "liberalism",
  neoliberal: "neoliberalism",
  englishschool: "english-school",
  constructivism: "constructivism",
};

export const THEORY_SERIES_KEY = THEORY_DATA_KEY_MAP;

export function getTheoryDataKey(theory: TheoryType): string {
  return THEORY_DATA_KEY_MAP[theory];
}

/**
 * Map theory keys from JSON to TheoryType
 * Handles various formats: "realism", "classical-realism", "structural-realism", etc.
 */
const THEORY_KEY_TO_TYPE: Record<string, TheoryType> = {
  // Realism variants
  realism: "realism",
  "classical-realism": "realism",
  "classicalrealism": "realism",
  
  // Neorealism/Structural Realism variants
  neorealism: "neorealism",
  "structural-realism": "neorealism",
  "structuralrealism": "neorealism",
  
  // Liberalism
  liberalism: "liberalism",
  
  // Neoliberalism variants
  neoliberal: "neoliberal",
  neoliberalism: "neoliberal",
  "neo-liberalism": "neoliberal",
  
  // English School variants
  englishschool: "englishschool",
  "english-school": "englishschool",
  
  // Constructivism
  constructivism: "constructivism",
};

/**
 * Extract supported theories from country perspectives
 */
export function extractSupportedTheories(
  perspectives?: Record<string, string>
): TheoryType[] {
  if (!perspectives) return [];

  const theories = new Set<TheoryType>();
  for (const key of Object.keys(perspectives)) {
    // Normalize key: lowercase, trim, remove spaces
    const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, "-");
    
    // Try direct match first
    let theoryType = THEORY_KEY_TO_TYPE[normalizedKey];
    
    // If no direct match, try partial matching
    if (!theoryType) {
      for (const [mapKey, mapType] of Object.entries(THEORY_KEY_TO_TYPE)) {
        if (normalizedKey.includes(mapKey) || mapKey.includes(normalizedKey)) {
          theoryType = mapType;
          break;
        }
      }
    }
    
    if (theoryType) {
      theories.add(theoryType);
    }
  }
  return Array.from(theories);
}

/**
 * Enrich marker data with event information
 */
export function enrichMarkerData(
  markerId: string,
  markerName: string,
  position: [number, number],
  isUnified: boolean,
  event: EventData | null,
  unifiedArea?: { id: string; name: string; countries: string[] }
): MarkerData {
  let role: string | undefined;
  let countries: string[] | undefined;
  let perspectives: Record<string, string> | undefined;
  let supportedTheories: TheoryType[] | undefined;

  if (event) {
    if (isUnified && unifiedArea) {
      // For unified areas, try to find perspectives for the area name
      const areaPerspective = event.countryPerspectives?.[unifiedArea.name];
      if (areaPerspective) {
        role = areaPerspective.role;
        perspectives = areaPerspective.perspectives;
        supportedTheories = extractSupportedTheories(perspectives);
      }
      countries = unifiedArea.countries;
    } else {
      // For individual countries, find by name
      const countryPerspective = event.countryPerspectives?.[markerName];
      if (countryPerspective) {
        role = countryPerspective.role;
        perspectives = countryPerspective.perspectives;
        supportedTheories = extractSupportedTheories(perspectives);
      }
    }
  }

  return {
    id: markerId,
    name: markerName,
    position,
    isUnified,
    role,
    countries,
    perspectives,
    supportedTheories,
  };
}

