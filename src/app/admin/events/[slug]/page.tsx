"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, Map, FileText, Clock, Lightbulb, X, BarChart3 } from "lucide-react";
import Link from "next/link";
import { EventData } from "@/data/events";
import { VisualMapEditor } from "@/components/admin/VisualMapEditor";
import { BasicInfoTab } from "@/components/admin/BasicInfoTab";
import { TimelineBuilder } from "@/components/admin/TimelineBuilder";
import { StatisticsTab } from "@/components/admin/StatisticsTab";
import { saveEventToStorage, saveEventToAPI, loadEventFromAPI, getBaseEventId, createEventIdWithTheory, loadEventFromStorage } from "@/lib/admin-utils";
import { unifiedAreasToIcons } from "@/lib/unified-area-utils";
import { THEORY_COLORS, THEORY_COLORS_DARK } from "@/lib/theoryTokens";
import { useAuthStore } from "@/stores/useAuthStore";

const THEORIES = [
  { id: "realism", name: "Classical Realism", editorId: "classical-realism" },
  { id: "neorealism", name: "Structural Realism", editorId: "structural-realism" },
  { id: "liberalism", name: "Liberalism", editorId: "liberalism" },
  { id: "neoliberal", name: "Neoliberalism", editorId: "neoliberalism" },
  { id: "englishschool", name: "English School", editorId: "english-school" },
  { id: "constructivism", name: "Constructivism", editorId: "constructivism" },
];

export default function EventEditor() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const slug = params.slug as string;
  const isNew = slug === "new";

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  const [event, setEvent] = useState<Partial<EventData>>({
    id: "",
    title: "",
    description: "",
    fullDescription: "",
    highlightedCountries: [],
    connections: [],
    unifiedAreas: [],
    timelinePoints: [],
    countryIcons: [],
  });

  const [activeTab, setActiveTab] = useState<"info" | "map" | "timeline" | "statistics">("info");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showTheorySelector, setShowTheorySelector] = useState(isNew && !event.theory);

  useEffect(() => {
    if (!isNew) {
      setIsLoading(true);
      const loadEvent = async () => {
        try {
          // Try API first
          const apiEvent = await loadEventFromAPI(slug);
          if (apiEvent) {
            setEvent(apiEvent);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn("API not available, trying localStorage");
        }

        // Try Supabase/localStorage
        const storedEvent = await loadEventFromStorage(slug);
        if (storedEvent) {
          setEvent(storedEvent);
          setIsLoading(false);
          return;
        }

        // Fallback to static data
        import("@/data/events").then((module) => {
          const found = module.EVENTS_DATA.find((e) => e.id === slug);
          if (found) {
            setEvent(found);
          }
          setIsLoading(false);
        });
      };

      loadEvent();
    }
  }, [slug, isNew]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    // Validate required fields including theory
    if (!event.id || !event.title || !event.description || !event.fullDescription) {
      setSaveMessage({ type: "error", text: "Please fill in all required fields (ID, Title, Description, Full Description)" });
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    if (!event.theory) {
      setSaveMessage({ type: "error", text: "Please select a theory perspective for this event." });
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    try {
      // Ensure event ID includes theory if theory is set
      let finalEvent = { ...event } as EventData;
      if (finalEvent.theory && finalEvent.id) {
        const baseId = getBaseEventId(finalEvent.id);
        // Only add theory suffix if it's not already there
        if (!finalEvent.id.includes(`-${finalEvent.theory}`)) {
          finalEvent.id = createEventIdWithTheory(baseId, finalEvent.theory);
        }
      }

      // Convert unified areas with timeline settings to icons
      if (finalEvent.unifiedAreas && finalEvent.unifiedAreas.length > 0) {
        // Remove old unified area icons
        const existingIcons = finalEvent.countryIcons || [];
        const filteredIcons = existingIcons.filter(icon => !icon.id.startsWith('unified-area-'));
        
        // Generate new icons from unified areas
        const unifiedAreaIcons = unifiedAreasToIcons(finalEvent.unifiedAreas);
        
        // Merge with existing icons
        finalEvent.countryIcons = [...filteredIcons, ...unifiedAreaIcons];
        
        console.log(`✅ Converted ${unifiedAreaIcons.length} unified areas to timeline icons`);
      }

      // Save directly to Supabase (skip API endpoint)
      console.log("💾 Attempting to save event to Supabase:", {
        eventId: finalEvent.id,
        eventTitle: finalEvent.title,
        theory: finalEvent.theory
      });
      
      try {
        await saveEventToStorage(finalEvent);
        setIsSaving(false);
        setSaveMessage({ type: "success", text: "✅ Event saved successfully to Supabase database!" });
        
        // Reload the event in the store so the map shows updated icons immediately
        const { useEventStore } = await import("@/stores/useEventStore");
        const store = useEventStore.getState();
        if (store.activeEventId === finalEvent.id || getBaseEventId(store.activeEventId || '') === getBaseEventId(finalEvent.id)) {
          console.log("🔄 Reloading event in store to show updated icons...");
          await store.selectEvent(finalEvent.id, finalEvent.theory);
        }
        
        // Redirect to dashboard to see the new event
        setTimeout(() => {
          router.push("/admin");
        }, 1500);
      } catch (storageError: any) {
        console.error("❌ Error saving to Supabase:", storageError);
        const errorMessage = storageError?.message || String(storageError);
        
        if (errorMessage.includes("Failed to save to Supabase") || errorMessage.includes("environment variables not loaded")) {
          setIsSaving(false);
          setSaveMessage({ 
            type: "error", 
            text: `⚠️ Failed to save to Supabase. Event saved to browser storage only. Check console for details.` 
          });
          console.error("Full error details:", {
            message: errorMessage,
            error: storageError,
            eventId: finalEvent.id
          });
        } else {
          setIsSaving(false);
          setSaveMessage({ 
            type: "error", 
            text: `Error saving event: ${errorMessage}` 
          });
          console.error("Unexpected error:", storageError);
        }
        setTimeout(() => setSaveMessage(null), 10000);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      setSaveMessage({ type: "error", text: "Error saving event. Please try again." });
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Theory selector modal
  const handleTheorySelect = (theoryId: string) => {
    setEvent({ ...event, theory: theoryId as any });
    setShowTheorySelector(false);
  };

  const tabs = [
    { id: "info", label: "Basic Information", icon: FileText },
    { id: "map", label: "Map Highlights", icon: Map },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-[3px] border-blue-500 border-t-transparent mb-4 shadow-lg shadow-blue-500/50"></div>
          <div className="text-gray-300 font-medium text-sm tracking-wide uppercase animate-pulse">Loading event...</div>
        </div>
      </div>
    );
  }

  // Show theory selector modal for new events
  if (showTheorySelector && isNew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-2xl p-8 max-w-3xl w-full animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Select Theory Perspective</h1>
            <p className="text-gray-300">
              Choose which IR theory perspective you'll use to analyze this event.
              All event details (map highlights, timeline, descriptions) will be created from this theory's viewpoint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {THEORIES.map((theory) => {
              const theoryColor = THEORY_COLORS[theory.id as keyof typeof THEORY_COLORS];
              const theoryDarkColor = THEORY_COLORS_DARK[theory.id as keyof typeof THEORY_COLORS_DARK];

              return (
                <button
                  key={theory.id}
                  onClick={() => handleTheorySelect(theory.id)}
                  className="relative p-6 rounded-xl border-2 border-slate-600/50 bg-slate-700/30 hover:border-blue-500 hover:bg-blue-500/20 transition-all duration-300 text-left group hover:scale-105"
                >
                  {/* Theory Color Indicator */}
                  <div
                    className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                    style={{ backgroundColor: theoryColor }}
                  />

                  <div className="pl-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                      {theory.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Analyze this event from the {theory.name.toLowerCase()} perspective
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Link
              href="/admin"
              className="px-6 py-3 bg-slate-700/80 text-gray-300 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 backdrop-blur-md border-b border-slate-600/50 sticky top-0 z-30 transition-all shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Save Message */}
          {saveMessage && (
            <div className={`mb-4 p-4 rounded-lg border backdrop-blur-sm flex items-center gap-3 text-sm font-medium animate-slideDown ${saveMessage.type === "success"
              ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/20"
              : "bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50 text-red-200 shadow-lg shadow-red-500/20"
              }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${saveMessage.type === "success" ? "bg-emerald-500/30 text-emerald-300" : "bg-red-500/30 text-red-300"
                }`}>
                {saveMessage.type === "success" ? (
                  <span className="text-sm font-bold">✓</span>
                ) : (
                  <span className="text-sm font-bold">✕</span>
                )}
              </div>
              {saveMessage.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="group p-2 -ml-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300 hover:scale-110"
                title="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {isNew ? "Create New Event" : event.title || "Edit Event"}
                  </h1>
                  {event.theory && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold border-2"
                      style={{
                        backgroundColor: `${THEORY_COLORS_DARK[event.theory]}40`,
                        borderColor: THEORY_COLORS[event.theory],
                        color: THEORY_COLORS[event.theory],
                      }}
                    >
                      {THEORIES.find(t => t.id === event.theory)?.name || event.theory}
                    </span>
                  )}
                  {!isNew && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-[10px] font-mono text-gray-300">
                      {event.id}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 mt-0.5">
                  {isNew
                    ? `Creating event from ${event.theory ? THEORIES.find(t => t.id === event.theory)?.name : ""} perspective. Configure the details below.`
                    : `Update event details, map highlights, and timeline from the ${event.theory ? THEORIES.find(t => t.id === event.theory)?.name : ""} perspective.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="save-button-blue-gradient inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/50 font-medium text-sm hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save
                className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`}
              />
              <span>
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-600/50 sticky top-[73px] z-20 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group flex items-center gap-2 py-4 border-b-2 font-medium transition-all duration-300 whitespace-nowrap text-sm relative ${isActive
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-600/50 overflow-hidden min-h-[400px] animate-fadeIn">
          {activeTab === "info" && (
            <BasicInfoTab event={event} setEvent={setEvent} />
          )}
          {activeTab === "map" && (
            <VisualMapEditor event={event} setEvent={setEvent} />
          )}
          {activeTab === "timeline" && (
            <TimelineBuilder event={event} setEvent={setEvent} />
          )}
          {activeTab === "statistics" && (
            <StatisticsTab event={event} setEvent={setEvent} />
          )}
        </div>
      </div>
    </div>
  );
}
