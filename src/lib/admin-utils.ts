/**
 * Admin utility functions for saving and loading events
 */

import { EventData } from "@/data/events";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase, eventToDbFormat, dbToEventFormat } from "@/lib/supabase";

/**
 * Extract base event ID from composite ID (format: baseId-theoryId)
 * If no theory is present, returns the original ID
 */
export function getBaseEventId(eventId: string): string {
  if (!eventId) return eventId;
  
  const parts = eventId.split('-');
  // Find the theory part (last part that matches a theory ID)
  const theories = ["realism", "neorealism", "liberalism", "neoliberal", "englishschool", "constructivism"];
  
  // Check from the end backwards to find the theory
  for (let i = parts.length - 1; i >= 0; i--) {
    if (theories.includes(parts[i])) {
      // Found a theory, return everything before it as the base ID
      return parts.slice(0, i).join('-');
    }
  }
  
  // No theory found, return as-is (this is already a base ID)
  return eventId;
}

/**
 * Create composite event ID from base ID and theory
 */
export function createEventIdWithTheory(baseId: string, theory: string): string {
  return `${baseId}-${theory}`;
}

/**
 * Get all theories for a base event ID
 */
export function getTheoriesForBaseEvent(baseId: string): string[] {
  try {
    const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
    const theories = new Set<string>();
    events.forEach((e: EventData) => {
      const baseIdFromEvent = getBaseEventId(e.id);
      if (baseIdFromEvent === baseId && e.theory) {
        theories.add(e.theory);
      }
    });
    return Array.from(theories);
  } catch (error) {
    console.error("Error getting theories for base event:", error);
    return [];
  }
}

/**
 * Get all events grouped by base event ID
 */
export function getEventsGroupedByBase(): Map<string, EventData[]> {
  try {
    const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
    const grouped = new Map<string, EventData[]>();
    
    events.forEach((event: EventData) => {
      const baseId = getBaseEventId(event.id);
      if (!grouped.has(baseId)) {
        grouped.set(baseId, []);
      }
      grouped.get(baseId)!.push(event);
    });
    
    return grouped;
  } catch (error) {
    console.error("Error grouping events:", error);
    return new Map();
  }
}

/**
 * Duplicate event with a new theory, pre-filling common data
 */
export function duplicateEventForNewTheory(
  originalEvent: EventData,
  newTheory: string
): EventData {
  const baseId = getBaseEventId(originalEvent.id);
  const newId = createEventIdWithTheory(baseId, newTheory);
  
  // Create new event with pre-filled common data
  const newEvent: EventData = {
    ...originalEvent,
    id: newId,
    theory: newTheory as any,
    // Reset theory-specific data
    highlightedCountries: [],
    countryHighlights: [],
    countryIcons: [],
    timelinePoints: [],
    connections: [],
    unifiedAreas: [],
    interpretations: {},
    countryPerspectives: {},
    // Keep common data
    title: originalEvent.title,
    date: originalEvent.date,
    description: originalEvent.description,
    fullDescription: originalEvent.fullDescription,
    summary: originalEvent.summary,
    kind: originalEvent.kind,
    category: originalEvent.category,
    domains: originalEvent.domains,
    period: originalEvent.period,
    primaryLocation: originalEvent.primaryLocation,
    zoom: originalEvent.zoom,
    actors: originalEvent.actors,
  };
  
  return newEvent;
}

/**
 * Save event to Supabase database
 * Falls back to localStorage if Supabase is unavailable
 */
export async function saveEventToStorage(event: EventData): Promise<void> {
  try {
    // Get current user info for tracking
    const authState = useAuthStore.getState();
    const currentUser = authState.getCurrentUser();
    
    // Prepare event with user tracking
    const eventWithTracking: EventData = {
      ...event,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: currentUser ? {
        username: currentUser.username,
        name: currentUser.name,
        timestamp: new Date().toISOString(),
      } : undefined,
    };
    
    // Check if event exists in Supabase
    const { data: existingEvent } = await supabase
      .from('events')
      .select('created_at')
      .eq('id', event.id)
      .single();
    
    // If this is a new event, set createdAt
    if (!existingEvent) {
      eventWithTracking.createdAt = new Date().toISOString();
    } else {
      // Preserve original createdAt for existing events
      eventWithTracking.createdAt = existingEvent.created_at || new Date().toISOString();
    }
    
    // Convert to database format
    const dbEvent = eventToDbFormat(eventWithTracking);
    
    // Upsert (insert or update) to Supabase
    const { error } = await supabase
      .from('events')
      .upsert(dbEvent, { onConflict: 'id' });
    
    if (error) {
      console.error("Error saving to Supabase, falling back to localStorage:", error);
      // Fallback to localStorage
      const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
      const existingIndex = events.findIndex((e: EventData) => e.id === event.id);
      
      if (existingIndex >= 0) {
        events[existingIndex] = eventWithTracking;
      } else {
        events.push(eventWithTracking);
      }
      
      localStorage.setItem("theoria-events", JSON.stringify(events));
    } else {
      console.log("Event saved successfully to Supabase");
    }
  } catch (error) {
    console.error("Error saving event:", error);
    // Fallback to localStorage
    try {
      const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
      const existingIndex = events.findIndex((e: EventData) => e.id === event.id);
      
      if (existingIndex >= 0) {
        events[existingIndex] = event;
      } else {
        events.push(event);
      }
      
      localStorage.setItem("theoria-events", JSON.stringify(events));
    } catch (localError) {
      console.error("Error saving to localStorage fallback:", localError);
      throw error;
    }
  }
}

/**
 * Load event from Supabase database
 * Falls back to localStorage if Supabase is unavailable
 */
export async function loadEventFromStorage(eventId: string): Promise<EventData | null> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (!error && data) {
      return dbToEventFormat(data);
    }
    
    // Fallback to localStorage
    const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
    return events.find((e: EventData) => e.id === eventId) || null;
  } catch (error) {
    console.error("Error loading event:", error);
    // Fallback to localStorage
    try {
      const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
      return events.find((e: EventData) => e.id === eventId) || null;
    } catch (localError) {
      console.error("Error loading from localStorage fallback:", localError);
      return null;
    }
  }
}

/**
 * Load events by base ID (all theory versions of an event)
 * Much faster than loading all events
 */
export async function loadEventsByBaseId(baseId: string): Promise<EventData[]> {
  try {
    // Try Supabase first - query for events where id starts with baseId
    // This is much faster than loading all events
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .like('id', `${baseId}%`)
      .order('updated_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      return data.map(dbToEventFormat);
    }
    
    // Fallback to localStorage
    const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
    return events.filter((e: EventData) => {
      const eventBaseId = getBaseEventId(e.id);
      return eventBaseId === baseId;
    });
  } catch (error) {
    console.error("Error loading events by base ID:", error);
    // Fallback to localStorage
    try {
      const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
      return events.filter((e: EventData) => {
        const eventBaseId = getBaseEventId(e.id);
        return eventBaseId === baseId;
      });
    } catch (localError) {
      console.error("Error loading from localStorage fallback:", localError);
      return [];
    }
  }
}

/**
 * Load all events from Supabase database
 * Falls back to localStorage if Supabase is unavailable
 */
export async function loadAllEventsFromStorage(): Promise<EventData[]> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      return data.map(dbToEventFormat);
    }
    
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem("theoria-events") || "[]");
  } catch (error) {
    console.error("Error loading events:", error);
    // Fallback to localStorage
    try {
      return JSON.parse(localStorage.getItem("theoria-events") || "[]");
    } catch (localError) {
      console.error("Error loading from localStorage fallback:", localError);
      return [];
    }
  }
}

/**
 * Delete event from Supabase database
 * Falls back to localStorage if Supabase is unavailable
 */
export async function deleteEventFromStorage(eventId: string): Promise<void> {
  try {
    // Try Supabase first
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error("Error deleting from Supabase, falling back to localStorage:", error);
      // Fallback to localStorage
      const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
      const filteredEvents = events.filter((e: EventData) => e.id !== eventId);
      localStorage.setItem("theoria-events", JSON.stringify(filteredEvents));
    } else {
      console.log("Event deleted successfully from Supabase");
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    // Fallback to localStorage
    try {
      const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
      const filteredEvents = events.filter((e: EventData) => e.id !== eventId);
      localStorage.setItem("theoria-events", JSON.stringify(filteredEvents));
    } catch (localError) {
      console.error("Error deleting from localStorage fallback:", localError);
      throw error;
    }
  }
}

/**
 * Delete all theories for a base event
 */
export function deleteAllTheoriesForBaseEvent(baseId: string): void {
  try {
    const events = JSON.parse(localStorage.getItem("theoria-events") || "[]");
    const filteredEvents = events.filter((e: EventData) => {
      const eventBaseId = getBaseEventId(e.id);
      return eventBaseId !== baseId;
    });
    localStorage.setItem("theoria-events", JSON.stringify(filteredEvents));
  } catch (error) {
    console.error("Error deleting all theories for base event:", error);
    throw error;
  }
}

/**
 * Save event to API (for future implementation)
 */
export async function saveEventToAPI(event: EventData): Promise<EventData> {
  try {
    // Get current user info for tracking
    const authState = useAuthStore.getState();
    const currentUser = authState.getCurrentUser();
    
    // Prepare event with user tracking
    const eventWithTracking: EventData = {
      ...event,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: currentUser ? {
        username: currentUser.username,
        name: currentUser.name,
        timestamp: new Date().toISOString(),
      } : undefined,
    };
    
    // If this is a new event, set createdAt
    if (!event.createdAt) {
      eventWithTracking.createdAt = new Date().toISOString();
    }
    
    const response = await fetch(`/api/events${event.id ? `/${event.id}` : ""}`, {
      method: event.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventWithTracking),
    });

    if (!response.ok) {
      throw new Error(`Failed to save event: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving event to API:", error);
    throw error;
  }
}

/**
 * Load event from API
 */
export async function loadEventFromAPI(eventId: string): Promise<EventData | null> {
  try {
    const response = await fetch(`/api/events/${eventId}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load event: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading event from API:", error);
    return null;
  }
}
