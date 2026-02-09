"use client";

import { create } from "zustand";
import { EVENTS_DATA, EventData } from "@/data/events";
import { MarkerData } from "@/components/marker";
import { loadAllEventsFromStorage, loadEventFromStorage, loadEventsByBaseId, getBaseEventId, createEventIdWithTheory } from "@/lib/admin-utils";

interface EventStore {
  activeEventId: string | null;
  activeEvent: EventData | null;
  activeTimelinePointId: string | null;
  timelinePointClickCounter: number; // Force re-render on clicks
  // Geolocation data
  markers: Map<string, MarkerData>;
  highlighted: GeoJSON.FeatureCollection | null;
  connections: GeoJSON.FeatureCollection | null;
  drawnShapes: GeoJSON.FeatureCollection | null;
  centroids: Map<string, [number, number]>;
  countriesInUnifiedAreas: Set<string>;
  isLoadingGeoData: boolean;
  geoDataError: Error | null;
  // Event loading state
  isEventLoading: boolean;
  loadingEventId: string | null; // Track which event is currently loading
  // Timeline playback state
  isTimelinePlaying: boolean;
  timelinePlaySpeed: number; // milliseconds per point
  // Actions
  selectEvent: (eventId: string, theoryId?: string | null) => Promise<void>;
  deselectEvent: () => void;
  toggleEvent: (eventId: string) => void;
  isEventSelected: (eventId: string) => boolean;
  setActiveTimelinePoint: (pointId: string | null) => void;
  navigateTimelinePoint: (direction: "prev" | "next") => void;
  // Timeline playback actions
  playTimeline: () => void;
  pauseTimeline: () => void;
  togglePlayTimeline: () => void;
  resetTimeline: () => void;
  setTimelinePlaySpeed: (speed: number) => void;
  // Internal actions for updating geo data
  setGeoData: (data: {
    markers: Map<string, MarkerData>;
    highlighted: GeoJSON.FeatureCollection | null;
    connections: GeoJSON.FeatureCollection | null;
    drawnShapes: GeoJSON.FeatureCollection | null;
    centroids: Map<string, [number, number]>;
    countriesInUnifiedAreas: Set<string>;
    isLoading: boolean;
    error: Error | null;
  }) => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  activeEventId: null,
  activeEvent: null,
  activeTimelinePointId: null,
  timelinePointClickCounter: 0,
  markers: new Map(),
  highlighted: null,
  connections: null,
  drawnShapes: null,
  centroids: new Map(),
  countriesInUnifiedAreas: new Set(),
  isLoadingGeoData: false,
  geoDataError: null,
  isEventLoading: false,
  loadingEventId: null,
  isTimelinePlaying: false,
  timelinePlaySpeed: 4000, // 4 seconds per point
  selectEvent: async (eventId, theoryId?: string | null) => {
    // Set loading state immediately for UI feedback
    set({ isEventLoading: true, loadingEventId: eventId });
    
    try {
      // If theory is provided, try to find the theory-specific version
      let event: EventData | null = null;
      let finalEventId = eventId;
      
      // First, check static data (fast, no network call)
      const baseId = getBaseEventId(eventId);
      const staticEvent = EVENTS_DATA.find((e) => {
        const staticBaseId = getBaseEventId(e.id);
        return staticBaseId === baseId;
      });
      
      if (theoryId) {
        // Try to find theory-specific version
        const theorySpecificId = createEventIdWithTheory(baseId, theoryId);
        const storedTheoryEvent = await loadEventFromStorage(theorySpecificId);
        if (storedTheoryEvent) {
          event = storedTheoryEvent;
          finalEventId = theorySpecificId;
        } else {
          // Fallback: try to find any version of this event and use it
          // (user might be selecting a theory for an event that doesn't have that theory yet)
          // Use optimized query to load only events with this base ID (much faster!)
          const eventVersions = await loadEventsByBaseId(baseId);
          
          if (eventVersions.length > 0) {
            // Use the first available version, or try to find one matching the theory
            const theoryMatch = eventVersions.find(e => e.theory === theoryId);
            event = theoryMatch || eventVersions[0];
            finalEventId = event.id;
          } else if (staticEvent) {
            // Use static event as fallback
            event = staticEvent;
            finalEventId = staticEvent.id;
          }
        }
      } else {
        // No theory specified, just load by ID
        // Try static data first (instant)
        if (staticEvent && staticEvent.id === eventId) {
          event = staticEvent;
        } else {
          // Try Supabase/localStorage with the exact eventId
          const storedEvent = await loadEventFromStorage(eventId);
          if (storedEvent) {
            event = storedEvent;
          } else {
            // If not found by exact ID, try to find any version of this base event
            // This handles cases where the baseId doesn't match any stored event exactly
            const eventVersions = await loadEventsByBaseId(baseId);
            if (eventVersions.length > 0) {
              // Use the first available version (prefer base event if available)
              const baseVersion = eventVersions.find(e => getBaseEventId(e.id) === e.id);
              event = baseVersion || eventVersions[0];
              finalEventId = event.id;
            } else if (staticEvent) {
              // Fallback to static data
              event = staticEvent;
            } else {
              // Last resort: check all static events
              event = EVENTS_DATA.find((e) => {
                const eBaseId = getBaseEventId(e.id);
                return eBaseId === baseId || e.id === eventId;
              }) || null;
            }
          }
        }
      }
      
      // Set first timeline point as active when event is selected
      const firstPointId = event?.timelinePoints?.[0]?.id || null;
      set({ 
        activeEventId: finalEventId, 
        activeEvent: event,
        activeTimelinePointId: firstPointId,
        isEventLoading: false,
        loadingEventId: null,
      });
    } catch (error) {
      console.error("Error selecting event:", error);
      set({ isEventLoading: false, loadingEventId: null });
      throw error;
    }
  },
  deselectEvent: () => {
    set({
      activeEventId: null,
      activeEvent: null,
      activeTimelinePointId: null,
      markers: new Map(),
      highlighted: null,
      connections: null,
      drawnShapes: null,
      centroids: new Map(),
      countriesInUnifiedAreas: new Set(),
      isLoadingGeoData: false,
      geoDataError: null,
    });
  },
  toggleEvent: (eventId) => {
    const { activeEventId } = get();
    if (activeEventId === eventId) {
      get().deselectEvent();
    } else {
      get().selectEvent(eventId);
    }
  },
  isEventSelected: (eventId) => {
    return get().activeEventId === eventId;
  },
  setActiveTimelinePoint: (pointId) => {
    // Always set the timeline point and increment counter to force re-render
    // This ensures clicks work even when clicking the already-active point
    const current = get();
    set({ 
      activeTimelinePointId: pointId,
      timelinePointClickCounter: current.timelinePointClickCounter + 1
    });
  },
  navigateTimelinePoint: (direction) => {
    const { activeEvent, activeTimelinePointId, timelinePointClickCounter } = get();
    
    console.log("🔍 navigateTimelinePoint called:", {
      direction,
      activeEventId: activeEvent?.id,
      activeTimelinePointId,
      timelinePointsCount: activeEvent?.timelinePoints?.length || 0,
      timelinePoints: activeEvent?.timelinePoints?.map(p => ({ id: p.id, label: p.label }))
    });
    
    if (!activeEvent?.timelinePoints || activeEvent.timelinePoints.length === 0) {
      console.warn("⚠️ Cannot navigate: no timeline points available", {
        hasActiveEvent: !!activeEvent,
        hasTimelinePoints: !!activeEvent?.timelinePoints,
        timelinePointsLength: activeEvent?.timelinePoints?.length
      });
      return;
    }

    const points = activeEvent.timelinePoints;
    
    // Find current index - handle duplicate IDs by using the first match
    let currentIndex = -1;
    if (activeTimelinePointId) {
      currentIndex = points.findIndex((p) => p.id === activeTimelinePointId);
      // If not found or if there are duplicates, try to find by matching the current active point
      if (currentIndex === -1) {
        // Try to find by matching the active point's position or other attributes
        console.warn("⚠️ Could not find timeline point by ID, trying fallback");
      }
    }

    console.log("📍 Current timeline state:", {
      currentIndex,
      activeTimelinePointId,
      pointsLength: points.length,
      pointIds: points.map(p => p.id),
      hasDuplicates: new Set(points.map(p => p.id)).size !== points.length
    });

    // Calculate new index
    let newIndex: number;
    if (direction === "next") {
      newIndex = currentIndex < points.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : points.length - 1;
    }

    if (newIndex < 0 || newIndex >= points.length) {
      console.warn("⚠️ Invalid timeline point index:", newIndex, {
        pointsLength: points.length,
        currentIndex
      });
      return;
    }

    // Check for duplicate IDs - if the new point has the same ID as current, use index-based navigation
    const newPoint = points[newIndex];
    const newPointId = newPoint?.id;
    
    if (!newPointId) {
      console.warn("⚠️ Timeline point at index", newIndex, "has no id", {
        point: newPoint
      });
      return;
    }

    // If navigating to a point with the same ID (duplicate), force update by using index in the ID
    // This ensures the state actually changes even with duplicate IDs
    const finalPointId = (newPointId === activeTimelinePointId && currentIndex !== newIndex)
      ? `${newPointId}-index-${newIndex}` // Add index suffix to force state change
      : newPointId;

    console.log(`🔄 Navigating timeline: ${direction}, from index ${currentIndex} to ${newIndex}, point ID: ${newPointId}${finalPointId !== newPointId ? ` (using ${finalPointId} to handle duplicate)` : ''}`);
    
    set({ 
      activeTimelinePointId: finalPointId,
      timelinePointClickCounter: timelinePointClickCounter + 1 // Increment counter to force re-render
    });
    
    // If we used an index-suffixed ID, also update the actual point ID in the store for future lookups
    // But first, we need to find the point by index when looking it up later
    // This is a workaround for duplicate IDs - ideally they should be fixed in the admin panel
  },
  playTimeline: () => {
    set({ isTimelinePlaying: true });
  },
  pauseTimeline: () => {
    set({ isTimelinePlaying: false });
  },
  togglePlayTimeline: () => {
    set((state) => ({ isTimelinePlaying: !state.isTimelinePlaying }));
  },
  resetTimeline: () => {
    const { activeEvent } = get();
    if (activeEvent?.timelinePoints?.length) {
      set({
        activeTimelinePointId: activeEvent.timelinePoints[0].id,
        isTimelinePlaying: false,
      });
    }
  },
  setTimelinePlaySpeed: (speed) => {
    set({ timelinePlaySpeed: speed });
  },
  setGeoData: (data) =>
    set({
      markers: data.markers,
      highlighted: data.highlighted,
      connections: data.connections,
      drawnShapes: data.drawnShapes,
      centroids: data.centroids,
      countriesInUnifiedAreas: data.countriesInUnifiedAreas,
      isLoadingGeoData: data.isLoading,
      geoDataError: data.error,
    }),
}));


