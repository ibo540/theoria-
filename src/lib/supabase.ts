import { createClient } from '@supabase/supabase-js';
import { EventData } from '@/data/events';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert EventData to database format
export function eventToDbFormat(event: EventData): any {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    description: event.description,
    full_description: event.fullDescription,
    summary: event.summary,
    theory: event.theory,
    kind: event.kind,
    category: event.category,
    domains: event.domains ? JSON.stringify(event.domains) : null,
    primary_location: event.primaryLocation ? JSON.stringify(event.primaryLocation) : null,
    zoom: event.zoom,
    actors: event.actors ? JSON.stringify(event.actors) : null,
    highlighted_countries: event.highlightedCountries ? JSON.stringify(event.highlightedCountries) : null,
    country_highlights: event.countryHighlights ? JSON.stringify(event.countryHighlights) : null,
    connections: event.connections ? JSON.stringify(event.connections) : null,
    unified_areas: event.unifiedAreas ? JSON.stringify(event.unifiedAreas) : null,
    country_icons: event.countryIcons ? JSON.stringify(event.countryIcons) : null,
    stats: event.stats ? JSON.stringify(event.stats) : null,
    overview_timeline: event.overviewTimeline ? JSON.stringify(event.overviewTimeline) : null,
    timeline_points: event.timelinePoints ? JSON.stringify(event.timelinePoints) : null,
    interpretations: event.interpretations ? JSON.stringify(event.interpretations) : null,
    country_perspectives: event.countryPerspectives ? JSON.stringify(event.countryPerspectives) : null,
    related_scholars: event.relatedScholars ? JSON.stringify(event.relatedScholars) : null,
    related_scenarios: event.relatedScenarios ? JSON.stringify(event.relatedScenarios) : null,
    references: event.references ? JSON.stringify(event.references) : null,
    created_at: event.createdAt || new Date().toISOString(),
    updated_at: event.updatedAt || new Date().toISOString(),
    created_by_name: event.lastModifiedBy?.name || null,
    created_by_username: event.lastModifiedBy?.username || null,
    last_modified_by_name: event.lastModifiedBy?.name || null,
    last_modified_by_username: event.lastModifiedBy?.username || null,
    last_modified_timestamp: event.lastModifiedBy?.timestamp || null,
  };
}

// Helper function to convert database format to EventData
export function dbToEventFormat(row: any): EventData {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    description: row.description,
    fullDescription: row.full_description,
    summary: row.summary,
    theory: row.theory as any,
    kind: row.kind as any,
    category: row.category as any,
    domains: row.domains ? JSON.parse(row.domains) : undefined,
    primaryLocation: row.primary_location ? JSON.parse(row.primary_location) : undefined,
    zoom: row.zoom,
    actors: row.actors ? JSON.parse(row.actors) : undefined,
    highlightedCountries: row.highlighted_countries ? JSON.parse(row.highlighted_countries) : [],
    countryHighlights: row.country_highlights ? JSON.parse(row.country_highlights) : undefined,
    connections: row.connections ? JSON.parse(row.connections) : [],
    unifiedAreas: row.unified_areas ? JSON.parse(row.unified_areas) : undefined,
    countryIcons: row.country_icons ? JSON.parse(row.country_icons) : undefined,
    stats: row.stats ? JSON.parse(row.stats) : undefined,
    overviewTimeline: row.overview_timeline ? JSON.parse(row.overview_timeline) : undefined,
    timelinePoints: row.timeline_points ? JSON.parse(row.timeline_points) : [],
    interpretations: row.interpretations ? JSON.parse(row.interpretations) : undefined,
    countryPerspectives: row.country_perspectives ? JSON.parse(row.country_perspectives) : undefined,
    relatedScholars: row.related_scholars ? JSON.parse(row.related_scholars) : undefined,
    relatedScenarios: row.related_scenarios ? JSON.parse(row.related_scenarios) : undefined,
    references: row.references ? JSON.parse(row.references) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastModifiedBy: row.last_modified_by_name ? {
      username: row.last_modified_by_username || '',
      name: row.last_modified_by_name,
      timestamp: row.last_modified_timestamp || row.updated_at,
    } : undefined,
  } as EventData;
}
