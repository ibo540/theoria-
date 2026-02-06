/**
 * Event data structure for historical events analyzed through IR theory lenses
 * @module events
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

/**
 * Type of historical event or phenomena
 * @typedef {string} EventKind
 */
export type EventKind =
  | "event"
  | "era"
  | "crisis"
  | "formation"
  | "war"
  | "treaty";

/**
 * Primary category of event based on its main characteristic
 * @typedef {string} EventCategory
 */
export type EventCategory =
  | "military"
  | "economic"
  | "diplomatic"
  | "ideological"
  | "technological"
  | "mixed";

/**
 * Domain of international relations activity
 * @typedef {string} EventDomain
 */
export type EventDomain =
  | "military"
  | "economic"
  | "diplomatic"
  | "ideological"
  | "technological"
  | "cultural";

// ============================================================================
// GEOGRAPHIC TYPES
// ============================================================================

/**
 * Geographic point with latitude and longitude
 * @interface GeoPoint
 * @property {number} lat - Latitude (-90 to 90)
 * @property {number} lng - Longitude (-180 to 180)
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Coordinate tuple in [latitude, longitude] format
 * @typedef {[number, number]} LatLngTuple
 */
export type LatLngTuple = [number, number];

// ============================================================================
// MAP VISUALIZATION TYPES (New normalized structure)
// ============================================================================

/**
 * A point of interest on the map (city, base, strategic location)
 * @interface MapPoint
 */
export interface MapPoint {
  /** Geographic coordinates [lat, lng] */
  coords: LatLngTuple;
  /** Display label for the point */
  label: string;
  /** Type of point (capital, city, base, strategic, launch-site, etc.) */
  kind: "capital" | "city" | "base" | "strategic" | "launch-site" | string;
  /** Optional actor ID this point belongs to */
  actorId?: string;
  /** Optional visual size/importance (1-10) */
  size?: number;
}

/**
 * Icon placed on a country to mark an event
 * @interface CountryIcon
 */
export interface CountryIcon {
  /** Unique identifier for this icon */
  id: string;
  /** Country name where this icon is placed */
  country: string;
  /** Icon type/identifier (e.g. "shield", "users", "flag", "zap", etc.) */
  iconType: string;
  /** Geographic coordinates [lat, lng] where icon is placed */
  coordinates: LatLngTuple;
  /** Title displayed when icon is clicked */
  title: string;
  /** Description displayed when icon is clicked */
  description: string;
  /** Timeline point ID this icon is linked to (optional) */
  timelinePointId?: string;
  /** Year when this icon should appear (optional, alternative to timeline point) */
  appearAtYear?: number;
  /** Position (0-100) on timeline when this icon should appear (optional) */
  appearAtPosition?: number;
}

/**
 * An area on the map (influence zone, conflict zone, alliance territory)
 * @interface MapArea
 */
export interface MapArea {
  /** Shape type */
  shape: "circle" | "polygon";
  /** Center point for circular areas */
  center?: LatLngTuple;
  /** Radius in kilometers for circular areas */
  radiusKm?: number;
  /** Polygon vertices for polygon areas */
  polygon?: LatLngTuple[];
  /** Type of area (influence, alliance, conflict-zone, aid-target, state-breakup, etc.) */
  kind:
    | "influence"
    | "alliance"
    | "conflict-zone"
    | "aid-target"
    | "state-breakup"
    | string;
  /** Optional actor ID this area belongs to */
  actorId?: string;
  /** Optional display label */
  label?: string;
}

/**
 * A flow or connection between two points (military, economic, diplomatic)
 * @interface MapFlow
 */
export interface MapFlow {
  /** Starting coordinates [lat, lng] */
  from: LatLngTuple;
  /** Ending coordinates [lat, lng] */
  to: LatLngTuple;
  /** Type of flow (military, economic, diplomatic, alliance, blockade, support, invasion, etc.) */
  kind:
    | "military"
    | "economic"
    | "diplomatic"
    | "alliance"
    | "blockade"
    | "support"
    | "invasion"
    | string;
  /** Optional display label */
  label?: string;
  /** Optional actor ID this flow belongs to */
  actorId?: string;
}

// ============================================================================
// MAP VISUALIZATION TYPES (Legacy - for backward compatibility)
// ============================================================================

/**
 * @deprecated Use MapArea with kind="influence" instead
 * Legacy: Circular influence zone on map
 */
export interface MapInfluenceCircle {
  center: LatLngTuple;
  radius: number;
  country?: string;
  label?: string;
}

/**
 * @deprecated Use MapFlow instead
 * Legacy: Movement or connection between two points
 */
export interface MapMovement {
  from: LatLngTuple;
  to: LatLngTuple;
  type: string;
  label?: string;
}

/**
 * @deprecated Use MapArea with kind="conflict-zone" instead
 * Legacy: Conflict location on map
 */
export interface MapConflict {
  position: LatLngTuple;
  name: string;
  intensity: number;
}

/**
 * @deprecated Use MapPoint with kind="base" instead
 * Legacy: Military base location
 */
export interface MilitaryBase {
  position: LatLngTuple;
  name: string;
  country: string;
  size: number;
}

/**
 * Troop deployment information (still used for specific military data)
 * @interface TroopPresence
 */
export interface TroopPresence {
  /** Location coordinates [lat, lng] */
  position: LatLngTuple;
  /** Name/description of troop deployment */
  name: string;
  /** Number of troops */
  strength: number;
}

/**
 * Map visualization data for a timeline point
 * Supports both new (points/areas/flows) and legacy formats for backward compatibility
 * @interface TimelineMapData
 */
export interface TimelineMapData {
  // New normalized structure (preferred)
  /** Points of interest (cities, bases, strategic locations) */
  points?: MapPoint[];
  /** Areas on the map (influence zones, conflict zones, alliances) */
  areas?: MapArea[];
  /** Flows between points (movements, trade, alliances, conflicts) */
  flows?: MapFlow[];

  // Legacy structure (deprecated but supported)
  /** @deprecated Use points instead */
  militaryBases?: MilitaryBase[];
  /** @deprecated Use areas instead */
  conflicts?: MapConflict[];
  /** @deprecated Use flows instead */
  movements?: MapMovement[];
  /** @deprecated Use areas instead */
  influence?: MapInfluenceCircle[];

  // Still used for specific military data
  /** Troop deployment data */
  troops?: TroopPresence[];
}

// ============================================================================
// TIMELINE TYPES
// ============================================================================

/**
 * A single point on a detailed event timeline with full map visualization
 * @interface TimelinePoint
 * @example
 * {
 *   id: "truman-doctrine-1947",
 *   label: "Truman Doctrine Announced",
 *   date: "March 12, 1947",
 *   position: 0,
 *   year: "1947",
 *   description: "U.S. pledges support to states threatened by communism...",
 *   eventType: "diplomatic",
 *   isTurningPoint: true,
 *   relevantTheories: ["classical-realism", "structural-realism"],
 *   icon: "shield",
 *   focusLocation: [39.0, 22.0],
 *   focusZoom: 5,
 *   mapData: { ... }
 * }
 */
export interface TimelinePoint {
  /** Unique identifier (slug format recommended) */
  id: string;
  /** Short title for timeline display */
  label: string;
  /** Human-readable date (e.g. "March 12, 1947") */
  date: string;
  /** Position along timeline (0-100) for visual placement */
  position: number;

  /** Year as string (e.g. "1947") */
  year?: string;
  /** Paragraph description of this timeline point */
  description?: string;
  /** Primary category of this point */
  eventType?: EventCategory;
  /** Whether this is a major turning point */
  isTurningPoint?: boolean;
  /** Theory IDs relevant to this point (e.g. ["classical-realism", "liberalism"]) */
  relevantTheories?: string[];
  /** Icon identifier for UI (e.g. "shield", "zap", "users") */
  icon?: string;
  /** Map focus coordinates [lat, lng] for this point */
  focusLocation?: LatLngTuple;
  /** Map zoom level for this point */
  focusZoom?: number;
  /** Map visualization data for this timeline point */
  mapData?: TimelineMapData;
}

/**
 * Simple timeline entry for overview displays
 * @interface TimelineEntry
 */
export interface TimelineEntry {
  /** Date or year */
  date: string;
  /** Event description */
  event: string;
}

// ============================================================================
// EVENT RELATIONSHIP TYPES
// ============================================================================

/**
 * Connection or relationship between actors in an event
 * @interface EventConnection
 * @example
 * {
 *   from: "United States of America",
 *   to: "Russia",
 *   type: "rivalry",
 *   label: "Bipolar rivalry"
 * }
 */
export interface EventConnection {
  /** Source actor/country name */
  from: string;
  /** Target actor/country name */
  to: string;
  /** Type of relationship */
  type?:
    | "alliance"
    | "rivalry"
    | "proxy-war"
    | "institution"
    | "support"
    | "conflict"
    | string;
  /** Optional descriptive label */
  label?: string;
  /** Timeline point ID when this connection should appear (optional) */
  appearAtTimelinePoint?: string;
  /** Year when this connection should appear (optional, alternative to timeline point) */
  appearAtYear?: number;
  /** Position (0-100) on timeline when this connection should appear (optional) */
  appearAtPosition?: number;
  /** Timeline point ID when this connection should disappear (optional) */
  disappearAtTimelinePoint?: string;
  /** Year when this connection should disappear (optional, alternative to timeline point) */
  disappearAtYear?: number;
  /** Position (0-100) on timeline when this connection should disappear (optional) */
  disappearAtPosition?: number;
}

/**
 * Grouped area representing a bloc or alliance
 * @interface UnifiedArea
 */
export interface UnifiedArea {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Array of country names in this area */
  countries: string[];
  /** Description of what this unified area represents */
  description?: string;
  /** Timeline point ID when this area should appear (optional) */
  appearAtTimelinePoint?: string;
  /** Year when this area should appear (optional, alternative to timeline point) */
  appearAtYear?: number;
  /** Position (0-100) on timeline when this area should appear (optional) */
  appearAtPosition?: number;
  /** Timeline point ID when this area should disappear (optional) */
  disappearAtTimelinePoint?: string;
  /** Year when this area should disappear (optional, alternative to timeline point) */
  disappearAtYear?: number;
  /** Position (0-100) on timeline when this area should disappear (optional) */
  disappearAtPosition?: number;
}

/**
 * Chart data for statistics visualization
 * @interface ChartData
 */
export interface ChartData {
  /** Unique identifier for this chart */
  id: string;
  /** Chart title */
  title: string;
  /** Chart type */
  type: "bar" | "line" | "area" | "radar" | "pie";
  /** Chart data points */
  data: Array<{
    label: string;
    value: number;
    [key: string]: any; // Allow extra keys for multi-series charts
  }>;
  /** Optional description */
  description?: string;
  /** Data keys to plot (for multi-series charts) */
  dataKeys?: string[];
  /** Theory this chart is associated with (for color theming) */
  theory?: "realism" | "neorealism" | "liberalism" | "neoliberal" | "englishschool" | "constructivism";
  /** Custom X-axis label */
  xAxisLabel?: string;
  /** Custom Y-axis label */
  yAxisLabel?: string;
}

/**
 * Statistical data about an event (military power, economic data, etc.)
 * @interface EventStats
 */
export interface EventStats {
  /** Military power ratings by actor (0-100 scale) */
  militaryPower?: Record<string, number>;
  /** Economic power ratings by actor (0-100 scale) */
  economicPower?: Record<string, number>;
  /** Custom charts for statistics visualization */
  charts?: ChartData[];
  /** Array of alliance names and formation dates */
  alliances?: string[];
}

// ============================================================================
// THEORY ANALYSIS TYPES
// ============================================================================

/**
 * Visual element for map-based theory visualization
 * @interface TheoryVisualElement
 */
export interface TheoryVisualElement {
  /** Type of visual element (circle, line, arrow, marker, etc.) */
  type: string;
  /** Array of coordinates defining the element */
  coordinates: LatLngTuple[];
  /** Optional label to display */
  label?: string;
  /** Optional color for the element */
  color?: string;
}

/**
 * Analysis of a theory's limitations and blind spots for an event
 * @interface TheoryLimitations
 */
export interface TheoryLimitations {
  /** Whether this theory can explain the event */
  canExplain: boolean;
  /** Degree of weakness in explanation */
  weaknessLevel: "none" | "minor" | "moderate" | "strong" | string;
  /** Aspects this theory systematically overlooks */
  blindSpots: string[];
  /** Phenomena this theory cannot explain */
  whatItMisses: string[];
  /** Alternative theories that might explain better */
  betterAlternatives: Array<{
    /** ID of the alternative theory */
    theoryId: string;
    /** Why this alternative is better */
    reason: string;
  }>;
}

/**
 * A specific theory's interpretation of an event
 * @interface TheoryInterpretation
 */
export interface TheoryInterpretation {
  /** Paragraph explaining how this theory interprets the event */
  interpretation: string;
  /** Array of 3-5 key analytical points */
  keyPoints: string[];
  /** Optional visual elements for map display */
  visualElements?: TheoryVisualElement[];
  /** Analysis of the theory's limitations for this event */
  limitations: TheoryLimitations;
}

/**
 * A country's role and perspectives in an event from different theoretical viewpoints
 * @interface CountryPerspectiveEntry
 */
export interface CountryPerspectiveEntry {
  /** The country's role in the event (e.g. "Superpower", "Regional Power") */
  role: string;
  /** Map of theory ID to that theory's perspective on this country */
  perspectives: Record<string, string>;
}

/**
 * Structured time period for an event
 * @interface EventPeriod
 */
export interface EventPeriod {
  /** Starting year */
  startYear: number;
  /** Ending year */
  endYear: number;
  /** ISO-8601 start date */
  startDate: string;
  /** ISO-8601 end date */
  endDate: string;
}

/**
 * Structured actor information
 * @interface Actor
 */
export interface Actor {
  /** Unique identifier (slug format) */
  id: string;
  /** Display name */
  name: string;
  /** Optional role description */
  role?: string;
}

// ============================================================================
// MAIN EVENT DATA INTERFACE
// ============================================================================

/**
 * Complete data structure for a historical event or era analyzed through IR theory lenses
 *
 * This is the primary interface for event data. It includes all metadata, timeline points,
 * theory interpretations, country perspectives, and map visualization data.
 *
 * @interface EventData
 * @example
 * {
 *   id: "cold-war",
 *   title: "The Cold War",
 *   kind: "era",
 *   period: { startYear: 1947, endYear: 1991, ... },
 *   date: "1947-1991",
 *   summary: "Geopolitical rivalry between...",
 *   description: "A period of geopolitical tension...",
 *   category: "ideological",
 *   domains: ["military", "economic", "diplomatic"],
 *   primaryLocation: { lat: 52.52, lng: 13.405 },
 *   zoom: 3,
 *   actors: [{ id: "usa", name: "United States", role: "Superpower" }, ...],
 *   highlightedCountries: ["United States of America", "Russia", ...],
 *   connections: [{ from: "USA", to: "USSR", type: "rivalry" }, ...],
 *   timelinePoints: [...],
 *   interpretations: { "classical-realism": {...}, ... },
 *   ...
 * }
 */
export interface EventData {
  // === IDENTITY ===
  /** Unique identifier (slug format, e.g. "cold-war") */
  id: string;
  /** Display title (e.g. "The Cold War") */
  title: string;
  /** Type of event (era, crisis, formation, war, treaty, etc.) */
  kind?: EventKind;
  /** Theory perspective this event is analyzed from (e.g. "realism", "liberalism", etc.) */
  theory?: "realism" | "neorealism" | "liberalism" | "neoliberal" | "englishschool" | "constructivism";

  // === TIME ===
  /** Structured time period with start/end dates */
  period?: EventPeriod;
  /** Human-readable date string (e.g. "1947-1991" or "March 2024") */
  date: string;

  // === DESCRIPTION ===
  /** Short summary (1-2 sentences) for cards and previews */
  summary?: string;
  /** Medium description (1 paragraph) for main displays */
  description: string;
  /** Full description (multiple paragraphs) for detail views */
  fullDescription: string;

  // === CLASSIFICATION ===
  /** Primary category of the event */
  category?: EventCategory;
  /** Array of activity domains this event spans */
  domains?: EventDomain[];

  // === GEOGRAPHY ===
  /** Main map anchor point for the event */
  primaryLocation?: GeoPoint;
  /** Default map zoom level */
  zoom?: number;
  /** Historical map period ID to use (e.g., "cold-war", "ww2-era"). If not specified, will be auto-detected from event date */
  historicalMapPeriod?: string;

  // === ACTORS ===
  /** Main actors/blocs involved (structured with id, name, role) */
  actors?: Actor[] | string[]; // Support both new structured and legacy string arrays
  /** Array of country names to highlight on the map (legacy - use countryHighlights for timed highlights) */
  highlightedCountries: string[];
  /** Timed country highlights - controls when each country appears on the timeline */
  countryHighlights?: Array<{
    country: string;
    color?: string;
    /** Timeline point ID when this highlight should appear (optional) */
    appearAtTimelinePoint?: string;
    /** Year when this highlight should appear (optional, alternative to timeline point) */
    appearAtYear?: number;
    /** Position (0-100) on timeline when this highlight should appear (optional) */
    appearAtPosition?: number;
  }>;

  // === RELATIONSHIPS ===
  /** Connections/relationships between actors */
  connections: EventConnection[];
  /** Grouped areas representing blocs or alliances */
  unifiedAreas?: UnifiedArea[];
  
  // === COUNTRY ICONS ===
  /** Icons placed on countries to mark events (optional - not all highlighted countries need icons) */
  countryIcons?: CountryIcon[];

  // === DATA & STATS ===
  /** Statistical data (military power, economic power, alliances) */
  stats?: EventStats;

  // === TIMELINE ===
  /** Simple high-level timeline for overview displays */
  overviewTimeline?: TimelineEntry[];
  /** Detailed navigable timeline with full map data */
  timelinePoints: TimelinePoint[];

  // === THEORY ANALYSIS ===
  /** Map of theory ID to that theory's interpretation of this event */
  interpretations?: Record<string, TheoryInterpretation>;
  /** Map of country name to that country's perspectives from different theories */
  countryPerspectives?: Record<string, CountryPerspectiveEntry>;

  // === RELATED CONTENT ===
  /** Array of scholar names relevant to this event */
  relatedScholars?: string[];
  /** Array of scenario IDs related to this event */
  relatedScenarios?: string[];
  /** Optional array of academic or primary source references */
  references?: Array<{
    title: string;
    author?: string;
    url?: string;
    year?: number;
  }>;

  // === USER TRACKING ===
  /** Information about who last modified this event */
  lastModifiedBy?: {
    username: string;
    name: string;
    timestamp: string;
  };
  /** ISO timestamp when this event was first created */
  createdAt?: string;
  /** ISO timestamp when this event was last updated */
  updatedAt?: string;
}

// ============================================================================
// 🔥 COLD WAR EVENT ADAPTER
// ============================================================================
// Converts coldwar-event.json into the upgraded EventData structure

import coldWarRaw from "@/data/events/cold-war.json";

type ColdWarRaw = typeof coldWarRaw;

// Small helper to normalize country labels
const NAME_NORMALIZATION: Record<string, string[]> = {
  usa: ["United States of America"],
  us: ["United States of America"],
  "united states": ["United States of America"],
  "united states of america": ["United States of America"],
  uk: ["United Kingdom"],
  "united kingdom": ["United Kingdom"],
  "great britain": ["United Kingdom"],
  ussr: ["Russia"],
  "soviet union": ["Russia"],
  russia: ["Russia"],
  "west germany": ["Germany"],
  "east germany": ["Germany"],
  nato: [
    "United States of America",
    "United Kingdom",
    "France",
    "Germany",
    "Italy",
    "Canada",
    "Belgium",
    "Netherlands",
    "Luxembourg",
    "Denmark",
    "Norway",
    "Portugal",
    "Greece",
    "Turkey",
    "Spain",
  ],
  "nato allies": [
    "United States of America",
    "United Kingdom",
    "France",
    "Germany",
    "Italy",
    "Canada",
    "Belgium",
    "Netherlands",
  ],
  "warsaw pact": [
    "Russia",
    "Poland",
    "Hungary",
    "Romania",
    "Bulgaria",
    "Czechia",
    "Slovakia",
    "Germany",
    "Cuba",
    "Vietnam",
    "Afghanistan",
  ],
  "warsaw pact allies": [
    "Russia",
    "Poland",
    "Hungary",
    "Romania",
    "Bulgaria",
    "Czechia",
    "Slovakia",
  ],
  "non-aligned movement": ["India", "Egypt", "Indonesia", "Yugoslavia"],
  "western europe": ["France", "Germany", "Italy", "Belgium", "Netherlands"],
  "eastern europe": ["Poland", "Hungary", "Romania", "Bulgaria", "Czechia"],
};

const normalizeCountry = (name?: string | null): string[] => {
  if (!name) return [];
  const key = name.trim().toLowerCase();
  const normalized = NAME_NORMALIZATION[key];
  if (normalized && normalized.length) {
    return normalized;
  }
  const trimmed = name.trim();
  return trimmed ? [trimmed] : [];
};

// Auto-derive highlighted countries from actors, timeline map data, and country perspectives
function computeHighlightedCountries(raw: ColdWarRaw): string[] {
  const result = new Set<string>();

  const addCountry = (name?: string | null) => {
    normalizeCountry(name).forEach((normalized) => {
      if (normalized) {
        result.add(normalized);
      }
    });
  };

  // 1) Actors (skip pure blocs)
  raw.actors?.forEach((actor) => {
    const name = typeof actor === "string" ? actor : actor.name;
    const lower = name.toLowerCase();
    const isBloc =
      lower.includes("nato") ||
      lower.includes("pact") ||
      lower.includes("movement");
    if (isBloc) {
      normalizeCountry(name).forEach((normalized) => {
        if (normalized) {
          result.add(normalized);
        }
      });
      return;
    }
    addCountry(name);
  });

  // 2) Countries referenced in mapData
  raw.timelinePoints?.forEach((ev: Record<string, unknown>) => {
    const map = ev.mapData as TimelineMapData | undefined;
    if (!map) return;

    map.militaryBases?.forEach((b: MilitaryBase) => {
      addCountry(b.country);
    });

    map.influence?.forEach((inf: MapInfluenceCircle) => {
      addCountry(inf.country);
    });
  });

  // 3) Countries which have explicit perspectives
  Object.keys(raw.countryPerspectives ?? {}).forEach((name) => {
    addCountry(name);
  });

  return Array.from(result).sort();
}

// Helper to create slugs for timeline point IDs
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Build proper timeline points with positions 0–100 based on year range (1947–1991)
function buildColdWarTimeline(raw: ColdWarRaw): TimelinePoint[] {
  const timeline = raw.timelinePoints ?? [];
  if (!timeline.length) return [];

  const firstYear = Number(timeline[0].year);
  const lastYear = Number(timeline[timeline.length - 1].year);
  const span = lastYear - firstYear || 1;

  return timeline.map((ev: Record<string, unknown>) => {
    const year = Number(ev.year);
    const position = ((year - firstYear) / span) * 100;
    const title = (ev.title || ev.label) as string;

    return {
      id: (ev.id as string) || `cold-war-${ev.year}-${slugify(title)}`,
      label: title,
      date: ev.date as string,
      position,
      year: ev.year as string | undefined,
      description: ev.description as string | undefined,
      eventType: ev.eventType as EventCategory,
      isTurningPoint: ev.isTurningPoint as boolean | undefined,
      relevantTheories: ev.relevantTheories as string[] | undefined,
      icon: ev.icon as string | undefined,
      focusLocation: ev.focusLocation as LatLngTuple | undefined,
      focusZoom: ev.focusZoom as number | undefined,
      mapData: ev.mapData as TimelineMapData | undefined,
    };
  });
}

// Bloc grouping & connections
const COLD_WAR_CONNECTIONS: EventConnection[] = [
  {
    from: "United States of America",
    to: "Russia",
    type: "rivalry",
    label: "Bipolar rivalry",
  },
  {
    from: "United States of America",
    to: "nato-bloc",
    type: "alliance",
    label: "US–NATO",
  },
  {
    from: "Russia",
    to: "warsaw-bloc",
    type: "alliance",
    label: "USSR–Warsaw Pact",
  },
  {
    from: "United States of America",
    to: "China",
    type: "alliance",
    label: "Nixon visits China",
  },
  {
    from: "Russia",
    to: "Afghanistan",
    type: "proxy-war",
    label: "Soviet invasion & US support",
  },
  {
    from: "United States of America",
    to: "Vietnam",
    type: "proxy-war",
    label: "Vietnam War",
  },
];

const COLD_WAR_UNIFIED_AREAS: EventData["unifiedAreas"] = [
  {
    id: "nato-bloc",
    name: "NATO & Western Allies",
    countries: [
      "United States of America",
      "United Kingdom",
      "France",
      "Germany",
      "Italy",
      "Canada",
      "South Korea",
      "Spain",
      "Turkey",
    ],
  },
  {
    id: "warsaw-bloc",
    name: "Warsaw Pact & Soviet Allies",
    countries: [
      "Russia",
      "Poland",
      "Czechia",
      "Slovakia",
      "Hungary",
      "Afghanistan",
      "Vietnam",
      "Cuba",
      "Romania",
      "Bulgaria",
    ],
  },
  {
    id: "non-aligned",
    name: "Non-Aligned Movement (sample)",
    countries: ["India", "Egypt", "Indonesia", "Yugoslavia"],
  },
];

const HIGHLIGHTED_COUNTRIES = Array.from(
  new Set([
    ...computeHighlightedCountries(coldWarRaw),
    ...COLD_WAR_UNIFIED_AREAS.flatMap((area) => area.countries),
  ])
).sort();

// Final COLD_WAR_EVENT object - now directly uses the new consolidated structure
export const COLD_WAR_EVENT: EventData = {
  id: coldWarRaw.id,
  title: coldWarRaw.title,
  kind: coldWarRaw.kind as EventKind,
  period: coldWarRaw.period,
  date: coldWarRaw.date,

  summary: coldWarRaw.summary,
  description: coldWarRaw.description,
  fullDescription: coldWarRaw.fullDescription,

  category: coldWarRaw.category as EventCategory,
  domains: coldWarRaw.domains as EventDomain[],

  primaryLocation: coldWarRaw.primaryLocation as GeoPoint,
  zoom: coldWarRaw.zoom,

  actors: coldWarRaw.actors,
  highlightedCountries:
    coldWarRaw.highlightedCountries || HIGHLIGHTED_COUNTRIES,

  connections: coldWarRaw.connections || COLD_WAR_CONNECTIONS,
  unifiedAreas: coldWarRaw.unifiedAreas || COLD_WAR_UNIFIED_AREAS,

  stats: coldWarRaw.stats,
  overviewTimeline: coldWarRaw.overviewTimeline,

  interpretations: coldWarRaw.interpretations as unknown as Record<
    string,
    TheoryInterpretation
  >,
  countryPerspectives: coldWarRaw.countryPerspectives,
  relatedScholars: coldWarRaw.relatedScholars,
  relatedScenarios: coldWarRaw.relatedScenarios,

  timelinePoints: buildColdWarTimeline(coldWarRaw),
};

// Export main events list (after COLD_WAR_EVENT is defined)
export const EVENTS_DATA: EventData[] = [COLD_WAR_EVENT];

// Option B: Keep separate for "Featured Case Study" view
export const FEATURED_EVENTS: EventData[] = [COLD_WAR_EVENT];
