import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventData } from '@/data/events';

// Lazy initialization of Supabase client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will fail gracefully when used
    // This allows the build to complete even if env vars aren't set
    console.error('❌ Supabase environment variables not set. Database operations will fail.');
    console.error('   Please check your .env.local file and restart the dev server.');
    console.error('   Expected variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Create a client with dummy values - it will fail when actually used
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseClient;
  }

  // Log successful initialization (only once)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase client initialized successfully:', {
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey,
      keyLength: supabaseAnonKey?.length || 0
    });
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Export a getter function instead of direct client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

// Helper function to convert EventData to database format
export function eventToDbFormat(event: EventData): any {
  // Build the database object, only including fields that exist
  const dbEvent: any = {
    id: event.id,
    title: event.title,
    date: event.date,
    description: event.description,
    full_description: event.fullDescription,
    summary: event.summary || null,
    theory: event.theory || null,
    kind: event.kind || null,
    category: event.category || null,
    domains: event.domains ? JSON.stringify(event.domains) : null,
    primary_location: event.primaryLocation ? JSON.stringify(event.primaryLocation) : null,
    zoom: event.zoom || null,
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

  // Only include historical_map_period if it exists (to avoid schema errors)
  // This will be added to the table via SQL migration
  if (event.historicalMapPeriod !== undefined) {
    dbEvent.historical_map_period = event.historicalMapPeriod;
  }

  return dbEvent;
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
    historicalMapPeriod: row.historical_map_period || undefined,
  } as EventData;
}
