"use client";

import { useState } from "react";
import { EventData, TimelinePoint, CountryIcon } from "@/data/events";
import { Plus, Trash2, Edit2, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { getCountryCoordinates, COUNTRY_COORDINATES } from "@/lib/country-coordinates";

interface TimelineBuilderProps {
  event: Partial<EventData>;
  setEvent: (event: Partial<EventData>) => void;
}

// Map event types to icon types
function getIconTypeFromEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    military: "shield",        // Military events → Shield icon
    diplomatic: "flag",         // Diplomatic events → Flag icon
    economic: "building",      // Economic events → Building icon
    ideological: "users",      // Ideological events → Users icon (people/community)
    technological: "zap",      // Technological events → Zap icon (lightning/energy)
    mixed: "globe",            // Mixed events → Globe icon
  };
  return mapping[eventType] || "map-pin"; // Default to map-pin
}

export function TimelineBuilder({ event, setEvent }: TimelineBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newPoint, setNewPoint] = useState<Partial<TimelinePoint>>({
    id: "",
    label: "",
    date: "",
    year: "",
    description: "",
    position: 0,
    isTurningPoint: false,
    eventType: "diplomatic",
  });
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const timelinePoints = event.timelinePoints || [];

  const handleAddPoint = () => {
    if (!newPoint.label || !newPoint.date) {
      alert("Please fill in at least Label and Date");
      return;
    }
    
    if (!selectedCountry || !selectedCountry.trim()) {
      alert("Please select a country. This field is required.");
      return;
    }

    const pointId = newPoint.id || `point-${Date.now()}`;
    const point: TimelinePoint = {
      id: pointId,
      label: newPoint.label,
      date: newPoint.date,
      year: newPoint.year || "",
      description: newPoint.description || "",
      position: newPoint.position || 0,
      isTurningPoint: newPoint.isTurningPoint || false,
      eventType: newPoint.eventType || "diplomatic",
      relevantTheories: [],
      icon: newPoint.icon || "clock",
      focusLocation: newPoint.focusLocation,
      focusZoom: newPoint.focusZoom,
      mapData: newPoint.mapData,
    };

    // If a country is selected, create/update a country icon linked to this timeline point
    const updatedCountryIcons = [...(event.countryIcons || [])];
    if (selectedCountry && selectedCountry.trim()) {
      const countryName = selectedCountry.trim();
      const coords = getCountryCoordinates(countryName);

      if (coords) {
        // Check if an icon already exists for this timeline point
        const existingIconIndex = updatedCountryIcons.findIndex(
          icon => icon.timelinePointId === pointId
        );

        const iconType = getIconTypeFromEventType(point.eventType || "diplomatic");
        console.log(`🎯 Creating icon for event type "${point.eventType}" → icon type "${iconType}"`);
        
        const newIcon: CountryIcon = {
          id: existingIconIndex >= 0
            ? updatedCountryIcons[existingIconIndex].id
            : `icon-${Date.now()}`,
          country: countryName,
          iconType: iconType, // Map event type to icon type
          coordinates: coords,
          title: point.label, // Use timeline point label as icon title
          description: point.description || "", // Use timeline point description
          timelinePointId: pointId, // REQUIRED: Link to this timeline point
        };
        
        console.log("✅ Created icon:", { id: newIcon.id, country: newIcon.country, iconType: newIcon.iconType, timelinePointId: newIcon.timelinePointId });

        if (existingIconIndex >= 0) {
          updatedCountryIcons[existingIconIndex] = newIcon;
        } else {
          updatedCountryIcons.push(newIcon);
        }
      } else {
        console.warn(`Could not find coordinates for country: ${countryName}`);
      }
    }

    const updatedEvent = {
      ...event,
      timelinePoints: [...timelinePoints, point],
      countryIcons: updatedCountryIcons,
    };
    
    setEvent(updatedEvent);
    
    // Also update the event store immediately so icons appear on the map right away
    // (without waiting for save)
    if (typeof window !== 'undefined') {
      import("@/stores/useEventStore").then(({ useEventStore }) => {
        const store = useEventStore.getState();
        // Only update if this is the currently active event
        if (store.activeEvent && (store.activeEvent.id === event.id || store.activeEvent.id?.startsWith(event.id || ''))) {
          console.log("🔄 Updating active event in store with new icons...", {
            storeEventId: store.activeEvent.id,
            editingEventId: event.id,
            iconsCount: updatedCountryIcons.length
          });
          // Update the store's activeEvent directly
          useEventStore.setState({ activeEvent: updatedEvent as any });
        }
      }).catch(console.error);
    }

    // Reset form but keep position incrementing for convenience
    const nextPosition = timelinePoints.length > 0
      ? Math.min(100, Math.max(...timelinePoints.map(p => p.position || 0)) + 10)
      : 0;

    setNewPoint({
      id: "",
      label: "",
      date: "",
      year: "",
      description: "",
      position: nextPosition,
      isTurningPoint: false,
      eventType: "diplomatic",
    });
    setSelectedCountry(""); // Reset country selection
  };

  const handleUpdatePoint = (index: number, field: string, value: any) => {
    const updated = [...timelinePoints];
    (updated[index] as any)[field] = value;
    const point = updated[index];

    // If updating a timeline point label, description, or eventType, also update linked icon if it exists
    if (point && (field === "label" || field === "description" || field === "eventType")) {
      const updatedIcons = [...(event.countryIcons || [])];
      const iconIndex = updatedIcons.findIndex(icon => icon.timelinePointId === point.id);
      if (iconIndex >= 0) {
        updatedIcons[iconIndex] = {
          ...updatedIcons[iconIndex],
          title: field === "label" ? value : updatedIcons[iconIndex].title,
          description: field === "description" ? value : updatedIcons[iconIndex].description,
          iconType: field === "eventType" ? getIconTypeFromEventType(value) : updatedIcons[iconIndex].iconType,
        };
        setEvent({ ...event, timelinePoints: updated, countryIcons: updatedIcons });
        // Also update the event store immediately so icons update on the map right away
        if (typeof window !== 'undefined') {
          import("@/stores/useEventStore").then(({ useEventStore }) => {
            const store = useEventStore.getState();
            if (store.activeEvent && (store.activeEvent.id === event.id || store.activeEvent.id?.startsWith(event.id || ''))) {
              // Update activeEvent directly with new countryIcons
              useEventStore.setState({
                activeEvent: {
                  ...store.activeEvent,
                  countryIcons: updatedIcons,
                },
              });
            }
          }).catch(console.error);
        }
        return;
      }
    }

    setEvent({ ...event, timelinePoints: updated });
  };

  const handleDeletePoint = (index: number) => {
    if (confirm("Are you sure you want to delete this timeline point?")) {
      const updated = timelinePoints.filter((_, i) => i !== index);
      setEvent({ ...event, timelinePoints: updated });
    }
  };

  const handleEditPoint = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Timeline Points</h2>
        <p className="text-gray-600 mt-1">
          Add and manage timeline points for this event. Each point represents a key moment in the timeline.
        </p>
      </div>

      {/* Add New Point Form */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Timeline Point</h3>
          <span className="text-sm text-gray-500">
            {timelinePoints.length} point{timelinePoints.length !== 1 ? 's' : ''} added
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Fill in the form below and click "Add Timeline Point" to add it to your timeline. You can add as many points as needed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Point ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPoint.id || ""}
              onChange={(e) => setNewPoint({ ...newPoint, id: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-800 text-white"
              placeholder="truman-doctrine-1947"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Label/Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPoint.label || ""}
              onChange={(e) => setNewPoint({ ...newPoint, label: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white"
              placeholder="Truman Doctrine Announced"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPoint.date || ""}
              onChange={(e) => setNewPoint({ ...newPoint, date: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white"
              placeholder="March 12, 1947"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Year</label>
            <input
              type="text"
              value={newPoint.year || ""}
              onChange={(e) => setNewPoint({ ...newPoint, year: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white"
              placeholder="1947"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Event Type</label>
            <select
              value={newPoint.eventType || "diplomatic"}
              onChange={(e) => setNewPoint({ ...newPoint, eventType: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white"
            >
              <option value="military">Military</option>
              <option value="diplomatic">Diplomatic</option>
              <option value="economic">Economic</option>
              <option value="ideological">Ideological</option>
              <option value="technological">Technological</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white"
              placeholder="Type to search countries..."
              list="countries-list"
              required
            />
            <datalist id="countries-list">
              {(() => {
                // Get all unique country names from COUNTRY_COORDINATES
                // Exclude only very short aliases (USA, US, UK)
                const shortAliases = new Set(['USA', 'US', 'UK']);
                const allCountries = Object.keys(COUNTRY_COORDINATES)
                  .filter(key => !shortAliases.has(key))
                  .sort();
                
                return allCountries.map(country => (
                  <option key={country} value={country} />
                ));
              })()}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              Select the country where this event occurred. An icon will be placed on the map. <span className="text-red-500">Required</span>
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-200">Position (0-100)</label>
            <div className="number-input-wrapper">
              <input
                type="number"
                min="0"
                max="100"
                value={newPoint.position || 0}
                onChange={(e) => setNewPoint({ ...newPoint, position: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-slate-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900"
              />
              <div className="number-spinner">
                <button
                  type="button"
                  className="number-spinner-button"
                  onClick={() => {
                    const current = newPoint.position || 0;
                    if (current < 100) {
                      setNewPoint({ ...newPoint, position: Math.min(100, current + 1) });
                    }
                  }}
                  disabled={(newPoint.position || 0) >= 100}
                >
                  <ChevronUp />
                </button>
                <button
                  type="button"
                  className="number-spinner-button"
                  onClick={() => {
                    const current = newPoint.position || 0;
                    if (current > 0) {
                      setNewPoint({ ...newPoint, position: Math.max(0, current - 1) });
                    }
                  }}
                  disabled={(newPoint.position || 0) <= 0}
                >
                  <ChevronDown />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">Controls order on timeline</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <RichTextEditor
            content={newPoint.description || ""}
            onChange={(content) => setNewPoint({ ...newPoint, description: content })}
            placeholder="Description of this timeline point..."
          />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newPoint.isTurningPoint || false}
              onChange={(e) => setNewPoint({ ...newPoint, isTurningPoint: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Is Turning Point</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddPoint}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl font-semibold"
            type="button"
          >
            <Plus className="w-5 h-5" />
            Add Timeline Point
          </button>
          <span className="text-sm text-gray-600">
            Form will reset after adding. You can add multiple points!
          </span>
        </div>
      </div>

      {/* Timeline Points List */}
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Timeline Points ({timelinePoints.length})
          </h3>
          {timelinePoints.length > 0 && (
            <span className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              ✓ {timelinePoints.length} point{timelinePoints.length !== 1 ? 's' : ''} added
            </span>
          )}
        </div>
        {timelinePoints.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <p className="text-gray-500 font-medium mb-2">No timeline points yet</p>
            <p className="text-sm text-gray-400">Use the form above to add your first timeline point</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              {timelinePoints.map((point, index) => (
                <div
                  key={point.id}
                  className="border border-gray-200 rounded-xl p-5 bg-white hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {editingIndex === index ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                          <input
                            type="text"
                            value={point.label}
                            onChange={(e) => handleUpdatePoint(index, "label", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="text"
                            value={point.date}
                            onChange={(e) => handleUpdatePoint(index, "date", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <RichTextEditor
                          content={point.description || ""}
                          onChange={(content) => handleUpdatePoint(index, "description", content)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          type="button"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          type="button"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{point.label}</h4>
                          <p className="text-sm text-gray-600 mt-1">{point.date}</p>
                          {point.description && (
                            <div
                              className="text-sm text-gray-700 mt-2 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: point.description }}
                            />
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {point.eventType}
                            </span>
                            {point.isTurningPoint && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                Turning Point
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditPoint(index)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            type="button"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePoint(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Another Point Button - Shows after first point is added */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <button
                  onClick={() => {
                    // Scroll to the form at the top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Focus on the first input after a short delay
                    setTimeout(() => {
                      const firstInput = document.querySelector('input[placeholder="truman-doctrine-1947"]') as HTMLInputElement;
                      if (firstInput) {
                        firstInput.focus();
                      }
                    }, 500);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl w-full sm:w-auto"
                  type="button"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Timeline Point
                </button>
                <p className="text-sm text-gray-600 mt-3">
                  💡 Click to scroll back to the form and add another point to your timeline.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
