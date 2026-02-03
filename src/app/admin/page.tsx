"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Eye, MapPin, RefreshCw, Calendar, FileText, Clock, Sparkles, Trash2, X, LogOut, User } from "lucide-react";
import { EventData } from "@/data/events";
import {
  loadAllEventsFromStorage,
  deleteEventFromStorage,
  getEventsGroupedByBase,
  getBaseEventId,
  getTheoriesForBaseEvent,
  duplicateEventForNewTheory,
  saveEventToStorage,
  createEventIdWithTheory
} from "@/lib/admin-utils";
import { THEORY_COLORS, THEORY_COLORS_DARK } from "@/lib/theoryTokens";
import { useAuthStore } from "@/stores/useAuthStore";

const THEORIES = [
  { id: "realism", name: "Classical Realism" },
  { id: "neorealism", name: "Structural Realism" },
  { id: "liberalism", name: "Liberalism" },
  { id: "neoliberal", name: "Neoliberalism" },
  { id: "englishschool", name: "English School" },
  { id: "constructivism", name: "Constructivism" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, getCurrentUser, logout } = useAuthStore();
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const [showAddTheoryModal, setShowAddTheoryModal] = useState(false);
  const [selectedBaseEvent, setSelectedBaseEvent] = useState<EventData | null>(null);
  const [existingTheoriesForSelected, setExistingTheoriesForSelected] = useState<string[]>([]);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  const loadEvents = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4947b7ed-4136-4ff9-a241-fb1ba4b196f0', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'admin/page.tsx:38', message: 'loadEvents called', data: { timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion
    try {
      // Try API first
      const apiResponse = await fetch("/api/events");
      if (apiResponse.ok) {
        const apiEvents = await apiResponse.json();
        if (apiEvents && apiEvents.length > 0) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/4947b7ed-4136-4ff9-a241-fb1ba4b196f0', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'admin/page.tsx:45', message: 'Events loaded from API', data: { count: apiEvents.length, events: apiEvents.map((e: EventData) => ({ id: e.id, title: e.title, theory: e.theory })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
          // #endregion
          setEvents(apiEvents);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        // If API returns empty array, continue to Supabase/static fallback
      }
    } catch (error) {
      console.warn("API not available, trying Supabase and static data");
    }

    // Try Supabase/localStorage (where events are saved)
    const storedEvents = await loadAllEventsFromStorage();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4947b7ed-4136-4ff9-a241-fb1ba4b196f0', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'admin/page.tsx:57', message: 'Events loaded from Supabase/localStorage', data: { count: storedEvents.length, events: storedEvents.map((e: EventData) => ({ id: e.id, title: e.title, theory: e.theory })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion

    // Load static data and merge
    try {
      const eventsModule = await import("@/data/events");
      const staticEvents = eventsModule.EVENTS_DATA || [];

      // Merge with Supabase/localStorage events (stored events take priority)
      let allEvents: EventData[] = [];
      if (storedEvents && storedEvents.length > 0) {
        // Get all base IDs from stored events
        const storedBaseIds = new Set(storedEvents.map((e: EventData) => getBaseEventId(e.id)));
        
        // Filter static events:
        // 1. Exclude if exact ID matches a stored event
        // 2. Exclude if static event has a theory AND we already have stored events for that base ID
        const uniqueStaticEvents = staticEvents.filter((e: EventData) => {
          // Skip if exact ID matches
          if (storedEvents.some((se: EventData) => se.id === e.id)) {
            return false;
          }
          
          // Skip if static event has a theory and we have stored events for this base ID
          const staticBaseId = getBaseEventId(e.id);
          if (e.theory && storedBaseIds.has(staticBaseId)) {
            return false;
          }
          
          return true;
        });
        
        allEvents = [...storedEvents, ...uniqueStaticEvents];
      } else {
        // No stored events, just use static
        allEvents = staticEvents;
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4947b7ed-4136-4ff9-a241-fb1ba4b196f0', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'admin/page.tsx:71', message: 'Final merged events before setState', data: { count: allEvents.length, events: allEvents.map((e: EventData) => ({ id: e.id, title: e.title, normalizedTitle: (e.title || '').toLowerCase().trim(), theory: e.theory })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
      // #endregion

      // Always set events - even if empty, we want to show the current state
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading static events:", error);
      // If static events fail, use whatever is in Supabase/localStorage
      if (storedEvents && storedEvents.length > 0) {
        setEvents(storedEvents);
      } else {
        // Only clear events if we're sure there are none
        setEvents([]);
      }
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadEvents();

    // Listen for storage changes to refresh the list
    const handleStorageChange = async () => {
      try {
        const storedEvents = await loadAllEventsFromStorage();
        // Merge with static events when storage changes
        const eventsModule = await import("@/data/events");
        const staticEvents = eventsModule.EVENTS_DATA || [];
        if (storedEvents && storedEvents.length > 0) {
          // Get all base IDs from stored events
          const storedBaseIds = new Set(storedEvents.map((e: EventData) => getBaseEventId(e.id)));
          
          // Filter static events:
          // 1. Exclude if exact ID matches a stored event
          // 2. Exclude if static event has a theory AND we already have stored events for that base ID
          const uniqueStaticEvents = staticEvents.filter((e: EventData) => {
            // Skip if exact ID matches
            if (storedEvents.some((se: EventData) => se.id === e.id)) {
              return false;
            }
            
            // Skip if static event has a theory and we have stored events for this base ID
            const staticBaseId = getBaseEventId(e.id);
            if (e.theory && storedBaseIds.has(staticBaseId)) {
              return false;
            }
            
            return true;
          });
          
          const allEvents = [...storedEvents, ...uniqueStaticEvents];
          setEvents(allEvents);
        } else if (staticEvents.length > 0) {
          setEvents(staticEvents);
        }
      } catch (error) {
        console.error("Error in handleStorageChange:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically (for same-tab updates) - but skip if refreshing
    const interval = setInterval(async () => {
      // Don't interfere with manual refresh
      if (isRefreshingRef.current) {
        return;
      }

      try {
        const storedEvents = await loadAllEventsFromStorage();
        // Merge with static events to maintain consistency
        const eventsModule = await import("@/data/events");
        const staticEvents = eventsModule.EVENTS_DATA || [];
        if (storedEvents && storedEvents.length > 0) {
          const uniqueStaticEvents = staticEvents.filter(
            (e: EventData) => !storedEvents.some((se: EventData) => se.id === e.id)
          );
          const allEvents = [...storedEvents, ...uniqueStaticEvents];
          setEvents(allEvents);
        } else if (staticEvents.length > 0) {
          setEvents(staticEvents);
        }
      } catch (error) {
        console.error("Error in periodic check:", error);
      }
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    // Load events - current events will stay visible until new ones are loaded
    await loadEvents();
    isRefreshingRef.current = false;
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      try {
        await deleteEventFromStorage(eventId);
        // Remove from current state
        setEvents(events.filter(e => e.id !== eventId));
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  const handleAddTheory = async (baseEvent: EventData) => {
    setSelectedBaseEvent(baseEvent);
    setShowAddTheoryModal(true);
    // Load existing theories for this event
    const baseId = getBaseEventId(baseEvent.id);
    const theories = await getTheoriesForBaseEvent(baseId);
    setExistingTheoriesForSelected(theories);
  };

  const handleSelectTheory = async (theoryId: string) => {
    if (!selectedBaseEvent) return;

    try {
      // Check if this theory already exists for this base event
      const baseId = getBaseEventId(selectedBaseEvent.id);
      const existingTheories = await getTheoriesForBaseEvent(baseId);

      if (existingTheories.includes(theoryId)) {
        alert(`This theory already exists for this event. Please select a different theory.`);
        return;
      }

      // Create new event with selected theory
      const newEvent = duplicateEventForNewTheory(selectedBaseEvent, theoryId);
      await saveEventToStorage(newEvent);

      // Refresh events
      loadEvents();

      // Close modal and navigate to edit the new event
      setShowAddTheoryModal(false);
      setSelectedBaseEvent(null);
      router.push(`/admin/events/${newEvent.id}`);
    } catch (error) {
      console.error("Error creating new theory:", error);
      alert("Failed to create new theory. Please try again.");
    }
  };

  const totalCountries = events.reduce((sum, e) => sum + (e.highlightedCountries?.length || 0), 0);
  const totalTimelinePoints = events.reduce((sum, e) => sum + (e.timelinePoints?.length || 0), 0);

  // Memoize grouped events to prevent unnecessary recalculations and duplicate renders
  const groupedBaseEvents = useMemo(() => {
    // GROUP BY BASE ID: This is more reliable than title
    const grouped = new Map<string, EventData[]>();

    events.forEach((event) => {
      const baseId = getBaseEventId(event.id);

      if (!grouped.has(baseId)) {
        grouped.set(baseId, []);
      }

      const existing = grouped.get(baseId)!;
      // Prevent exact duplicates (same ID)
      if (!existing.some(e => e.id === event.id)) {
        existing.push(event);
      }
    });

    // Convert to array
    const baseEvents = Array.from(grouped.entries()).map(([baseId, eventList]) => {
      // Sort: Base event (no theory or matching baseID) first, then theories
      const sortedEvents = [...eventList].sort((a, b) => {
        const aIsBase = a.id === baseId;
        const bIsBase = b.id === baseId;

        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;
        return 0;
      });

      const representative = sortedEvents[0];
      const normalizedTitle = (representative.title || '').toLowerCase().trim();

      const theories = Array.from(new Set(
        eventList
          .filter(e => e.theory)
          .map(e => e.theory!)
      ));

      return {
        baseId,
        normalizedTitle,
        representative,
        theories,
        allEvents: eventList
      };
    });

    return baseEvents;
  }, [events]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-[3px] border-blue-500 border-t-transparent mb-4 shadow-lg shadow-blue-500/50"></div>
          <div className="text-gray-300 font-medium text-sm tracking-wide uppercase animate-pulse">Loading System</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 animate-fadeIn">
      {/* Animated decorative top border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-slideDown">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-3 flex items-center gap-3 animate-fadeIn">
              <span className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/50 animate-pulse-slow">
                <Sparkles className="w-6 h-6 text-white" />
              </span>
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Event Management
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-gray-200 rounded-lg hover:bg-slate-600 hover:border-slate-500 hover:text-white transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: 'inherit' }} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => router.push("/admin/events/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/50 font-medium text-sm hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total Events", value: events.length, icon: FileText, gradient: "from-blue-500 to-blue-600", bgGradient: "from-blue-500/20 to-blue-600/20", borderColor: "border-blue-500/30" },
            { label: "Highlighted Countries", value: totalCountries, icon: MapPin, gradient: "from-emerald-500 to-emerald-600", bgGradient: "from-emerald-500/20 to-emerald-600/20", borderColor: "border-emerald-500/30" },
            { label: "Timeline Points", value: totalTimelinePoints, icon: Clock, gradient: "from-violet-500 to-violet-600", bgGradient: "from-violet-500/20 to-violet-600/20", borderColor: "border-violet-500/30" }
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-xl shadow-xl border ${stat.borderColor} p-6 flex items-start justify-between group hover:scale-105 transition-all duration-300 animate-slideUp`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">{stat.label}</p>
                <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-600/50 p-16 text-center max-w-2xl mx-auto animate-fadeIn">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-300 mb-8">
              Your dashboard is looking a bit empty. Create your first historical event to get started.
            </p>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/50 font-medium hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Create First Event
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">All Events</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedBaseEvents.map(({ baseId, normalizedTitle, representative, theories, allEvents }, idx) => {
                return (
                  <div
                    key={`event-${baseId}`}
                    className="group relative bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm rounded-xl border border-slate-600/50 shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full animate-slideUp hover:scale-[1.02]"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="p-6 flex-1">
                      <div className="flex flex-col gap-1 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {representative.title}
                          </h3>
                          {theories.length > 0 && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-500/20 border-blue-500 text-blue-400"
                            >
                              {theories.length} {theories.length === 1 ? 'Theory' : 'Theories'}
                            </span>
                          )}
                          {theories.length === 0 && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-gray-500/20 border-gray-500 text-gray-400"
                            >
                              No Theory
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>{representative.date}</span>
                        </div>
                        {theories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {theories.map((theoryId) => {
                              const theory = THEORIES.find(t => t.id === theoryId);
                              return (
                                <span
                                  key={theoryId}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                  style={{
                                    backgroundColor: `${THEORY_COLORS_DARK[theoryId]}40`,
                                    borderColor: THEORY_COLORS[theoryId],
                                    color: THEORY_COLORS[theoryId],
                                  }}
                                >
                                  {theory?.name || theoryId}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {representative.summary && (
                        <p className="text-sm text-gray-300 mb-6 line-clamp-2 leading-relaxed">
                          {representative.summary}
                        </p>
                      )}

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-300 bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>{allEvents.reduce((sum, e) => sum + (e.highlightedCountries?.length || 0), 0)} locations</span>
                      </div>
                      <div className="w-px h-3 bg-slate-600"></div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>{allEvents.reduce((sum, e) => sum + (e.timelinePoints?.length || 0), 0)} points</span>
                      </div>
                    </div>

                    {/* User Tracking Info */}
                    {representative.lastModifiedBy && (
                      <div className="mt-3 text-xs text-gray-400 bg-slate-800/30 rounded-lg p-2 border border-slate-600/20">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-blue-400" />
                          <span>Last modified by: <span className="text-blue-400 font-semibold">{representative.lastModifiedBy.name}</span></span>
                        </div>
                        {representative.updatedAt && (
                          <div className="text-gray-500 mt-1 text-[10px]">
                            {new Date(representative.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    </div>

                    <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-600/50 flex flex-col gap-2 rounded-b-xl">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/admin/events/${representative.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/80 to-blue-600/80 border border-blue-500/50 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 hover:border-blue-400 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Link>

                        <div className="flex gap-2">
                          <Link
                            href={`/?event=${representative.id}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300 border border-transparent hover:border-blue-500/50 hover:scale-110"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(representative.id, representative.title)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 border border-transparent hover:border-red-500/50 hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddTheory(representative)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/80 to-purple-600/80 border border-purple-500/50 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 hover:border-purple-400 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Theory
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Theory Modal */}
      {showAddTheoryModal && selectedBaseEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 border-b border-slate-600/50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Theory</h2>
              <button
                onClick={() => {
                  setShowAddTheoryModal(false);
                  setSelectedBaseEvent(null);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-6">
                Select a theory to analyze <span className="font-semibold text-white">{selectedBaseEvent.title}</span> from a different perspective.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {THEORIES.map((theory) => {
                  const isExisting = existingTheoriesForSelected.includes(theory.id);

                  return (
                    <button
                      key={theory.id}
                      onClick={() => !isExisting && handleSelectTheory(theory.id)}
                      disabled={isExisting}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${isExisting
                        ? 'border-slate-600/30 bg-slate-800/50 opacity-50 cursor-not-allowed'
                        : 'border-slate-600/50 bg-slate-800/30 hover:border-blue-500/50 hover:bg-blue-500/10 hover:scale-105'
                        }`}
                      style={!isExisting ? {
                        borderColor: THEORY_COLORS[theory.id as keyof typeof THEORY_COLORS] + '40',
                      } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: THEORY_COLORS_DARK[theory.id as keyof typeof THEORY_COLORS_DARK] + '40',
                            border: `2px solid ${THEORY_COLORS[theory.id as keyof typeof THEORY_COLORS]}`,
                          }}
                        >
                          <span className="text-lg font-bold" style={{ color: THEORY_COLORS[theory.id as keyof typeof THEORY_COLORS] }}>
                            {theory.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{theory.name}</h3>
                          {isExisting && (
                            <p className="text-xs text-gray-400">Already added</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
