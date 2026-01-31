"use client";

import { create } from "zustand";
import { EVENTS_DATA, EventData } from "@/data/events";
import { MarkerData } from "@/components/marker";
import { loadAllEventsFromStorage, loadEventFromStorage, getBaseEventId, createEventIdWithTheory } from "@/lib/admin-utils";

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
  isTimelinePlaying: false,
  timelinePlaySpeed: 4000, // 4 seconds per point
  selectEvent: async (eventId, theoryId?: string | null) => {
    // If theory is provided, try to find the theory-specific version
    let event: EventData | null = null;
    let finalEventId = eventId;
    
    if (theoryId) {
      // Try to find theory-specific version
      const theorySpecificId = createEventIdWithTheory(getBaseEventId(eventId), theoryId);
      const storedTheoryEvent = await loadEventFromStorage(theorySpecificId);
      if (storedTheoryEvent) {
        event = storedTheoryEvent;
        finalEventId = theorySpecificId;
      } else {
        // Fallback: try to find any version of this event and use it
        // (user might be selecting a theory for an event that doesn't have that theory yet)
        const baseId = getBaseEventId(eventId);
        const allEvents = await loadAllEventsFromStorage();
        const eventVersions = allEvents.filter(e => getBaseEventId(e.id) === baseId);
        
        if (eventVersions.length > 0) {
          // Use the first available version, or try to find one matching the theory
          const theoryMatch = eventVersions.find(e => e.theory === theoryId);
          event = theoryMatch || eventVersions[0];
          finalEventId = event.id;
        } else {
          // Check static data
          const staticEvent = EVENTS_DATA.find((e) => {
            const staticBaseId = getBaseEventId(e.id);
            return staticBaseId === baseId;
          });
          if (staticEvent) {
            event = staticEvent;
            finalEventId = staticEvent.id;
          }
        }
      }
    } else {
      // No theory specified, just load by ID
      const storedEvent = await loadEventFromStorage(eventId);
      if (storedEvent) {
        event = storedEvent;
      } else {
        // Fallback to static data
        event = EVENTS_DATA.find((e) => e.id === eventId) || null;
      }
    }
    
    // Set first timeline point as active when event is selected
    const firstPointId = event?.timelinePoints?.[0]?.id || null;
    set({ 
      activeEventId: finalEventId, 
      activeEvent: event,
      activeTimelinePointId: firstPointId,
    });
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
    const { activeEvent, activeTimelinePointId } = get();
    if (!activeEvent?.timelinePoints) return;

    const points = activeEvent.timelinePoints;
    const currentIndex = activeTimelinePointId
      ? points.findIndex((p) => p.id === activeTimelinePointId)
      : -1;

    let newIndex: number;
    if (direction === "next") {
      newIndex = currentIndex < points.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : points.length - 1;
    }

    set({ activeTimelinePointId: points[newIndex].id });
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


