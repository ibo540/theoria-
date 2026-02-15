"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import maplibregl from "maplibre-gl";
import { EventData, UnifiedArea, EventConnection, CountryIcon } from "@/data/events";
import { X, Plus, Trash2, Globe, Shapes, Link as LinkIcon, MapPin, Edit, Save, Shield, Users, Flag, Zap, Building2, Crown, TrendingUp } from "lucide-react";
import { THEORY_COLORS, THEORY_COLORS_DARK, THEORY_LABELS } from "@/lib/theoryTokens";
import { MapDrawingTools } from "./MapDrawingTools";
import { detectCountriesInShape, detectCountriesForLine } from "@/lib/country-detection";
import { getHistoricalMapForEvent, getAvailableHistoricalMaps, mapHistoricalCountryNames } from "@/lib/historical-maps";

// Load map only on client
const MapComponent = dynamic(() => import("./InteractiveMap"), { ssr: false });

interface VisualMapEditorProps {
  event: Partial<EventData>;
  setEvent: (event: Partial<EventData>) => void;
}

interface CountryHighlight {
  name: string;
  color: string;
  appearAtTimelinePoint?: string;
  appearAtYear?: number;
  appearAtPosition?: number;
}

export function VisualMapEditor({ event, setEvent }: VisualMapEditorProps) {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Determine which historical map to use
  const historicalMapConfig = (() => {
    if (!event) {
      return getAvailableHistoricalMaps()[0]; // Default to modern
    }

    // Use explicitly set period, or auto-detect from event date
    if (event.historicalMapPeriod) {
      const period = getAvailableHistoricalMaps().find(p => p.id === event.historicalMapPeriod);
      if (period) return period;
    }

    return getHistoricalMapForEvent(event as any);
  })();

  // Convert countryHighlights or highlightedCountries to map with timing info
  const [countryHighlights, setCountryHighlights] = useState<Map<string, CountryHighlight>>(() => {
    const map = new Map<string, CountryHighlight>();
    const defaultColors = Object.values(THEORY_COLORS_DARK);

    // Use new countryHighlights structure if available
    if (event.countryHighlights && event.countryHighlights.length > 0) {
      event.countryHighlights.forEach((highlight, index) => {
        map.set(highlight.country, {
          name: highlight.country,
          color: highlight.color || defaultColors[index % defaultColors.length],
          appearAtTimelinePoint: highlight.appearAtTimelinePoint,
          appearAtYear: highlight.appearAtYear,
          appearAtPosition: highlight.appearAtPosition,
        });
      });
    } else {
      // Fallback to legacy highlightedCountries
      const countries = event.highlightedCountries || [];
      countries.forEach((country, index) => {
        map.set(country, {
          name: country,
          color: defaultColors[index % defaultColors.length],
        });
      });
    }
    return map;
  });

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showCountryInput, setShowCountryInput] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [editingColorFor, setEditingColorFor] = useState<string | null>(null);
  const [clickedCountry, setClickedCountry] = useState<{ name: string; position: { x: number; y: number } } | null>(null);

  // Map interaction modes
  const [mapMode, setMapMode] = useState<"highlight" | "unified-area" | "connection">("highlight");
  const [selectedCountriesForArea, setSelectedCountriesForArea] = useState<Set<string>>(new Set());
  const [connectionFrom, setConnectionFrom] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // Icon management
  const [countryIcons, setCountryIcons] = useState<CountryIcon[]>(event.countryIcons || []);
  const [editingIcon, setEditingIcon] = useState<CountryIcon | null>(null);
  const [viewingIcon, setViewingIcon] = useState<CountryIcon | null>(null);
  const [iconPlacementMode, setIconPlacementMode] = useState(false);
  const [pendingIconCountry, setPendingIconCountry] = useState<string | null>(null);
  const [pendingIconCoords, setPendingIconCoords] = useState<[number, number] | null>(null);

  // Sync countryIcons state with event prop when it changes (e.g., when timeline point adds an icon)
  // Use a ref to track previous icons to detect changes
  const prevIconsRef = useRef<string>("");
  useEffect(() => {
    const newIcons = event.countryIcons || [];
    const iconsKey = `${newIcons.length}-${newIcons.map(i => i.id).join(',')}`;

    if (iconsKey !== prevIconsRef.current) {
      console.log("🔄 VisualMapEditor: Syncing countryIcons from event:", {
        newCount: newIcons.length,
        icons: newIcons.map(i => ({ id: i.id, country: i.country, iconType: i.iconType, coordinates: i.coordinates, timelinePointId: i.timelinePointId }))
      });
      setCountryIcons(newIcons);
      prevIconsRef.current = iconsKey;
    }
  }, [event.countryIcons, event.id]);

  // Common country list for autocomplete
  const commonCountries = [
    "United States of America", "Russia", "China", "United Kingdom",
    "France", "Germany", "Japan", "India", "Brazil", "Canada",
    "Australia", "South Korea", "Italy", "Spain", "Poland",
    "Ukraine", "Turkey", "Saudi Arabia", "Iran", "Israel",
    "Egypt", "Indonesia", "Mexico", "Argentina", "South Africa",
    "Nigeria", "Pakistan", "Bangladesh", "Vietnam", "Thailand",
    "Philippines", "Malaysia", "Singapore", "Myanmar", "Afghanistan",
    "Iraq", "Syria", "Jordan", "Lebanon", "Yemen",
    "United Arab Emirates", "Qatar", "Kuwait", "Oman", "Bahrain",
    "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan",
    "Mongolia", "North Korea", "Taiwan", "Hong Kong", "Macau",
    "Nepal", "Bhutan", "Sri Lanka", "Maldives", "Bangladesh",
    "Myanmar", "Laos", "Cambodia", "Brunei", "East Timor",
    "Papua New Guinea", "Fiji", "New Zealand", "Chile", "Peru",
    "Colombia", "Venezuela", "Ecuador", "Bolivia", "Paraguay",
    "Uruguay", "Guyana", "Suriname", "Belize", "Guatemala",
    "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama",
    "Cuba", "Jamaica", "Haiti", "Dominican Republic", "Trinidad and Tobago",
    "Morocco", "Algeria", "Tunisia", "Libya", "Sudan",
    "Ethiopia", "Kenya", "Tanzania", "Uganda", "Rwanda",
    "Ghana", "Senegal", "Ivory Coast", "Cameroon", "Angola",
    "Zimbabwe", "Botswana", "Namibia", "Mozambique", "Madagascar",
    "Albania", "Bosnia and Herzegovina", "Croatia", "Serbia", "Montenegro",
    "North Macedonia", "Slovenia", "Slovakia", "Czechia", "Hungary",
    "Romania", "Bulgaria", "Greece", "Cyprus", "Malta",
    "Portugal", "Ireland", "Iceland", "Norway", "Sweden",
    "Finland", "Denmark", "Estonia", "Latvia", "Lithuania",
    "Belarus", "Moldova", "Georgia", "Armenia", "Azerbaijan",
  ];

  const handleCountryClick = (countryName: string, clickEvent?: { point: { x: number; y: number } }) => {
    console.log("=== handleCountryClick called ===");
    console.log("countryName:", countryName);
    console.log("mapMode:", mapMode);
    console.log("isDrawing:", isDrawing);

    if (!countryName) {
      console.warn("No country name provided");
      return;
    }

    // Icon placement removed - now handled in TimelineBuilder

    // If in drawing mode, don't show highlight popup - let drawing tools handle clicks
    if (isDrawing) {
      return; // Drawing tools will handle the click
    }

    // Handle different map modes
    if (mapMode === "unified-area") {
      // Toggle country selection for unified area
      setSelectedCountriesForArea(prev => {
        const newSet = new Set(prev);
        if (newSet.has(countryName)) {
          newSet.delete(countryName);
        } else {
          newSet.add(countryName);
        }
        return newSet;
      });
      return;
    }

    if (mapMode === "connection") {
      // Set "from" country or create connection
      if (!connectionFrom) {
        setConnectionFrom(countryName);
      } else if (connectionFrom === countryName) {
        // Clicked same country, cancel
        setConnectionFrom(null);
      } else {
        // Create connection
        const newConnection: EventConnection = {
          from: connectionFrom,
          to: countryName,
          type: "alliance"
        };
        setEvent({
          ...event,
          connections: [...(event.connections || []), newConnection]
        });
        setConnectionFrom(null);
      }
      return;
    }

    // Default mode: highlight country (show popup) - only when NOT in drawing mode
    if (mapMode === "highlight" && !isDrawing) {
      if (clickEvent) {
        setClickedCountry({
          name: countryName,
          position: { x: clickEvent.point.x, y: clickEvent.point.y }
        });
      } else {
        setClickedCountry({
          name: countryName,
          position: { x: 300, y: 300 }
        });
      }
    }
  };

  const handleHighlightWithColor = (countryName: string, color: string) => {
    const newHighlights = new Map(countryHighlights);
    const existing = newHighlights.get(countryName);
    newHighlights.set(countryName, {
      name: countryName,
      color: color,
      appearAtTimelinePoint: existing?.appearAtTimelinePoint,
      appearAtYear: existing?.appearAtYear,
      appearAtPosition: existing?.appearAtPosition,
    });
    setCountryHighlights(newHighlights);
    updateEventHighlights(newHighlights);
    setClickedCountry(null);
  };

  const handleRemoveHighlight = (countryName: string) => {
    const newHighlights = new Map(countryHighlights);
    newHighlights.delete(countryName);
    setCountryHighlights(newHighlights);
    updateEventHighlights(newHighlights);
    setClickedCountry(null);
  };

  const handleAddCountry = () => {
    if (newCountry && !countryHighlights.has(newCountry)) {
      const newHighlights = new Map(countryHighlights);
      const defaultColors = Object.values(THEORY_COLORS_DARK);
      const colorIndex = newHighlights.size % defaultColors.length;
      newHighlights.set(newCountry, {
        name: newCountry,
        color: defaultColors[colorIndex],
      });
      setCountryHighlights(newHighlights);
      updateEventHighlights(newHighlights);
      setNewCountry("");
      setShowCountryInput(false);
    }
  };

  const handleColorChange = (countryName: string, color: string) => {
    const newHighlights = new Map(countryHighlights);
    const existing = newHighlights.get(countryName);
    if (existing) {
      newHighlights.set(countryName, { ...existing, color });
      setCountryHighlights(newHighlights);
      updateEventHighlights(newHighlights);
    }
  };

  const handleTimingChange = (countryName: string, field: 'appearAtTimelinePoint' | 'appearAtYear' | 'appearAtPosition', value: string | number | undefined) => {
    const newHighlights = new Map(countryHighlights);
    const existing = newHighlights.get(countryName);
    if (existing) {
      newHighlights.set(countryName, {
        ...existing,
        [field]: value === '' ? undefined : value,
        // Clear other timing fields when setting one
        ...(field === 'appearAtTimelinePoint' ? { appearAtYear: undefined, appearAtPosition: undefined } : {}),
        ...(field === 'appearAtYear' ? { appearAtTimelinePoint: undefined, appearAtPosition: undefined } : {}),
        ...(field === 'appearAtPosition' ? { appearAtTimelinePoint: undefined, appearAtYear: undefined } : {}),
      });
      setCountryHighlights(newHighlights);
      updateEventHighlights(newHighlights);
    }
  };

  const handleRemoveCountry = (countryName: string) => {
    const newHighlights = new Map(countryHighlights);
    newHighlights.delete(countryName);
    setCountryHighlights(newHighlights);
    updateEventHighlights(newHighlights);
  };

  const updateEventHighlights = (highlights: Map<string, CountryHighlight>) => {
    const countries = Array.from(highlights.keys());
    const countryHighlightsArray = Array.from(highlights.values()).map(h => ({
      country: h.name,
      color: h.color,
      appearAtTimelinePoint: h.appearAtTimelinePoint,
      appearAtYear: h.appearAtYear,
      appearAtPosition: h.appearAtPosition,
    }));

    setEvent({
      ...event,
      highlightedCountries: countries, // Keep for backward compatibility
      countryHighlights: countryHighlightsArray,
    } as any);
  };

  useEffect(() => {
    // Sync with event data
    const newHighlights = new Map<string, CountryHighlight>();
    const defaultColors = Object.values(THEORY_COLORS_DARK);

    // Use new countryHighlights structure if available
    if (event.countryHighlights && event.countryHighlights.length > 0) {
      event.countryHighlights.forEach((highlight) => {
        newHighlights.set(highlight.country, {
          name: highlight.country,
          color: highlight.color || defaultColors[newHighlights.size % defaultColors.length],
          appearAtTimelinePoint: highlight.appearAtTimelinePoint,
          appearAtYear: highlight.appearAtYear,
          appearAtPosition: highlight.appearAtPosition,
        });
      });
    } else {
      // Fallback to legacy highlightedCountries
      const countries = event.highlightedCountries || [];
      countries.forEach((country, index) => {
        // Try to get color from event data, otherwise use default
        const storedColor = (event as any).countryHighlightColors?.[country];
        newHighlights.set(country, {
          name: country,
          color: storedColor || defaultColors[index % defaultColors.length],
        });
      });
    }
    setCountryHighlights(newHighlights);
  }, [event.highlightedCountries, event.countryHighlights]);

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[9999] max-w-md">
          <div
            className={`p-4 rounded-lg shadow-xl border backdrop-blur-sm ${notification.type === 'success'
              ? 'bg-green-600/90 border-green-500 text-white'
              : notification.type === 'error'
                ? 'bg-red-600/90 border-red-500 text-white'
                : 'bg-blue-600/90 border-blue-500 text-white'
              }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium flex-1">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="text-white/80 hover:text-white transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-8 space-y-8">
        <div className="border-b border-slate-600/50 pb-4">
          <h2 className="text-2xl font-bold text-white">Map Highlights</h2>
          <p className="text-gray-300 mt-1">
            Click on countries in the map below to highlight them, or add them manually using the search box.
          </p>
        </div>

        {/* Map Mode Selector */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setMapMode("highlight");
              setIsDrawing(false);
              setSelectedCountriesForArea(new Set());
              setConnectionFrom(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mapMode === "highlight"
              ? "bg-indigo-600 text-white shadow-lg"
              : "bg-slate-700/80 text-gray-200 border border-slate-600/50 hover:bg-slate-600"
              }`}
            style={mapMode === "highlight" ? { backgroundColor: '#4f46e5', color: '#ffffff' } : { backgroundColor: '#ffffff', color: '#1f2937' }}
          >
            <Globe className="w-5 h-5 inline mr-2" style={mapMode === "highlight" ? { color: '#ffffff', stroke: '#ffffff' } : { color: '#374151', stroke: '#374151' }} />
            Highlight Countries
          </button>
          <button
            onClick={() => {
              setMapMode("unified-area");
              setIsDrawing(false);
              setClickedCountry(null);
              setConnectionFrom(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mapMode === "unified-area"
              ? "bg-green-600 text-white shadow-lg"
              : "bg-slate-700/80 text-gray-200 border border-slate-600/50 hover:bg-slate-600"
              }`}
            style={mapMode === "unified-area" ? { backgroundColor: '#16a34a', color: '#ffffff' } : { backgroundColor: '#ffffff', color: '#1f2937' }}
          >
            <Shapes className="w-5 h-5 inline mr-2" style={mapMode === "unified-area" ? { color: '#ffffff', stroke: '#ffffff' } : { color: '#374151', stroke: '#374151' }} />
            Create Unified Area
          </button>
          <button
            onClick={() => {
              setMapMode("connection");
              setIsDrawing(false);
              setClickedCountry(null);
              setSelectedCountriesForArea(new Set());
              setIconPlacementMode(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mapMode === "connection"
              ? "bg-purple-600 text-white shadow-lg"
              : "bg-slate-700/80 text-gray-200 border border-slate-600/50 hover:bg-slate-600"
              }`}
            style={mapMode === "connection" ? { backgroundColor: '#9333ea', color: '#ffffff' } : { backgroundColor: '#ffffff', color: '#1f2937' }}
          >
            <LinkIcon className="w-5 h-5 inline mr-2" style={mapMode === "connection" ? { color: '#ffffff', stroke: '#ffffff' } : { color: '#374151', stroke: '#374151' }} />
            Create Connection
          </button>
        </div>

        {/* Interactive Map */}
        <div
          id="map-container-wrapper"
          className="mb-6 border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg relative"
          style={{ height: "600px" }}
        >
          {/* Historical Map Period Indicator */}
          <div className="absolute top-4 right-4 z-50 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-lg px-4 py-2 shadow-lg max-w-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">Map Period:</span>
              <span className="text-sm font-semibold text-white">{historicalMapConfig.name}</span>
            </div>
            {historicalMapConfig.id !== "modern" && (
              <>
                <p className="text-xs text-gray-400 mt-1">
                  Using {historicalMapConfig.id === event.historicalMapPeriod ? "selected" : "auto-detected"} period
                </p>
                {historicalMapConfig.geojsonPath === "/geo/countries.geojson" && (
                  <p className="text-xs text-yellow-400 mt-1 italic">
                    ⚠️ Note: Historical borders file not yet added. Currently showing modern borders.
                  </p>
                )}
              </>
            )}
          </div>

          <MapComponent
            highlightedCountries={mapHistoricalCountryNames(Array.from(countryHighlights.keys()), historicalMapConfig)}
            countryColors={Object.fromEntries(Array.from(countryHighlights.entries()).map(([name, h]) => [name, h.color]))}
            onCountryClick={handleCountryClick}
            onCountryHover={mapMode === "highlight" && !isDrawing ? setSelectedCountry : undefined}
            selectedCountries={mapMode === "unified-area" && !isDrawing ? Array.from(selectedCountriesForArea) : []}
            connectionFrom={mapMode === "connection" && !isDrawing ? connectionFrom : null}
            mapInstance={mapInstanceRef}
            geojsonUrl={historicalMapConfig.geojsonPath}
          />

          {/* Render completed drawings */}
          <CompletedDrawingsRenderer
            map={mapInstanceRef.current}
            unifiedAreas={event.unifiedAreas || []}
            connections={event.connections || []}
          />

          {/* Render country icons */}
          <CountryIconsRenderer
            map={mapInstanceRef.current}
            icons={countryIcons}
            activeTimelinePointId={null} // In admin view, show all icons
            onIconClick={(icon) => {
              // In admin view, clicking an icon opens the editor
              setEditingIcon(icon);
              setViewingIcon(null);
            }}
          />

          {/* Drawing Tools */}
          {(mapMode === "unified-area" || mapMode === "connection") && isDrawing && (
            <MapDrawingTools
              map={mapInstanceRef.current}
              mode={mapMode}
              existingConnections={(event.connections || []) as any}
              eventTheory={event.theory || null}
              onShapeComplete={async (shape) => {
                // Detect which countries are in this shape
                const detectedCountries = await detectCountriesInShape(shape);

                // For unified areas, we'll store the shape geometry
                // The countries will be determined by which countries the shape covers
                const newArea: UnifiedArea & { shape?: any } = {
                  id: shape.id,
                  name: `Area ${(event.unifiedAreas?.length || 0) + 1}`,
                  countries: detectedCountries, // Auto-populated with detected countries
                  shape: {
                    type: shape.type,
                    coordinates: shape.coordinates,
                    center: shape.center,
                    radius: shape.radius,
                    color: shape.color,
                    opacity: shape.opacity,
                  },
                } as any;

                // Show notification with detected countries
                if (detectedCountries.length > 0) {
                  setNotification({
                    message: `Shape detected ${detectedCountries.length} countr${detectedCountries.length === 1 ? 'y' : 'ies'}: ${detectedCountries.join(', ')}`,
                    type: 'success'
                  });
                  // Auto-hide after 5 seconds
                  setTimeout(() => setNotification(null), 5000);
                } else {
                  setNotification({
                    message: 'No countries detected in this shape. You may need to adjust the shape or manually add countries.',
                    type: 'info'
                  });
                  // Auto-hide after 5 seconds
                  setTimeout(() => setNotification(null), 5000);
                }

                setEvent({
                  ...event,
                  unifiedAreas: [...(event.unifiedAreas || []), newArea]
                });
                setIsDrawing(false);
              }}
              onLineComplete={async (line) => {
                // Detect which countries this line connects
                const { from, to } = await detectCountriesForLine(line);

                // For connections, store the line geometry
                // Extract start/end points for connection
                const fromPoint = line.points[0];
                const toPoint = line.points[line.points.length - 1];

                const newConnection: EventConnection & { line?: any } = {
                  from: from || "Unknown Country", // Auto-detected country
                  to: to || "Unknown Country", // Auto-detected country
                  type: "alliance",
                  label: line.label || (from && to ? `${from} → ${to}` : "Drawn Connection"),
                  line: {
                    type: line.type,
                    points: line.points,
                    controlPoints: line.controlPoints,
                    thickness: line.thickness,
                    color: line.color,
                    opacity: line.opacity,
                  },
                } as any;

                // Show notification with detected connection
                if (from && to) {
                  alert(`Line connects: ${from} → ${to}`);
                } else if (from || to) {
                  alert(`Line detected: ${from || 'Unknown'} → ${to || 'Unknown'}. Please verify the connection.`);
                } else {
                  alert('Could not detect countries for this line. Please verify the connection manually.');
                }

                setEvent({
                  ...event,
                  connections: [...(event.connections || []), newConnection]
                });
                setIsDrawing(false);
              }}
              onCancel={() => setIsDrawing(false)}
            />
          )}

          {/* Drawing Mode Toggle */}
          {(mapMode === "unified-area" || mapMode === "connection") && !isDrawing && (
            <div className="absolute bottom-4 right-4 z-50">
              <button
                onClick={() => setIsDrawing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
              >
                {mapMode === "unified-area" ? "Draw Shape" : "Draw Line"}
              </button>
            </div>
          )}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-10 border border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              {mapMode === "highlight" && !isDrawing && "💡 Click any country to highlight it"}
              {mapMode === "unified-area" && !isDrawing && `📌 Click countries to select (${selectedCountriesForArea.size} selected). Click "Create Area" below when done.`}
              {mapMode === "unified-area" && isDrawing && "🎨 Drawing mode: Click on the map to draw your shape"}
              {mapMode === "connection" && !isDrawing && (
                connectionFrom
                  ? `🔗 Click another country to connect from "${connectionFrom}"`
                  : "🔗 Click a country to start connection"
              )}
              {mapMode === "connection" && isDrawing && "🎨 Drawing mode: Click on the map to draw your line"}
            </p>
          </div>

          {/* Unified Area Creation Panel */}
          {mapMode === "unified-area" && selectedCountriesForArea.size > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border-2 border-green-500 rounded-xl shadow-2xl z-50 p-6 min-w-[400px] max-w-[500px]">
              <h3 className="text-lg font-bold text-white mb-4">Create Unified Area</h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area Name:</label>
                <input
                  type="text"
                  id="new-area-name"
                  placeholder="e.g., NATO & Western Allies"
                  className="w-full px-4 py-2 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-800 text-white"
                />
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Selected Countries ({selectedCountriesForArea.size}):</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {Array.from(selectedCountriesForArea).map(country => (
                    <span key={country} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      {country}
                      <button
                        onClick={() => setSelectedCountriesForArea(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(country);
                          return newSet;
                        })}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const nameInput = document.getElementById("new-area-name") as HTMLInputElement;
                    const areaName = nameInput?.value || `Area ${(event.unifiedAreas?.length || 0) + 1}`;
                    const newArea: UnifiedArea = {
                      id: `area-${Date.now()}`,
                      name: areaName,
                      countries: Array.from(selectedCountriesForArea)
                    };
                    setEvent({
                      ...event,
                      unifiedAreas: [...(event.unifiedAreas || []), newArea]
                    });
                    setSelectedCountriesForArea(new Set());
                    if (nameInput) nameInput.value = "";
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Create Area
                </button>
                <button
                  onClick={() => {
                    setSelectedCountriesForArea(new Set());
                    const nameInput = document.getElementById("new-area-name") as HTMLInputElement;
                    if (nameInput) nameInput.value = "";
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Connection Status */}
          {mapMode === "connection" && connectionFrom && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border-2 border-purple-500 rounded-xl shadow-2xl z-50 p-4">
              <p className="text-sm font-medium text-gray-700">
                Connecting from: <span className="font-bold text-purple-600">{connectionFrom}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Click another country to complete the connection</p>
              <button
                onClick={() => setConnectionFrom(null)}
                className="mt-2 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Country Click Popup - Only show in highlight mode, not when drawing */}
          {clickedCountry && mapMode === "highlight" && !isDrawing && (
            <>
              {/* Backdrop to close popup - very transparent so map is visible */}
              <div
                className="absolute inset-0 bg-black/5 z-40"
                onClick={() => setClickedCountry(null)}
              />
              <div
                className="absolute bg-white border-2 border-indigo-500 rounded-xl shadow-2xl z-50 p-6 min-w-[320px] max-w-[400px]"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {countryHighlights.has(clickedCountry.name) ? "Edit Highlight" : "Highlight Country"}
                  </h3>
                  <button
                    onClick={() => setClickedCountry(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-semibold">{clickedCountry.name}</span>
                  {countryHighlights.has(clickedCountry.name) && (
                    <span className="ml-2 text-xs">(Currently highlighted)</span>
                  )}
                </p>

                {countryHighlights.has(clickedCountry.name) ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Change Color:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(() => {
                          // Filter to show only selected theory's color if event has a theory
                          const theoryEntries = event.theory
                            ? Object.entries(THEORY_COLORS_DARK).filter(([theory]) => theory === event.theory)
                            : Object.entries(THEORY_COLORS_DARK);

                          return theoryEntries.map(([theory, color]) => {
                            const theoryName = THEORY_LABELS[theory as keyof typeof THEORY_LABELS];
                            return (
                              <button
                                key={theory}
                                onClick={() => handleHighlightWithColor(clickedCountry.name, color)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all hover:scale-105 ${countryHighlights.get(clickedCountry.name)?.color === color
                                  ? "border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50"
                                  : "border-gray-300 hover:border-gray-500 bg-white"
                                  }`}
                              >
                                <div
                                  className="w-10 h-10 rounded border-2 border-gray-400 flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-medium text-gray-700">{theoryName}</span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Timing Controls in Popup */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-white mb-3">When to Appear:</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Timeline Point</label>
                          <select
                            value={countryHighlights.get(clickedCountry.name)?.appearAtTimelinePoint || ''}
                            onChange={(e) => handleTimingChange(clickedCountry.name, 'appearAtTimelinePoint', e.target.value || undefined)}
                            className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                          >
                            <option value="">None (appears immediately)</option>
                            {event.timelinePoints?.map((point) => (
                              <option key={point.id} value={point.id}>
                                {point.label || point.id} ({point.date || point.year || ''})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Year</label>
                            <input
                              type="number"
                              value={countryHighlights.get(clickedCountry.name)?.appearAtYear || ''}
                              onChange={(e) => handleTimingChange(clickedCountry.name, 'appearAtYear', e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="e.g. 1947"
                              className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Position (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={countryHighlights.get(clickedCountry.name)?.appearAtPosition || ''}
                              onChange={(e) => handleTimingChange(clickedCountry.name, 'appearAtPosition', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="e.g. 25"
                              className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                            />
                          </div>
                        </div>
                        {(countryHighlights.get(clickedCountry.name)?.appearAtTimelinePoint ||
                          countryHighlights.get(clickedCountry.name)?.appearAtYear ||
                          countryHighlights.get(clickedCountry.name)?.appearAtPosition) && (
                            <p className="text-xs text-blue-400 mt-2">
                              Will appear {countryHighlights.get(clickedCountry.name)?.appearAtTimelinePoint ?
                                `at timeline point "${countryHighlights.get(clickedCountry.name)?.appearAtTimelinePoint}"` :
                                countryHighlights.get(clickedCountry.name)?.appearAtYear ?
                                  `in year ${countryHighlights.get(clickedCountry.name)?.appearAtYear}` :
                                  countryHighlights.get(clickedCountry.name)?.appearAtPosition ?
                                    `at position ${countryHighlights.get(clickedCountry.name)?.appearAtPosition}` : ''}
                            </p>
                          )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveHighlight(clickedCountry.name)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Remove Highlight
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Choose a color:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(() => {
                          // Filter to show only selected theory's color if event has a theory
                          const theoryEntries = event.theory
                            ? Object.entries(THEORY_COLORS_DARK).filter(([theory]) => theory === event.theory)
                            : Object.entries(THEORY_COLORS_DARK);

                          return theoryEntries.map(([theory, color]) => {
                            const theoryName = THEORY_LABELS[theory as keyof typeof THEORY_LABELS] || theory.charAt(0).toUpperCase() + theory.slice(1).replace(/([A-Z])/g, ' $1').trim();
                            return (
                              <button
                                key={theory}
                                onClick={() => handleHighlightWithColor(clickedCountry.name, color)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-500 hover:scale-105 transition-all bg-white"
                              >
                                <div
                                  className="w-10 h-10 rounded border-2 border-gray-400 flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-medium text-gray-700">{theoryName}</span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => setClickedCountry(null)}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Selected Country Info - Only show in highlight mode, not when drawing */}
        {selectedCountry && mapMode === "highlight" && !isDrawing && (
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Hovering over: <span className="font-semibold text-indigo-900">{selectedCountry}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Click to {countryHighlights.has(selectedCountry || "") ? "remove" : "add"} highlight
            </p>
          </div>
        )}

        {/* Country List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              Highlighted Countries ({countryHighlights.size})
            </label>
            <button
              onClick={() => setShowCountryInput(!showCountryInput)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-lg transition-colors"
              type="button"
            >
              <Plus className="w-4 h-4" />
              Add Country
            </button>
          </div>

          {/* Add Country Input */}
          {showCountryInput && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCountry()}
                  placeholder="Type country name..."
                  list="countries-list"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <datalist id="countries-list">
                  {commonCountries.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
                <button
                  onClick={handleAddCountry}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  type="button"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCountryInput(false);
                    setNewCountry("");
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Country Tags with Color Picker */}
          <div className="flex flex-wrap gap-3 min-h-[60px] p-4 bg-slate-800/50 border border-slate-600/50 rounded-lg relative">
            {countryHighlights.size === 0 ? (
              <p className="text-sm text-gray-400 italic">No countries highlighted yet. Click on the map or add manually.</p>
            ) : (
              Array.from(countryHighlights.entries()).map(([country, highlight]) => (
                <div
                  key={country}
                  className="inline-flex flex-col gap-2 px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-lg shadow-sm hover:shadow-md transition-all relative min-w-[280px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-400 cursor-pointer hover:border-gray-600 transition-colors"
                      style={{ backgroundColor: highlight.color }}
                      onClick={() => setEditingColorFor(editingColorFor === country ? null : country)}
                      title="Click to change color"
                    />
                    <span className="text-sm font-medium text-white flex-1">{country}</span>
                    <button
                      onClick={() => handleRemoveCountry(country)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Timing Controls */}
                  <div className="space-y-2 pt-2 border-t border-slate-600/50">
                    <label className="block text-xs font-medium text-white">When to appear:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Timeline Point</label>
                        <select
                          value={highlight.appearAtTimelinePoint || ''}
                          onChange={(e) => handleTimingChange(country, 'appearAtTimelinePoint', e.target.value || undefined)}
                          className="w-full px-2 py-1 text-xs border border-slate-600/50 rounded bg-slate-800 text-white"
                        >
                          <option value="">None</option>
                          {event.timelinePoints?.map((point) => (
                            <option key={point.id} value={point.id}>
                              {point.label || point.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Year</label>
                        <input
                          type="number"
                          value={highlight.appearAtYear || ''}
                          onChange={(e) => handleTimingChange(country, 'appearAtYear', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="e.g. 1947"
                          className="w-full px-2 py-1 text-xs border border-slate-600/50 rounded bg-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Position (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={highlight.appearAtPosition || ''}
                          onChange={(e) => handleTimingChange(country, 'appearAtPosition', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="e.g. 25"
                          className="w-full px-2 py-1 text-xs border border-slate-600/50 rounded bg-slate-800 text-white"
                        />
                      </div>
                    </div>
                    {(highlight.appearAtTimelinePoint || highlight.appearAtYear || highlight.appearAtPosition) && (
                      <p className="text-xs text-blue-600">
                        Will appear {highlight.appearAtTimelinePoint ? `at timeline point "${highlight.appearAtTimelinePoint}"` :
                          highlight.appearAtYear ? `in year ${highlight.appearAtYear}` :
                            highlight.appearAtPosition ? `at position ${highlight.appearAtPosition}` : ''}
                      </p>
                    )}
                  </div>
                  {editingColorFor === country && (
                    <div className="absolute top-full left-0 mt-2 p-4 bg-slate-800 border-2 border-slate-600/50 rounded-lg shadow-xl z-50 min-w-[280px]">
                      <p className="text-xs font-semibold text-white mb-3">Choose Color for {country}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(event.theory
                          ? Object.entries(THEORY_COLORS_DARK).filter(([theory]) => theory === event.theory)
                          : Object.entries(THEORY_COLORS_DARK)
                        ).map(([theory, c]) => {
                          const theoryName = THEORY_LABELS[theory as keyof typeof THEORY_LABELS];
                          return (
                            <button
                              key={theory}
                              onClick={() => {
                                handleColorChange(country, c);
                                setEditingColorFor(null);
                              }}
                              className={`flex flex-col items-center gap-1 px-2 py-2 rounded border-2 transition-all hover:scale-110 ${highlight.color === c
                                ? "border-indigo-400 ring-2 ring-indigo-300 bg-indigo-500/20"
                                : "border-slate-600 hover:border-slate-500 bg-slate-700"
                                }`}
                              title={`${theoryName}: ${c}`}
                            >
                              <div
                                className="w-8 h-8 rounded border border-gray-300"
                                style={{ backgroundColor: c }}
                              />
                              <span className="text-xs text-white font-medium">{theoryName}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setEditingColorFor(null)}
                        className="w-full px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded font-medium"
                      >
                        Done
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveCountry(country)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1 transition-colors"
                    type="button"
                    title="Remove country"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unified Areas Section */}
        <UnifiedAreasEditor
          unifiedAreas={event.unifiedAreas || []}
          timelinePoints={event.timelinePoints || []}
          onUpdate={(areas) => setEvent({ ...event, unifiedAreas: areas })}
        />

        {/* Connections Section */}
        <ConnectionsEditor
          connections={event.connections || []}
          timelinePoints={event.timelinePoints || []}
          onUpdate={(connections) => setEvent({ ...event, connections })}
        />

        {/* Country Icons Section */}
        <CountryIconsEditor
          icons={countryIcons}
          timelinePoints={event.timelinePoints || []}
          onUpdate={(icons) => {
            setCountryIcons(icons);
            setEvent({ ...event, countryIcons: icons });
          }}
          onEdit={(icon) => setEditingIcon(icon)}
        />

        {/* Icon Editor Modal */}
        {editingIcon && (
          <div style={{ zIndex: 10000, position: 'fixed' }}>
            <IconEditorModal
              icon={editingIcon}
              timelinePoints={event.timelinePoints || []}
              onSave={(icon) => {
                console.log("Saving icon:", icon);
                const updatedIcons = editingIcon.id && countryIcons.find(i => i.id === editingIcon.id)
                  ? countryIcons.map(i => i.id === editingIcon.id ? icon : i)
                  : [...countryIcons, icon];
                setCountryIcons(updatedIcons);
                setEvent({ ...event, countryIcons: updatedIcons });
                setEditingIcon(null);
                setPendingIconCountry(null);
                setPendingIconCoords(null);
              }}
              onCancel={() => {
                console.log("Canceling icon edit");
                setEditingIcon(null);
                setPendingIconCountry(null);
                setPendingIconCoords(null);
              }}
            />
          </div>
        )}


        {/* Icon Detail Popup (for viewing, not editing) - only show when viewing, not editing */}
        {/* viewingIcon && !editingIcon && (
        <IconDetailPopup
          icon={viewingIcon}
          onClose={() => setViewingIcon(null)}
          onEdit={() => {
            setEditingIcon(viewingIcon);
            setViewingIcon(null);
          }}
        />
      ) */}
      </div>
    </>
  );
}

// Unified Areas Editor Component
function UnifiedAreasEditor({
  unifiedAreas,
  timelinePoints = [],
  onUpdate,
}: {
  unifiedAreas: UnifiedArea[];
  timelinePoints?: any[];
  onUpdate: (areas: UnifiedArea[]) => void;
}) {
  const handleAdd = () => {
    onUpdate([
      ...unifiedAreas,
      { id: `area-${Date.now()}`, name: "New Area", countries: [] },
    ]);
  };

  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...unifiedAreas];
    (updated[index] as any)[field] = value;
    onUpdate(updated);
  };

  const handleTimingChange = (
    index: number,
    field: 'appearAtTimelinePoint' | 'appearAtYear' | 'appearAtPosition' | 'disappearAtTimelinePoint' | 'disappearAtYear' | 'disappearAtPosition',
    value: string | number | undefined
  ) => {
    const updated = [...unifiedAreas];
    updated[index] = {
      ...updated[index],
      [field]: value === '' ? undefined : value,
      // Clear other timing fields when setting one (for appear fields)
      ...(field === 'appearAtTimelinePoint' ? { appearAtYear: undefined, appearAtPosition: undefined } : {}),
      ...(field === 'appearAtYear' ? { appearAtTimelinePoint: undefined, appearAtPosition: undefined } : {}),
      ...(field === 'appearAtPosition' ? { appearAtTimelinePoint: undefined, appearAtYear: undefined } : {}),
      // Clear other timing fields when setting one (for disappear fields)
      ...(field === 'disappearAtTimelinePoint' ? { disappearAtYear: undefined, disappearAtPosition: undefined } : {}),
      ...(field === 'disappearAtYear' ? { disappearAtTimelinePoint: undefined, disappearAtPosition: undefined } : {}),
      ...(field === 'disappearAtPosition' ? { disappearAtTimelinePoint: undefined, disappearAtYear: undefined } : {}),
    };
    onUpdate(updated);
  };

  const handleRemove = (index: number) => {
    onUpdate(unifiedAreas.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-6 p-4 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-600/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Unified Areas (Blocs/Alliances)</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/50 rounded-lg transition-colors bg-indigo-500/20"
          type="button"
        >
          <Plus className="w-4 h-4" />
          Add Area
        </button>
      </div>

      {unifiedAreas.map((area, index) => (
        <div key={area.id} className="mb-3 p-4 bg-slate-700/80 border border-slate-600/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-white mb-1">Area Name</label>
              <input
                type="text"
                value={area.name}
                onChange={(e) => handleUpdate(index, "name", e.target.value)}
                className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="e.g., NATO & Western Allies"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleRemove(index)}
                className="w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/20 transition-colors"
                type="button"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Remove
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-white mb-1">Description</label>
            <textarea
              value={area.description || ""}
              onChange={(e) => handleUpdate(index, "description", e.target.value)}
              className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              placeholder="Describe what this unified area represents (e.g., 'NATO alliance during the Cold War')"
              rows={2}
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-white mb-1">
              Countries in this Area
              {area.countries && area.countries.length > 0 && (
                <span className="ml-2 text-xs text-green-400">
                  ({area.countries.length} detected)
                </span>
              )}
            </label>
            <input
              type="text"
              value={(area.countries || []).join(", ")}
              onChange={(e) =>
                handleUpdate(
                  index,
                  "countries",
                  e.target.value.split(",").map((c) => c.trim()).filter((c) => c)
                )
              }
              className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              placeholder="United States, United Kingdom, France (comma-separated)"
            />
            {area.countries && area.countries.length > 0 && (
              <p className="mt-1 text-xs text-green-400">
                ✓ Auto-detected: {area.countries.join(", ")}
              </p>
            )}
          </div>

          {/* Timing Controls */}
          <div className="mt-4 pt-4 border-t border-slate-600/50">
            <h4 className="text-xs font-semibold text-white mb-3">Timeline Control</h4>

            {/* Appear Controls */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-300 mb-2">Appear At:</label>
              <div className="mb-2">
                <label className="block text-xs text-gray-400 mb-1">Timeline Point</label>
                <select
                  value={area.appearAtTimelinePoint || ""}
                  onChange={(e) => handleTimingChange(index, 'appearAtTimelinePoint', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                >
                  <option value="">None (appears immediately)</option>
                  {timelinePoints.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.label || point.id} ({point.date || point.year || ''})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={area.appearAtYear || ''}
                    onChange={(e) => handleTimingChange(index, 'appearAtYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g. 1947"
                    className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Position (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={area.appearAtPosition || ''}
                    onChange={(e) => handleTimingChange(index, 'appearAtPosition', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Disappear Controls */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">Disappear At (Optional):</label>
              <div className="mb-2">
                <label className="block text-xs text-gray-400 mb-1">Timeline Point</label>
                <select
                  value={area.disappearAtTimelinePoint || ""}
                  onChange={(e) => handleTimingChange(index, 'disappearAtTimelinePoint', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                >
                  <option value="">Never (stays visible)</option>
                  {timelinePoints.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.label || point.id} ({point.date || point.year || ''})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={area.disappearAtYear || ''}
                    onChange={(e) => handleTimingChange(index, 'disappearAtYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g. 1991"
                    className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Position (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={area.disappearAtPosition || ''}
                    onChange={(e) => handleTimingChange(index, 'disappearAtPosition', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g. 75"
                    className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Connections Editor Component
function ConnectionsEditor({
  connections,
  timelinePoints = [],
  onUpdate,
}: {
  connections: EventConnection[];
  timelinePoints?: any[];
  onUpdate: (connections: EventConnection[]) => void;
}) {
  const handleAdd = () => {
    onUpdate([...connections, { from: "", to: "", type: "alliance" }]);
  };

  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...connections];
    (updated[index] as any)[field] = value;
    onUpdate(updated);
  };

  const handleTimingChange = (
    index: number,
    field: 'appearAtTimelinePoint' | 'appearAtYear' | 'appearAtPosition' | 'disappearAtTimelinePoint' | 'disappearAtYear' | 'disappearAtPosition',
    value: string | number | undefined
  ) => {
    const updated = [...connections];
    updated[index] = {
      ...updated[index],
      [field]: value === '' ? undefined : value,
      // Clear other timing fields when setting one (for appear fields)
      ...(field === 'appearAtTimelinePoint' ? { appearAtYear: undefined, appearAtPosition: undefined } : {}),
      ...(field === 'appearAtYear' ? { appearAtTimelinePoint: undefined, appearAtPosition: undefined } : {}),
      ...(field === 'appearAtPosition' ? { appearAtTimelinePoint: undefined, appearAtYear: undefined } : {}),
      // Clear other timing fields when setting one (for disappear fields)
      ...(field === 'disappearAtTimelinePoint' ? { disappearAtYear: undefined, disappearAtPosition: undefined } : {}),
      ...(field === 'disappearAtYear' ? { disappearAtTimelinePoint: undefined, disappearAtPosition: undefined } : {}),
      ...(field === 'disappearAtPosition' ? { disappearAtTimelinePoint: undefined, disappearAtYear: undefined } : {}),
    };
    onUpdate(updated);
  };

  const handleRemove = (index: number) => {
    onUpdate(connections.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-6 p-4 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-600/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Connections Between Actors</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/50 rounded-lg transition-colors bg-blue-500/20"
          type="button"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      {connections.map((conn, index) => {
        const isAutoDetected = (conn as any).line && conn.from !== "Unknown Country" && conn.to !== "Unknown Country";
        return (
          <div key={index} className="mb-3 p-4 bg-slate-700/80 border border-slate-600/50 rounded-lg">
            {isAutoDetected && (
              <div className="mb-2 p-2 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400">
                ✓ Auto-detected connection: {conn.from} → {conn.to}
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-white mb-1">From</label>
                <input
                  type="text"
                  value={conn.from}
                  onChange={(e) => handleUpdate(index, "from", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="United States"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white mb-1">To</label>
                <input
                  type="text"
                  value={conn.to}
                  onChange={(e) => handleUpdate(index, "to", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Russia"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white mb-1">Type</label>
                <select
                  value={conn.type || "alliance"}
                  onChange={(e) => handleUpdate(index, "type", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="alliance">Alliance</option>
                  <option value="rivalry">Rivalry</option>
                  <option value="proxy-war">Proxy War</option>
                  <option value="support">Support</option>
                  <option value="conflict">Conflict</option>
                  <option value="institution">Institution</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleRemove(index)}
                  className="w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/20 transition-colors"
                  type="button"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-white mb-1">Label (Optional)</label>
              <input
                type="text"
                value={conn.label || ""}
                onChange={(e) => handleUpdate(index, "label", e.target.value)}
                className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="e.g., Bipolar rivalry"
              />
            </div>

            {/* Timing Controls */}
            <div className="mt-4 pt-4 border-t border-slate-600/50">
              <h4 className="text-xs font-semibold text-white mb-3">Timeline Control</h4>

              {/* Appear Controls */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-300 mb-2">Appear At:</label>
                <div className="mb-2">
                  <label className="block text-xs text-gray-400 mb-1">Timeline Point</label>
                  <select
                    value={conn.appearAtTimelinePoint || ""}
                    onChange={(e) => handleTimingChange(index, 'appearAtTimelinePoint', e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                  >
                    <option value="">None (appears immediately)</option>
                    {timelinePoints.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.label || point.id} ({point.date || point.year || ''})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Year</label>
                    <input
                      type="number"
                      value={conn.appearAtYear || ''}
                      onChange={(e) => handleTimingChange(index, 'appearAtYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g. 1947"
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Position (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={conn.appearAtPosition || ''}
                      onChange={(e) => handleTimingChange(index, 'appearAtPosition', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="e.g. 25"
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Disappear Controls */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Disappear At (Optional):</label>
                <div className="mb-2">
                  <label className="block text-xs text-gray-400 mb-1">Timeline Point</label>
                  <select
                    value={conn.disappearAtTimelinePoint || ""}
                    onChange={(e) => handleTimingChange(index, 'disappearAtTimelinePoint', e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                  >
                    <option value="">Never (stays visible)</option>
                    {timelinePoints.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.label || point.id} ({point.date || point.year || ''})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Year</label>
                    <input
                      type="number"
                      value={conn.disappearAtYear || ''}
                      onChange={(e) => handleTimingChange(index, 'disappearAtYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g. 1991"
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Position (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={conn.disappearAtPosition || ''}
                      onChange={(e) => handleTimingChange(index, 'disappearAtPosition', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="e.g. 75"
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component to render completed drawings on the map
function CompletedDrawingsRenderer({
  map,
  unifiedAreas,
  connections,
}: {
  map: maplibregl.Map | null;
  unifiedAreas: UnifiedArea[];
  connections: EventConnection[];
}) {
  useEffect(() => {
    if (!map) return;

    // Wait for map to be fully loaded
    const setupLayers = () => {
      if (!map.isStyleLoaded()) {
        map.once("styledata", setupLayers);
        return;
      }

      const shapeSourceId = "completed-shapes";
      const lineSourceId = "completed-lines";
      const shapeLayerId = "completed-shapes-layer";
      const shapeOutlineLayerId = "completed-shapes-outline";
      const lineLayerId = "completed-lines-layer";

      // Helper to create circle GeoJSON
      const createCircleGeoJSON = (center: [number, number], radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> => {
        const points: [number, number][] = [];
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * 2 * Math.PI;
          const lat = center[1] + (radiusKm / 111) * Math.sin(angle);
          const lng = center[0] + (radiusKm / 111) * Math.cos(angle) / Math.cos(center[1] * Math.PI / 180);
          points.push([lng, lat]);
        }
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [points],
          },
          properties: {},
        };
      };

      // Helper to create bezier curve
      const createBezierCurve = (
        start: [number, number],
        control: [number, number],
        end: [number, number]
      ): GeoJSON.Feature<GeoJSON.LineString> => {
        const points: [number, number][] = [];
        for (let t = 0; t <= 1; t += 0.02) {
          const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
          const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];
          points.push([x, y]);
        }
        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points,
          },
          properties: {},
        };
      };

      // Build shape features
      const shapeFeatures: GeoJSON.Feature[] = [];
      unifiedAreas.forEach((area) => {
        if (!(area as any).shape) return;
        const shape = (area as any).shape as any;

        if (shape.type === "circle" && shape.center && shape.radius) {
          // Radius is already in kilometers (from MapDrawingTools)
          const radiusKm = typeof shape.radius === "number" ? shape.radius : 100;
          const feature = createCircleGeoJSON(shape.center, radiusKm);
          (feature.properties as any).color = shape.color || "#10b981";
          (feature.properties as any).opacity = shape.opacity !== undefined ? shape.opacity : 0.35;
          shapeFeatures.push(feature);
        } else if (shape.type === "polygon" && shape.coordinates && shape.coordinates.length >= 3) {
          const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[...shape.coordinates, shape.coordinates[0]]], // Close polygon
            },
            properties: {
              color: shape.color || "#10b981",
              opacity: shape.opacity !== undefined ? shape.opacity : 0.35,
            },
          };
          shapeFeatures.push(feature);
        }
      });

      // Build line features and collect connection points
      const lineFeatures: GeoJSON.Feature[] = [];
      const connectionPoints = new Map<string, number>(); // Map of point key to count

      connections.forEach((conn) => {
        if (!(conn as any).line) {
          // If no line geometry, skip (this connection was created manually, not drawn)
          return;
        }
        const line = (conn as any).line as any;

        if (line.type === "straight" && line.points && line.points.length >= 2) {
          const feature: GeoJSON.Feature<GeoJSON.LineString> = {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: line.points,
            },
            properties: {
              color: line.color || "#ffe4be", // Default beige (will use theory color on user page)
              thickness: line.thickness || 4,
              opacity: line.opacity !== undefined ? line.opacity : 0.9,
            },
          };
          lineFeatures.push(feature);

          // Track connection points (start and end)
          const startKey = `${line.points[0][0].toFixed(6)},${line.points[0][1].toFixed(6)}`;
          const endKey = `${line.points[line.points.length - 1][0].toFixed(6)},${line.points[line.points.length - 1][1].toFixed(6)}`;
          connectionPoints.set(startKey, (connectionPoints.get(startKey) || 0) + 1);
          connectionPoints.set(endKey, (connectionPoints.get(endKey) || 0) + 1);
        } else if (line.type === "curved" && line.points && line.points.length >= 3) {
          const feature = createBezierCurve(
            line.points[0],
            line.controlPoints?.[0] || line.points[1],
            line.points[line.points.length - 1]
          );
          (feature.properties as any).color = line.color || "#ffe4be"; // Default beige (will use theory color on user page)
          (feature.properties as any).thickness = line.thickness || 4;
          (feature.properties as any).opacity = line.opacity !== undefined ? line.opacity : 0.9;
          lineFeatures.push(feature);

          // Track connection points
          const startKey = `${line.points[0][0].toFixed(6)},${line.points[0][1].toFixed(6)}`;
          const endKey = `${line.points[line.points.length - 1][0].toFixed(6)},${line.points[line.points.length - 1][1].toFixed(6)}`;
          connectionPoints.set(startKey, (connectionPoints.get(startKey) || 0) + 1);
          connectionPoints.set(endKey, (connectionPoints.get(endKey) || 0) + 1);
        }
      });

      // Create connection point features (only for points where 2+ lines connect)
      const connectionPointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
      connectionPoints.forEach((count, key) => {
        if (count >= 2) {
          const [lng, lat] = key.split(",").map(Number);
          connectionPointFeatures.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            properties: {
              connectionCount: count,
            },
          });
        }
      });

      // Update or create shape source and layers
      if (shapeFeatures.length > 0) {
        if (map.getSource(shapeSourceId)) {
          (map.getSource(shapeSourceId) as maplibregl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: shapeFeatures,
          });
        } else {
          map.addSource(shapeSourceId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: shapeFeatures,
            },
          });

          // Find a good place to insert the layers (after country layers but before any symbols)
          const layers = map.getStyle().layers || [];
          let beforeId: string | undefined;
          for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.type === "symbol" || layer.id.includes("label") || layer.id.includes("text")) {
              beforeId = layer.id;
              break;
            }
          }

          // Add shadow layer
          map.addLayer({
            id: `${shapeLayerId}-shadow`,
            type: "fill",
            source: shapeSourceId,
            paint: {
              "fill-color": ["get", "color"],
              "fill-opacity": [
                "*",
                ["get", "opacity"],
                0.5
              ],
            },
          }, beforeId);

          // Add main fill layer
          map.addLayer({
            id: shapeLayerId,
            type: "fill",
            source: shapeSourceId,
            paint: {
              "fill-color": ["get", "color"],
              "fill-opacity": ["get", "opacity"],
            },
          }, beforeId);

          // Add glow border layer
          map.addLayer({
            id: `${shapeOutlineLayerId}-glow`,
            type: "line",
            source: shapeSourceId,
            paint: {
              "line-color": ["get", "color"],
              "line-width": 5,
              "line-opacity": 0.25,
              "line-blur": 2,
            },
          }, beforeId);

          // Add main border layer
          map.addLayer({
            id: shapeOutlineLayerId,
            type: "line",
            source: shapeSourceId,
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 2.5,
              "line-opacity": 0.9,
            },
          }, beforeId);
        }
      } else {
        // Remove layers and source if no shapes
        if (map.getLayer(shapeLayerId)) map.removeLayer(shapeLayerId);
        if (map.getLayer(`${shapeLayerId}-shadow`)) map.removeLayer(`${shapeLayerId}-shadow`);
        if (map.getLayer(shapeOutlineLayerId)) map.removeLayer(shapeOutlineLayerId);
        if (map.getLayer(`${shapeOutlineLayerId}-glow`)) map.removeLayer(`${shapeOutlineLayerId}-glow`);
        if (map.getSource(shapeSourceId)) map.removeSource(shapeSourceId);
      }

      // Update or create line source and layer
      const connectionPointSourceId = "connection-points";
      const connectionPointLayerId = "connection-points-layer";

      if (lineFeatures.length > 0) {
        if (map.getSource(lineSourceId)) {
          (map.getSource(lineSourceId) as maplibregl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: lineFeatures,
          });

          // Make sure layer exists and is visible
          if (!map.getLayer(lineLayerId)) {
            const layers = map.getStyle().layers || [];
            let beforeId: string | undefined;
            for (let i = layers.length - 1; i >= 0; i--) {
              const layer = layers[i];
              if (layer.type === "symbol" || layer.id.includes("label") || layer.id.includes("text")) {
                beforeId = layer.id;
                break;
              }
            }

            // 3D Effect: Multiple shadow layers for depth
            // Deep shadow (darkest, widest)
            map.addLayer({
              id: `${lineLayerId}-shadow-deep`,
              type: "line",
              source: lineSourceId,
              paint: {
                "line-color": "rgba(0, 0, 0, 0.4)",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  ["+", ["get", "thickness"], 6],
                  10,
                  ["+", ["get", "thickness"], 8],
                ],
                "line-opacity": 0.5,
                "line-blur": 4,
                "line-offset": 2, // Offset for 3D shadow effect
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            }, beforeId);

            // Medium shadow
            map.addLayer({
              id: `${lineLayerId}-shadow-medium`,
              type: "line",
              source: lineSourceId,
              paint: {
                "line-color": "rgba(0, 0, 0, 0.25)",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  ["+", ["get", "thickness"], 4],
                  10,
                  ["+", ["get", "thickness"], 5],
                ],
                "line-opacity": 0.4,
                "line-blur": 2,
                "line-offset": 1, // Offset for 3D shadow effect
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            }, beforeId);

            // Glow layer (wider, more transparent line behind main line)
            map.addLayer({
              id: `${lineLayerId}-glow`,
              type: "line",
              source: lineSourceId,
              paint: {
                "line-color": ["get", "color"],
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  ["+", ["get", "thickness"], 5],
                  10,
                  ["+", ["get", "thickness"], 7],
                ],
                "line-opacity": [
                  "*",
                  ["get", "opacity"],
                  0.4
                ],
                "line-blur": 4,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            }, beforeId);

            // Add main line layer
            map.addLayer({
              id: lineLayerId,
              type: "line",
              source: lineSourceId,
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": ["get", "color"],
                "line-width": ["get", "thickness"],
                "line-opacity": ["get", "opacity"],
              },
            }, beforeId);
          } else {
            // Ensure layer is visible
            map.setLayoutProperty(lineLayerId, "visibility", "visible");
          }
        } else {
          map.addSource(lineSourceId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: lineFeatures,
            },
          });

          // Find a good place to insert the layer (after country layers but before any symbols)
          const layers = map.getStyle().layers || [];
          let beforeId: string | undefined;
          for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.type === "symbol" || layer.id.includes("label") || layer.id.includes("text")) {
              beforeId = layer.id;
              break;
            }
          }

          // 3D Effect: Multiple shadow layers for depth
          // Deep shadow (darkest, widest)
          map.addLayer({
            id: `${lineLayerId}-shadow-deep`,
            type: "line",
            source: lineSourceId,
            paint: {
              "line-color": "rgba(0, 0, 0, 0.4)",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                ["+", ["get", "thickness"], 6],
                10,
                ["+", ["get", "thickness"], 8],
              ],
              "line-opacity": 0.5,
              "line-blur": 4,
              "line-offset": 2, // Offset for 3D shadow effect
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
          }, beforeId);

          // Medium shadow
          map.addLayer({
            id: `${lineLayerId}-shadow-medium`,
            type: "line",
            source: lineSourceId,
            paint: {
              "line-color": "rgba(0, 0, 0, 0.25)",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                ["+", ["get", "thickness"], 4],
                10,
                ["+", ["get", "thickness"], 5],
              ],
              "line-opacity": 0.4,
              "line-blur": 2,
              "line-offset": 1, // Offset for 3D shadow effect
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
          }, beforeId);

          // Glow layer (wider, more transparent line behind main line)
          map.addLayer({
            id: `${lineLayerId}-glow`,
            type: "line",
            source: lineSourceId,
            paint: {
              "line-color": ["get", "color"],
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                ["+", ["get", "thickness"], 5],
                10,
                ["+", ["get", "thickness"], 7],
              ],
              "line-opacity": [
                "*",
                ["get", "opacity"],
                0.4
              ],
              "line-blur": 4,
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
          }, beforeId);

          // Add main line layer
          map.addLayer({
            id: lineLayerId,
            type: "line",
            source: lineSourceId,
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": ["get", "color"],
              "line-width": ["get", "thickness"],
              "line-opacity": ["get", "opacity"],
            },
          }, beforeId);
        }

        // Add connection point indicators
        if (connectionPointFeatures.length > 0) {
          if (map.getSource(connectionPointSourceId)) {
            (map.getSource(connectionPointSourceId) as maplibregl.GeoJSONSource).setData({
              type: "FeatureCollection",
              features: connectionPointFeatures,
            });
          } else {
            map.addSource(connectionPointSourceId, {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: connectionPointFeatures,
              },
            });

            const layers = map.getStyle().layers || [];
            let beforeId: string | undefined;
            for (let i = layers.length - 1; i >= 0; i--) {
              const layer = layers[i];
              if (layer.type === "symbol" || layer.id.includes("label") || layer.id.includes("text")) {
                beforeId = layer.id;
                break;
              }
            }

            // Add glow layer for connection points
            map.addLayer({
              id: `${connectionPointLayerId}-glow`,
              type: "circle",
              source: connectionPointSourceId,
              paint: {
                "circle-radius": 10,
                "circle-color": "#ffd700",
                "circle-opacity": 0.3,
                "circle-blur": 2,
              },
            }, beforeId);

            // Add main connection point layer
            map.addLayer({
              id: connectionPointLayerId,
              type: "circle",
              source: connectionPointSourceId,
              paint: {
                "circle-radius": 6,
                "circle-color": "#ffd700",
                "circle-stroke-width": 2.5,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 0.95,
              },
            }, beforeId);
          }
        } else {
          // Remove connection points if none
          if (map.getLayer(connectionPointLayerId)) map.removeLayer(connectionPointLayerId);
          if (map.getLayer(`${connectionPointLayerId}-glow`)) map.removeLayer(`${connectionPointLayerId}-glow`);
          if (map.getSource(connectionPointSourceId)) map.removeSource(connectionPointSourceId);
        }
      } else {
        // Remove layer and source if no lines
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(`${lineLayerId}-glow`)) map.removeLayer(`${lineLayerId}-glow`);
        if (map.getLayer(`${lineLayerId}-shadow-deep`)) map.removeLayer(`${lineLayerId}-shadow-deep`);
        if (map.getLayer(`${lineLayerId}-shadow-medium`)) map.removeLayer(`${lineLayerId}-shadow-medium`);
        if (map.getSource(lineSourceId)) map.removeSource(lineSourceId);
        if (map.getLayer(connectionPointLayerId)) map.removeLayer(connectionPointLayerId);
        if (map.getLayer(`${connectionPointLayerId}-glow`)) map.removeLayer(`${connectionPointLayerId}-glow`);
        if (map.getSource(connectionPointSourceId)) map.removeSource(connectionPointSourceId);
      }

    }; // End of setupLayers function

    setupLayers();

    // Cleanup on unmount
    return () => {
      if (map) {
        map.off("styledata", setupLayers);
      }
      try {
        const shapeSourceId = "completed-shapes";
        const lineSourceId = "completed-lines";
        const connectionPointSourceId = "connection-points";
        const shapeLayerId = "completed-shapes-layer";
        const shapeOutlineLayerId = "completed-shapes-outline";
        const lineLayerId = "completed-lines-layer";
        const connectionPointLayerId = "connection-points-layer";

        if (map.getLayer(shapeLayerId)) map.removeLayer(shapeLayerId);
        if (map.getLayer(`${shapeLayerId}-shadow`)) map.removeLayer(`${shapeLayerId}-shadow`);
        if (map.getLayer(shapeOutlineLayerId)) map.removeLayer(shapeOutlineLayerId);
        if (map.getLayer(`${shapeOutlineLayerId}-glow`)) map.removeLayer(`${shapeOutlineLayerId}-glow`);
        if (map.getSource(shapeSourceId)) map.removeSource(shapeSourceId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(`${lineLayerId}-glow`)) map.removeLayer(`${lineLayerId}-glow`);
        if (map.getLayer(`${lineLayerId}-shadow-deep`)) map.removeLayer(`${lineLayerId}-shadow-deep`);
        if (map.getLayer(`${lineLayerId}-shadow-medium`)) map.removeLayer(`${lineLayerId}-shadow-medium`);
        if (map.getSource(lineSourceId)) map.removeSource(lineSourceId);
        if (map.getLayer(connectionPointLayerId)) map.removeLayer(connectionPointLayerId);
        if (map.getLayer(`${connectionPointLayerId}-glow`)) map.removeLayer(`${connectionPointLayerId}-glow`);
        if (map.getSource(connectionPointSourceId)) map.removeSource(connectionPointSourceId);
      } catch (e) {
        // Ignore errors during cleanup
      }
    };
  }, [map, unifiedAreas, connections]);

  return null;
}

// Component to render country icons on the map
function CountryIconsRenderer({
  map,
  icons,
  activeTimelinePointId,
  onIconClick,
}: {
  map: maplibregl.Map | null;
  icons: CountryIcon[];
  activeTimelinePointId: string | null;
  onIconClick: (icon: CountryIcon) => void;
}) {
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!map) {
      console.log("⚠️ VisualMapEditor: Map not ready yet");
      return;
    }

    const setupIcons = () => {
      if (!map.isStyleLoaded()) {
        console.log("⏳ VisualMapEditor: Map style not loaded, waiting...");
        map.once("styledata", setupIcons);
        return;
      }

      // Filter icons based on timeline point
      // In admin mode (activeTimelinePointId === null), show ALL icons
      // In viewer mode, only show icons for the active timeline point
      const visibleIcons = icons.filter((icon) => {
        if (!icon.timelinePointId) return true; // Always show icons without timeline linkage
        if (activeTimelinePointId === null) return true; // In admin mode, show all icons
        if (!activeTimelinePointId) return false; // Hide timeline-linked icons if no point is active (viewer mode)
        return icon.timelinePointId === activeTimelinePointId;
      });

      console.log(`🗺️ VisualMapEditor: Rendering ${visibleIcons.length} of ${icons.length} icons:`, {
        totalIcons: icons.length,
        visibleIcons: visibleIcons.length,
        activeTimelinePointId,
        icons: visibleIcons.map(i => ({
          id: i.id,
          country: i.country,
          iconType: i.iconType,
          coords: i.coordinates,
          timelinePointId: i.timelinePointId
        }))
      });

      // Remove old markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // Add new markers
      visibleIcons.forEach((icon) => {
        console.log(`📍 Creating marker for icon:`, {
          id: icon.id,
          country: icon.country,
          iconType: icon.iconType,
          coordinates: icon.coordinates
        });

        const el = document.createElement("div");
        el.className = "country-icon-marker";
        el.style.width = "40px";
        el.style.height = "40px";
        el.style.cursor = "pointer";
        el.style.position = "relative";

        // Create marker HTML
        const iconSVG = getIconSVG(icon.iconType);
        console.log(`🎨 Icon SVG for ${icon.iconType}:`, iconSVG ? `Found (${iconSVG.length} chars)` : "NOT FOUND");
        if (!iconSVG || iconSVG === getIconSVG("map-pin")) {
          console.warn(`⚠️ Icon type "${icon.iconType}" not found, using default map-pin icon`);
        }

        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            border: 2px solid rgba(255, 228, 190, 0.6);
            background-color: #ffe4be;
            transform: rotate(45deg);
            border-radius: 4px;
            box-shadow: 0 0 12px rgba(255, 228, 190, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          ">
            <div style="
              transform: rotate(-45deg);
              color: #1e293b;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${iconSVG}
            </div>
          </div>
        `;

        // Add hover effect
        el.addEventListener("mouseenter", () => {
          const inner = el.querySelector("div > div") as HTMLElement;
          if (inner) {
            inner.parentElement!.style.transform = "rotate(45deg) scale(1.15)";
          }
        });
        el.addEventListener("mouseleave", () => {
          const inner = el.querySelector("div > div") as HTMLElement;
          if (inner) {
            inner.parentElement!.style.transform = "rotate(45deg) scale(1)";
          }
        });

        // Add click handler
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onIconClick(icon);
        });

        // Convert [lat, lng] to [lng, lat] for MapLibre
        const lngLat: [number, number] = [icon.coordinates[1], icon.coordinates[0]];
        console.log(`🗺️ Adding marker at [lng, lat]: [${lngLat[0]}, ${lngLat[1]}] for ${icon.country}`);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(lngLat)
          .addTo(map);

        markersRef.current.set(icon.id, marker);
        console.log(`✅ Marker added successfully for ${icon.country}`);
      });
    };

    setupIcons();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    };
  }, [map, icons, activeTimelinePointId, onIconClick]);

  return null;
}

// Helper function to get icon SVG
function getIconSVG(iconType: string): string {
  const iconMap: Record<string, string> = {
    "finance": `<svg width="18" height="18" viewBox="0 0 185 185" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M112.96,77.43s-.07.99-.17,2.16c-.11,1.18-.29,2.95-.38,3.94-.2,2.12-.21,2.15-.35,2.15-.07,0-.39-.23-.73-.5-1.49-1.2-1.75-1.3-2.15-.97-.1.09-.57.67-1.04,1.29-.41.54-.82,1.09-1.23,1.64-.28.37-.54.74-.82,1.11-.71.99-.89,1.22-1.94,2.61-1.27,1.68-1.79,2.39-1.94,2.67-.07.11-.25.36-.42.55-.37.39-.81.97-1.14,1.5-.13.21-.35.5-.49.66-.13.14-.57.71-.97,1.28-1.57,2.16-2.46,2.92-3.91,3.33-.69.2-2,.21-2.64.04-1.29-.35-2.05-.94-4.25-3.35-.55-.6-1.27-1.35-1.57-1.67-.3-.31-.78-.82-1.07-1.12-.5-.56-1.39-1.29-1.69-1.41-.5-.19-1.28-.12-1.86.16-.67.32-1.11.86-3.42,4.08-.52.72-1.25,1.72-1.61,2.21-.36.5-.89,1.24-1.18,1.65-.29.41-.69.97-.91,1.25-.21.28-.72.97-1.12,1.55-.62.88-.78,1.07-1.02,1.18-.46.22-.88.16-1.24-.18-.44-.41-.5-.9-.18-1.34.1-.14.46-.64.77-1.08.31-.45.84-1.17,1.17-1.6.32-.44.75-1.02.94-1.3s.46-.66.59-.82.38-.5.56-.75c.17-.25.59-.82.91-1.28.32-.45.82-1.12,1.08-1.49.27-.38.65-.89.85-1.14.2-.26.58-.75.84-1.12.57-.81,1.46-1.56,2.26-1.91.31-.14,1.39-.32,1.9-.32.57,0,1.47.19,1.88.39.5.25,1.78,1.34,2.3,1.98.23.28.6.67.84.88.23.2.54.53.71.73.32.41.44.53,1.82,1.98,1.58,1.67,1.99,1.91,3.11,1.87.9-.04,1.2-.2,2.07-1.09.65-.66,1.04-1.15,2.98-3.81,1.05-1.43,1.68-2.27,2.01-2.7.17-.22.9-1.19,1.64-2.16.72-.97,1.63-2.17,2.01-2.67.38-.5.84-1.13,1.01-1.4.18-.27.5-.71.72-.98.75-.92.87-1.15.74-1.57-.08-.3-.27-.49-1.28-1.24-.43-.32-.78-.62-.78-.67,0-.09,1.06-.56,2.51-1.12.59-.23,1.72-.67,2.51-.99.79-.31,1.64-.63,1.87-.71.24-.08.51-.19.62-.25s.2-.09.23-.08v-.03ZM121.74,86.34c-.47-2.1-.66-2.79-1.24-4.31-1.61-4.26-4.24-8.17-7.64-11.36-2.31-2.16-5.58-4.28-8.43-5.47-2.23-.93-3.91-1.47-5.91-1.87-1.8-.36-2.56-.48-3.79-.56-1.08-.08-3.26-.08-4.42,0-3.69.26-8.03,1.47-11.36,3.17-2.81,1.44-5.31,3.26-7.57,5.5-1.49,1.47-2.21,2.33-3.54,4.22-.78,1.11-2.01,3.26-2.62,4.63-1.3,2.89-2.12,5.91-2.51,9.35-.11.96-.11,4.58,0,5.65.36,3.46,1.4,7.07,2.93,10.12,1.64,3.27,3.35,5.62,5.98,8.2,2.49,2.44,4.62,3.97,7.61,5.47,4.25,2.13,8.72,3.24,13.16,3.24,4.81,0,9.24-1.09,13.74-3.36,3.82-1.94,7.36-4.91,10.11-8.49,2.56-3.34,4.26-6.82,5.24-10.74,1.17-4.66,1.25-8.86.27-13.38ZM114.15,80.36c-.06.43-.2,1.84-.32,3.12-.13,1.29-.26,2.46-.3,2.62-.1.37-.54.79-.99.92-.62.19-1.15,0-2.18-.77-.31-.24-.62-.44-.66-.44s-.62.74-1.27,1.65c-.67.9-2.67,3.58-4.45,5.96-1.77,2.37-3.38,4.52-3.56,4.77-.74,1.03-1.88,2.37-2.28,2.7-.85.7-1.65,1.09-2.91,1.42-.56.14-.71.16-1.57.13-.84-.03-1.02-.05-1.54-.23-1.3-.44-2.01-.9-3.09-2.02-.72-.75-.78-.8-3.07-3.26-1.85-1.97-2.13-2.23-2.43-2.28s-.71.07-.97.28c-.36.3-1.78,2.23-6.15,8.35-.97,1.36-1.92,2.65-2.12,2.85-.43.45-.84.69-1.41.78-1.07.2-2.21-.35-2.7-1.29-.25-.47-.3-.66-.29-1.2,0-.79.03-.82,2.56-4.26,1.42-1.92,3.05-4.17,4.04-5.55,2.37-3.3,3.08-4.02,4.52-4.55.87-.31,1.37-.4,2.34-.4s1.52.1,2.41.5c1.04.45,1.29.69,4.03,3.57.87.91,1.9,2.03,2.31,2.47.99,1.09,1.18,1.21,1.79,1.24.34.02.53,0,.67-.08.29-.14.89-.85,1.83-2.1.99-1.32,1.97-2.64,2.96-3.95,1.91-2.55,3.01-4.03,4.02-5.39.59-.79,1.17-1.58,1.75-2.38.28-.37.5-.69.5-.73,0-.03-.32-.3-.71-.58-1.09-.81-1.29-1.09-1.24-1.83.05-.75.39-1.05,1.91-1.64.47-.18,1.55-.61,2.42-.94.87-.34,1.63-.64,1.7-.68.07-.03.5-.2.94-.38.45-.18,1.09-.45,1.44-.59.56-.24.66-.27,1.06-.24.3.02.5.07.67.17.25.16.5.59.58.97.05.23-.09,1.98-.26,3.31l.04-.02ZM92.51,24.59L24.59,92.5l67.92,67.92,67.91-67.92L92.51,24.59ZM119.61,108.12c-1.68,2.79-3.82,5.37-6.23,7.52-1.66,1.48-2.8,2.34-4.58,3.47-1.28.81-2.22,1.3-3.59,1.91-3.4,1.49-6.63,2.34-10.22,2.67-1.18.1-4.15.1-5.06,0-4.34-.51-7.43-1.4-11.04-3.14-5.5-2.66-10.54-7.35-13.62-12.71-.83-1.44-1.91-3.82-2.44-5.35-.86-2.5-1.29-4.55-1.62-7.61-.11-1.11-.1-4.13.04-5.29.34-3.02.84-5.16,1.76-7.7,1.68-4.65,4.61-9.1,8.01-12.17,3.28-2.96,6.15-4.78,9.9-6.26,3.28-1.3,6.35-1.98,9.9-2.2,1.18-.08,3.68-.02,4.79.1,6.43.69,12.16,3.11,17.09,7.22,1.69,1.4,4.05,3.93,5.19,5.51.75,1.06,1.65,2.47,2.05,3.2,2.07,3.83,3.29,7.66,3.78,11.79.34,2.92.19,6.35-.42,9.34-.69,3.44-2.05,7.02-3.66,9.7h-.02ZM92.5,4.04l88.46,88.46-88.46,88.46L4.04,92.5,92.5,4.04M92.5,0L0,92.5l92.5,92.5,92.5-92.5L92.5,0Z" />
</svg>`,
    "tank": `<svg width="18" height="18" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,
    "map-pin": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    "shield": `<svg width="18" height="18" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M 648.632812 821.234375 C 649.375 819.9375 650.484375 818.953125 651.714844 818.335938 C 655.105469 816.671875 658.433594 817.414062 660.898438 820.246094 C 663.914062 823.820312 663.855469 827.765625 660.710938 830.90625 C 654.117188 837.5 643.890625 829.304688 648.632812 821.234375 Z M 648.632812 821.234375" /><path fill="currentColor" fill-rule="nonzero" d="M 694.664062 671.617188 C 700.085938 669.152344 706.496094 674.207031 705.570312 680.246094 C 704.339844 687.761719 693.925781 689.304688 690.535156 682.464844 C 689.671875 680.800781 689.488281 678.398438 690.042969 676.792969 C 690.660156 674.882812 692.878906 672.417969 694.726562 671.617188 Z M 694.664062 671.617188" /><path fill="currentColor" fill-rule="nonzero" d="M 693.863281 762.449219 C 692.753906 760.722656 692.570312 760.042969 692.691406 758.011719 C 692.9375 754.992188 694.601562 752.464844 697.128906 751.230469 C 700.582031 749.507812 703.847656 750.183594 706.433594 753.082031 C 708.28125 755.238281 709.023438 757.765625 708.34375 760.105469 C 707.789062 762.324219 705.511719 764.972656 703.539062 765.835938 C 700.085938 767.253906 696.019531 765.835938 693.863281 762.449219 Z M 693.863281 762.449219" /><path fill="currentColor" fill-rule="nonzero" d="M 736.503906 796.09375 C 735.085938 794.984375 733.609375 792.023438 733.609375 790.175781 C 733.609375 787.957031 735.273438 785.0625 737.304688 783.828125 C 739.523438 782.535156 740.878906 782.414062 741.867188 783.398438 C 742.234375 783.769531 742.542969 783.890625 742.542969 783.644531 C 742.542969 782.96875 744.207031 783.089844 745.6875 783.828125 C 748.027344 785.0625 749.382812 787.28125 749.445312 790.054688 C 749.445312 792.949219 748.582031 794.859375 746.425781 796.460938 C 743.714844 798.558594 739.402344 798.371094 736.503906 796.09375 Z M 736.503906 796.09375" /><path fill="currentColor" fill-rule="nonzero" d="M 747.351562 688.257812 C 749.261719 687.515625 750.679688 687.578125 752.773438 688.503906 C 757.519531 690.660156 759.179688 696.265625 756.46875 700.332031 C 753.265625 705.078125 747.105469 705.140625 743.34375 700.582031 C 741.496094 698.300781 741.1875 694.847656 742.667969 692.261719 C 743.777344 690.351562 745.070312 689.179688 747.410156 688.316406 Z M 747.351562 688.257812" /><path fill="currentColor" fill-rule="nonzero" d="M 783.335938 809.832031 C 781.425781 805.273438 784.324219 799.726562 789.003906 798.863281 C 792.273438 798.25 794.367188 799.113281 796.832031 802.132812 C 801.207031 807.554688 795.90625 815.75 788.820312 814.457031 C 786.910156 814.085938 784.199219 811.804688 783.398438 809.832031 Z M 783.335938 809.832031" /><path fill="currentColor" fill-rule="nonzero" d="M 816.734375 720.730469 C 818.214844 723.195312 818.277344 726.707031 816.921875 728.925781 C 815.625 731.019531 812.667969 732.683594 810.203125 732.683594 C 802.746094 732.683594 799.296875 723.933594 804.78125 719.003906 C 806.445312 717.464844 806.8125 717.402344 809.585938 717.402344 C 813.40625 717.402344 815.316406 718.265625 816.734375 720.792969 Z M 816.734375 720.730469" /><path fill="currentColor" fill-rule="nonzero" d="M 839.535156 667.183594 C 839.78125 663.792969 840.890625 662.003906 843.601562 660.648438 C 845.941406 659.480469 848.101562 659.480469 850.503906 660.589844 C 853.03125 661.699219 854.386719 663.792969 854.695312 666.75 C 854.941406 669.769531 854.199219 671.804688 852.351562 673.652344 C 850.503906 675.378906 848.347656 675.992188 845.574219 675.4375 C 841.320312 674.699219 839.226562 671.863281 839.535156 667.242188 Z M 839.535156 667.183594" /><path fill="currentColor" fill-rule="nonzero" d="M 876.507812 782.289062 L 900.292969 782.289062 C 900.292969 782.289062 900.167969 832.570312 900.167969 832.570312 L 900.046875 882.914062 L 899 885.378906 C 896.84375 890.554688 893.207031 894.253906 888.09375 896.289062 L 885.628906 897.335938 L 806.8125 897.335938 L 806.691406 881.128906 C 806.628906 872.195312 806.691406 864 806.8125 862.890625 C 807.0625 860.917969 807.738281 860.238281 825.300781 842.617188 C 845.574219 822.28125 846.804688 820.925781 848.46875 817.414062 L 849.578125 814.949219 L 849.578125 800.46875 C 849.703125 785.125 849.886719 783.523438 851.796875 782.71875 C 852.289062 782.472656 863.445312 782.289062 876.507812 782.289062 Z M 876.507812 782.289062" /><path fill="currentColor" fill-rule="nonzero" d="M 818.398438 708.960938 C 815.007812 707.296875 814.824219 707.234375 810.203125 707.296875 C 806.382812 707.296875 804.964844 707.542969 802.933594 708.34375 C 799.296875 709.761719 795.414062 713.457031 793.441406 717.21875 C 792.023438 720.113281 791.902344 720.546875 791.902344 724.859375 C 791.902344 729.171875 791.964844 729.601562 793.441406 732.4375 C 796.152344 737.675781 801.328125 741.496094 806.875 742.175781 C 815.316406 743.222656 823.636719 738.96875 826.410156 732.253906 C 827.273438 730.15625 827.394531 730.035156 829.429688 729.851562 C 830.601562 729.726562 846.992188 729.726562 865.847656 729.851562 L 900.230469 730.097656 L 899.984375 772.121094 L 876.320312 772.121094 C 863.320312 772.246094 851.550781 772.429688 850.316406 772.554688 C 848.59375 772.800781 847.421875 773.292969 845.820312 774.464844 C 842.921875 776.683594 842.246094 777.484375 840.582031 780.871094 L 839.164062 783.769531 L 839.289062 799.113281 L 839.410156 814.457031 L 819.445312 834.480469 C 808.417969 845.511719 799.113281 855.246094 798.617188 856.109375 C 796.953125 859.4375 796.894531 860.425781 796.648438 878.910156 L 796.398438 897.394531 L 754.929688 897.394531 L 754.804688 874.71875 C 754.683594 854.632812 754.804688 851.921875 755.421875 850.6875 C 755.855469 849.949219 760.230469 845.082031 765.21875 840.027344 C 770.210938 834.914062 776.066406 828.9375 778.097656 826.777344 C 781.117188 823.636719 782.105469 822.898438 782.84375 823.144531 C 783.335938 823.265625 785.0625 823.699219 786.664062 824.128906 C 794.550781 826.039062 803.300781 821.542969 806.9375 813.902344 C 807.921875 811.804688 808.109375 810.820312 808.109375 807.121094 C 808.109375 803.117188 808.046875 802.625 806.507812 799.417969 C 804.535156 795.351562 801.945312 792.640625 798.003906 790.730469 C 790.609375 787.09375 780.871094 789.558594 775.941406 796.339844 C 772.492188 801.144531 771.566406 807.921875 773.785156 813.285156 L 774.957031 816.117188 L 764.050781 827.273438 C 750.492188 841.136719 747.84375 844.09375 746.300781 846.992188 L 745.070312 849.269531 L 744.578125 897.457031 L 703.105469 897.457031 L 702.859375 837.191406 L 710.625 829.242188 C 715.675781 824.066406 720.730469 818.953125 725.78125 813.777344 L 733.175781 806.199219 L 735.640625 807.121094 C 739.03125 808.417969 742.667969 808.355469 746.917969 806.875 C 753.945312 804.472656 757.824219 800.21875 759.179688 793.257812 C 759.859375 789.992188 759.242188 785.679688 757.765625 782.472656 C 756.347656 779.453125 752.894531 775.941406 749.628906 774.21875 C 747.042969 772.800781 746.363281 772.675781 742.175781 772.492188 C 737.800781 772.304688 737.429688 772.367188 734.65625 773.722656 C 725.535156 777.976562 721.160156 788.453125 724.921875 797.078125 L 725.96875 799.480469 L 710.6875 815.132812 C 700.148438 825.917969 695.097656 831.460938 694.417969 832.816406 C 692.691406 836.453125 692.507812 839.597656 692.507812 869.113281 L 692.507812 897.519531 L 655.105469 897.644531 C 629.285156 897.703125 616.835938 897.582031 614.925781 897.210938 C 608.148438 895.980469 602.664062 891.296875 600.386719 884.703125 L 599.277344 881.683594 L 599.277344 830.722656 L 607.964844 830.476562 C 612.769531 830.351562 621.398438 830.351562 627.25 830.476562 L 637.910156 830.722656 L 639.144531 833.1875 C 641.484375 837.933594 645.246094 840.953125 650.851562 842.554688 C 657.199219 844.402344 664.71875 842.0625 668.84375 837.132812 C 676.546875 827.765625 673.589844 814.515625 662.621094 809.339844 C 659.726562 807.921875 659.109375 807.863281 654.917969 807.863281 C 650.730469 807.863281 650.175781 807.984375 647.710938 809.15625 C 644.445312 810.820312 640.316406 814.824219 638.835938 817.90625 L 637.789062 820.1875 L 630.332031 820.308594 C 626.265625 820.433594 617.578125 820.433594 611.046875 820.308594 L 599.214844 820.1875 L 599.214844 730.28125 L 608.335938 730.035156 C 613.386719 729.910156 628.914062 729.910156 642.902344 729.910156 L 668.351562 730.035156 L 670.324219 732.191406 C 671.433594 733.425781 674.761719 737.121094 677.71875 740.449219 C 680.738281 743.835938 683.632812 747.042969 684.25 747.71875 L 685.296875 748.890625 L 684.25 750.863281 C 682.03125 754.992188 682.832031 764.480469 685.667969 768.609375 C 687.394531 771.074219 689.179688 772.613281 692.632812 774.402344 C 695.28125 775.757812 695.652344 775.820312 700.332031 775.820312 C 706.742188 775.820312 709.515625 774.769531 713.210938 771.136719 C 716.785156 767.5625 718.386719 763.433594 718.386719 757.765625 C 718.386719 754.066406 718.265625 753.390625 716.910156 750.738281 C 715.183594 747.164062 712.535156 744.699219 708.40625 742.667969 C 706.003906 741.433594 704.832031 741.1875 701.257812 741.003906 C 697.992188 740.820312 696.574219 741.003906 695.21875 741.496094 C 694.171875 741.925781 693.308594 742.234375 693.246094 742.234375 C 693.1875 742.234375 689.859375 738.660156 685.914062 734.285156 C 676.238281 723.625 675.191406 722.515625 672.234375 721.160156 L 669.707031 719.929688 L 634.460938 719.804688 L 599.214844 719.683594 L 599.335938 668.414062 L 599.460938 617.144531 L 601.1875 613.570312 C 604.453125 607.039062 609.996094 602.605469 616.160156 601.742188 C 618.007812 601.496094 688.808594 601.433594 692.136719 601.679688 C 692.382812 601.679688 692.445312 615.113281 692.382812 631.566406 L 692.261719 661.390625 L 689.917969 662.683594 C 682.339844 666.75 678.210938 674.328125 679.445312 682.03125 C 680.058594 685.851562 681.355469 688.441406 684.1875 691.277344 C 693.246094 700.332031 708.714844 697.992188 713.890625 686.714844 C 715.0625 684.1875 715.183594 683.449219 715.183594 679.199219 C 715.183594 674.945312 715.0625 674.207031 713.890625 671.863281 C 711.980469 668.042969 708.652344 664.59375 705.140625 662.929688 L 702.242188 661.511719 L 702.492188 631.75 C 702.613281 615.421875 702.796875 601.925781 702.921875 601.800781 C 703.105469 601.679688 741.25 601.496094 744.085938 601.617188 C 744.578125 601.617188 744.640625 609.628906 744.640625 640.128906 L 744.640625 678.644531 L 741.867188 680.0625 C 738.476562 681.785156 734.410156 685.730469 732.929688 688.8125 C 732.007812 690.78125 731.820312 691.707031 731.820312 695.773438 C 731.820312 699.839844 731.945312 700.828125 733.054688 703.105469 C 739.402344 716.601562 759.058594 717.402344 765.652344 704.339844 C 769.039062 697.621094 768.546875 691.277344 764.234375 685.421875 C 762.507812 683.078125 758.132812 679.8125 756.101562 679.257812 C 755.546875 679.136719 754.929688 678.582031 754.804688 678.027344 C 754.683594 677.535156 754.621094 660.15625 754.683594 639.453125 L 754.804688 601.863281 L 761.769531 601.554688 C 765.589844 601.433594 775.078125 601.433594 782.84375 601.554688 L 796.894531 601.800781 L 797.015625 626.820312 L 797.140625 651.839844 L 798.371094 654.550781 C 799.359375 656.644531 800.835938 658.433594 805.519531 663.054688 C 811.683594 669.03125 814.085938 670.941406 816.613281 671.804688 C 817.472656 672.050781 820.617188 672.542969 823.757812 672.851562 L 829.367188 673.40625 L 830.660156 675.871094 C 832.261719 679.074219 836.207031 682.773438 839.535156 684.375 C 841.816406 685.484375 842.675781 685.605469 846.867188 685.605469 C 851.058594 685.605469 851.859375 685.484375 854.386719 684.3125 C 857.773438 682.710938 862.085938 678.457031 863.320312 675.378906 L 864.183594 673.34375 L 872.5625 673.035156 C 883.222656 672.667969 890.679688 672.667969 895.917969 673.035156 L 900.046875 673.34375 L 899.800781 719.375 L 827.273438 719.621094 L 826.222656 717.15625 C 824.621094 713.398438 822.15625 710.933594 818.214844 708.960938 Z M 818.398438 708.960938" /><path fill="currentColor" fill-rule="nonzero" d="M 897.703125 611.96875 C 900.167969 616.46875 900.292969 617.578125 900.292969 640.929688 L 900.292969 662.4375 L 883.53125 662.4375 C 874.289062 662.5 866.402344 662.558594 866.03125 662.683594 C 864.984375 662.929688 864.550781 662.5 863.566406 660.21875 C 862.148438 657.074219 858.019531 652.886719 854.691406 651.34375 C 852.167969 650.175781 851.425781 650.050781 847.113281 650.050781 C 842.800781 650.050781 842.183594 650.175781 839.472656 651.53125 C 835.960938 653.253906 832.324219 656.828125 830.539062 660.21875 L 829.242188 662.683594 L 825.484375 662.683594 C 823.390625 662.683594 821.109375 662.5 820.433594 662.3125 C 819.753906 662.128906 816.613281 659.480469 813.222656 656.214844 L 807.246094 650.421875 L 807.121094 626.019531 L 807 601.679688 L 828.074219 601.554688 C 868.804688 601.308594 883.839844 601.554688 886.304688 602.296875 C 891.109375 603.898438 895.238281 607.347656 897.703125 611.96875 Z M 897.703125 611.96875" />
</svg>`,
    "users": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    "flag": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
    "zap": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    "building": `<svg width="18" height="18" viewBox="0 0 185 185" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path fill="currentColor" fill-rule="nonzero" d="M112.96,77.43s-.07.99-.17,2.16c-.11,1.18-.29,2.95-.38,3.94-.2,2.12-.21,2.15-.35,2.15-.07,0-.39-.23-.73-.5-1.49-1.2-1.75-1.3-2.15-.97-.1.09-.57.67-1.04,1.29-.41.54-.82,1.09-1.23,1.64-.28.37-.54.74-.82,1.11-.71.99-.89,1.22-1.94,2.61-1.27,1.68-1.79,2.39-1.94,2.67-.07.11-.25.36-.42.55-.37.39-.81.97-1.14,1.5-.13.21-.35.5-.49.66-.13.14-.57.71-.97,1.28-1.57,2.16-2.46,2.92-3.91,3.33-.69.2-2,.21-2.64.04-1.29-.35-2.05-.94-4.25-3.35-.55-.6-1.27-1.35-1.57-1.67-.3-.31-.78-.82-1.07-1.12-.5-.56-1.39-1.29-1.69-1.41-.5-.19-1.28-.12-1.86.16-.67.32-1.11.86-3.42,4.08-.52.72-1.25,1.72-1.61,2.21-.36.5-.89,1.24-1.18,1.65-.29.41-.69.97-.91,1.25-.21.28-.72.97-1.12,1.55-.62.88-.78,1.07-1.02,1.18-.46.22-.88.16-1.24-.18-.44-.41-.5-.9-.18-1.34.1-.14.46-.64.77-1.08.31-.45.84-1.17,1.17-1.6.32-.44.75-1.02.94-1.3s.46-.66.59-.82.38-.5.56-.75c.17-.25.59-.82.91-1.28.32-.45.82-1.12,1.08-1.49.27-.38.65-.89.85-1.14.2-.26.58-.75.84-1.12.57-.81,1.46-1.56,2.26-1.91.31-.14,1.39-.32,1.9-.32.57,0,1.47.19,1.88.39.5.25,1.78,1.34,2.3,1.98.23.28.6.67.84.88.23.2.54.53.71.73.32.41.44.53,1.82,1.98,1.58,1.67,1.99,1.91,3.11,1.87.9-.04,1.2-.2,2.07-1.09.65-.66,1.04-1.15,2.98-3.81,1.05-1.43,1.68-2.27,2.01-2.7.17-.22.9-1.19,1.64-2.16.72-.97,1.63-2.17,2.01-2.67.38-.5.84-1.13,1.01-1.4.18-.27.5-.71.72-.98.75-.92.87-1.15.74-1.57-.08-.3-.27-.49-1.28-1.24-.43-.32-.78-.62-.78-.67,0-.09,1.06-.56,2.51-1.12.59-.23,1.72-.67,2.51-.99.79-.31,1.64-.63,1.87-.71.24-.08.51-.19.62-.25s.2-.09.23-.08v-.03ZM121.74,86.34c-.47-2.1-.66-2.79-1.24-4.31-1.61-4.26-4.24-8.17-7.64-11.36-2.31-2.16-5.58-4.28-8.43-5.47-2.23-.93-3.91-1.47-5.91-1.87-1.8-.36-2.56-.48-3.79-.56-1.08-.08-3.26-.08-4.42,0-3.69.26-8.03,1.47-11.36,3.17-2.81,1.44-5.31,3.26-7.57,5.5-1.49,1.47-2.21,2.33-3.54,4.22-.78,1.11-2.01,3.26-2.62,4.63-1.3,2.89-2.12,5.91-2.51,9.35-.11.96-.11,4.58,0,5.65.36,3.46,1.4,7.07,2.93,10.12,1.64,3.27,3.35,5.62,5.98,8.2,2.49,2.44,4.62,3.97,7.61,5.47,4.25,2.13,8.72,3.24,13.16,3.24,4.81,0,9.24-1.09,13.74-3.36,3.82-1.94,7.36-4.91,10.11-8.49,2.56-3.34,4.26-6.82,5.24-10.74,1.17-4.66,1.25-8.86.27-13.38ZM114.15,80.36c-.06.43-.2,1.84-.32,3.12-.13,1.29-.26,2.46-.3,2.62-.1.37-.54.79-.99.92-.62.19-1.15,0-2.18-.77-.31-.24-.62-.44-.66-.44s-.62.74-1.27,1.65c-.67.9-2.67,3.58-4.45,5.96-1.77,2.37-3.38,4.52-3.56,4.77-.74,1.03-1.88,2.37-2.28,2.7-.85.7-1.65,1.09-2.91,1.42-.56.14-.71.16-1.57.13-.84-.03-1.02-.05-1.54-.23-1.3-.44-2.01-.9-3.09-2.02-.72-.75-.78-.8-3.07-3.26-1.85-1.97-2.13-2.23-2.43-2.28s-.71.07-.97.28c-.36.3-1.78,2.23-6.15,8.35-.97,1.36-1.92,2.65-2.12,2.85-.43.45-.84.69-1.41.78-1.07.2-2.21-.35-2.7-1.29-.25-.47-.3-.66-.29-1.2,0-.79.03-.82,2.56-4.26,1.42-1.92,3.05-4.17,4.04-5.55,2.37-3.3,3.08-4.02,4.52-4.55.87-.31,1.37-.4,2.34-.4s1.52.1,2.41.5c1.04.45,1.29.69,4.03,3.57.87.91,1.9,2.03,2.31,2.47.99,1.09,1.18,1.21,1.79,1.24.34.02.53,0,.67-.08.29-.14.89-.85,1.83-2.1.99-1.32,1.97-2.64,2.96-3.95,1.91-2.55,3.01-4.03,4.02-5.39.59-.79,1.17-1.58,1.75-2.38.28-.37.5-.69.5-.73,0-.03-.32-.3-.71-.58-1.09-.81-1.29-1.09-1.24-1.83.05-.75.39-1.05,1.91-1.64.47-.18,1.55-.61,2.42-.94.87-.34,1.63-.64,1.7-.68.07-.03.5-.2.94-.38.45-.18,1.09-.45,1.44-.59.56-.24.66-.27,1.06-.24.3.02.5.07.67.17.25.16.5.59.58.97.05.23-.09,1.98-.26,3.31l.04-.02ZM92.51,24.59L24.59,92.5l67.92,67.92,67.91-67.92L92.51,24.59ZM119.61,108.12c-1.68,2.79-3.82,5.37-6.23,7.52-1.66,1.48-2.8,2.34-4.58,3.47-1.28.81-2.22,1.3-3.59,1.91-3.4,1.49-6.63,2.34-10.22,2.67-1.18.1-4.15.1-5.06,0-4.34-.51-7.43-1.4-11.04-3.14-5.5-2.66-10.54-7.35-13.62-12.71-.83-1.44-1.91-3.82-2.44-5.35-.86-2.5-1.29-4.55-1.62-7.61-.11-1.11-.1-4.13.04-5.29.34-3.02.84-5.16,1.76-7.7,1.68-4.65,4.61-9.1,8.01-12.17,3.28-2.96,6.15-4.78,9.9-6.26,3.28-1.3,6.35-1.98,9.9-2.2,1.18-.08,3.68-.02,4.79.1,6.43.69,12.16,3.11,17.09,7.22,1.69,1.4,4.05,3.93,5.19,5.51.75,1.06,1.65,2.47,2.05,3.2,2.07,3.83,3.29,7.66,3.78,11.79.34,2.92.19,6.35-.42,9.34-.69,3.44-2.05,7.02-3.66,9.7h-.02ZM92.5,4.04l88.46,88.46-88.46,88.46L4.04,92.5,92.5,4.04M92.5,0L0,92.5l92.5,92.5,92.5-92.5L92.5,0Z" />
</svg>`,
    "globe": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',


    "military": `<svg width="18" height="18" viewBox="0 0 1500 1499.999933" xmlns="http://www.w3.org/2000/svg" fill="currentColor" preserveAspectRatio="xMidYMid meet"><path fill="currentColor" fill-opacity="1" fill-rule="evenodd" d="M 744.488281 313.234375 C 733.882812 314.4375 725.285156 318.5625 717.199219 326.328125 C 707.785156 335.367188 703.3125 344.355469 701.851562 357.183594 C 700.800781 366.410156 705.511719 382.277344 711.617188 390.078125 C 713.246094 392.164062 713.328125 395.09375 713.328125 452.589844 L 713.328125 512.917969 L 680.964844 513.203125 L 648.597656 513.484375 L 641.59375 516.949219 C 633.789062 520.808594 629.761719 524.847656 625.929688 532.675781 C 618.078125 548.710938 625.425781 568.5 642.398438 577.046875 C 648.097656 579.917969 656.085938 580.847656 675.054688 580.855469 L 692.242188 580.863281 L 692.242188 600.460938 C 692.242188 615.152344 691.953125 620.300781 691.082031 621.023438 C 689.011719 622.738281 671.898438 630.996094 660.617188 635.722656 C 647.355469 641.273438 638.796875 644.117188 623.03125 648.199219 C 608.703125 651.910156 603.476562 652.742188 576.734375 655.558594 C 555.011719 657.847656 550.742188 658.863281 544.359375 663.253906 C 535.242188 669.527344 529.890625 678.207031 528.171875 689.496094 C 527.515625 693.820312 527.296875 726.230469 527.507812 788.960938 C 527.839844 888.957031 527.738281 886.613281 532.804688 911.742188 C 540.195312 948.394531 563.097656 992.785156 591.957031 1026.394531 C 602.117188 1038.226562 625.597656 1061.089844 636.78125 1070.042969 C 653.875 1083.730469 672.675781 1096.851562 685.050781 1103.734375 C 688.40625 1105.597656 691.558594 1107.628906 692.058594 1108.242188 C 692.554688 1108.855469 693.628906 1111.972656 694.4375 1115.167969 C 699.464844 1134.964844 712.207031 1156.5625 728.058594 1172.152344 C 736.269531 1180.234375 746.058594 1186.820312 749.847656 1186.820312 C 757.074219 1186.820312 775.179688 1171.570312 786.085938 1156.296875 C 795.183594 1143.550781 803.191406 1126.4375 806.816406 1111.976562 C 807.671875 1108.570312 808.449219 1107.777344 814.40625 1104.253906 C 864.601562 1074.554688 908.691406 1032.765625 934.820312 990.125 C 950.292969 964.882812 959.8125 942.835938 965.835938 918.292969 C 972.613281 890.707031 972.304688 897.019531 972.304688 785.292969 L 972.304688 684.914062 L 969.242188 678.75 C 964.324219 668.859375 955.457031 661.160156 945.84375 658.4375 C 943.253906 657.703125 933.917969 656.425781 925.09375 655.59375 C 902.234375 653.441406 891.734375 651.757812 875.867188 647.710938 C 855.230469 642.445312 829.925781 632.59375 813.636719 623.484375 L 807.75 620.191406 L 807.75 580.863281 L 824.480469 580.835938 C 844.109375 580.800781 853.019531 579.824219 858.316406 577.121094 C 864.527344 573.953125 871.390625 566.804688 874.328125 560.441406 C 876.675781 555.363281 876.964844 553.730469 876.964844 545.570312 C 876.964844 537.101562 876.761719 536.054688 874.304688 531.875 C 870.09375 524.714844 864.847656 519.667969 858.269531 516.449219 L 852.214844 513.484375 L 819.667969 513.027344 L 787.125 512.566406 L 786.890625 452.695312 L 786.652344 392.824219 L 789.285156 388.984375 C 802.949219 369.03125 801.28125 345.117188 785.011719 327.722656 C 774.597656 316.59375 760.214844 311.449219 744.488281 313.234375 M 744.746094 331.5625 C 738.351562 332.824219 732.871094 335.730469 728.609375 340.113281 C 721.601562 347.320312 718.945312 355.972656 720.726562 365.796875 C 721.910156 372.308594 723.386719 375.445312 727.882812 380.992188 L 731.203125 385.09375 L 731.453125 449.078125 L 731.699219 513.0625 L 750.246094 512.816406 L 768.789062 512.566406 L 769.25 448.371094 L 769.707031 384.175781 L 773.230469 379.875 C 777.027344 375.242188 780.257812 366.542969 780.238281 360.996094 C 780.222656 356.371094 778.070312 348.695312 775.71875 344.894531 C 769.730469 335.203125 756.078125 329.328125 744.746094 331.5625 M 649.566406 532.238281 C 648.53125 532.660156 646.382812 534.480469 644.796875 536.285156 C 639.570312 542.238281 639.722656 550.117188 645.183594 556.160156 C 647.027344 558.199219 649.894531 560.1875 651.78125 560.730469 C 654.050781 561.390625 686.160156 561.613281 752.453125 561.425781 C 849.117188 561.15625 849.804688 561.140625 852.316406 559.261719 C 856.820312 555.902344 858.488281 552.816406 858.851562 547.1875 C 859.257812 540.808594 857.355469 536.507812 852.765625 533.441406 L 849.648438 531.359375 L 750.550781 531.417969 C 696.042969 531.449219 650.601562 531.820312 649.566406 532.238281 M 710.578125 841.984375 C 710.578125 1100.492188 710.597656 1103.179688 712.421875 1110.355469 C 714.753906 1119.546875 723.691406 1137.675781 730.003906 1146.027344 C 735.101562 1152.773438 746.085938 1164.132812 749.035156 1165.710938 C 752.65625 1167.652344 768.230469 1151.621094 776.527344 1137.410156 C 781.015625 1129.730469 786.328125 1116.796875 788.082031 1109.285156 C 789.300781 1104.078125 789.671875 965.820312 789.433594 605.84375 L 789.417969 580.863281 L 759.164062 580.863281 L 759.164062 1086.757812 L 756.847656 1089.511719 C 753.914062 1093 750.117188 1093.898438 746.414062 1091.980469 C 740.359375 1088.851562 740.832031 1110.722656 740.832031 833.007812 L 740.832031 580.863281 L 710.578125 580.863281 Z M 685.367188 644.320312 C 668.164062 653.277344 645.203125 661.628906 624.3125 666.53125 C 612.96875 669.191406 586.492188 673.074219 573.984375 673.910156 C 559.425781 674.886719 552.914062 677.808594 548.457031 685.371094 L 546.027344 689.496094 L 546.027344 783.460938 C 546.027344 883.9375 546.117188 886.375 550.703125 906.761719 C 559.332031 945.121094 578.914062 983.34375 606.128906 1014.933594 C 615.195312 1025.457031 634.386719 1044.257812 645.03125 1053.039062 C 649.570312 1056.785156 653.488281 1060.054688 653.742188 1060.308594 C 657.046875 1063.632812 690.238281 1085.980469 691.875 1085.980469 C 692.078125 1085.980469 692.242188 985.941406 692.242188 863.675781 C 692.242188 741.40625 691.933594 641.386719 691.554688 641.410156 C 691.179688 641.433594 688.394531 642.746094 685.367188 644.320312 M 807.75 863.675781 C 807.75 985.941406 807.910156 1085.980469 808.105469 1085.980469 C 808.78125 1085.980469 827.902344 1074.074219 832.707031 1070.660156 C 849.195312 1058.949219 863.882812 1046.335938 880.460938 1029.640625 C 892.707031 1017.308594 901.246094 1007.039062 911.023438 992.878906 C 929.496094 966.128906 939.511719 944.878906 947.601562 915.257812 C 954.054688 891.632812 953.742188 897.660156 954.140625 790.121094 C 954.398438 721.304688 954.210938 691.636719 953.5 689 C 952.949219 686.945312 951.042969 683.65625 949.265625 681.691406 C 944.582031 676.507812 938.65625 674.605469 923.511719 673.433594 C 882.433594 670.246094 847.878906 661.03125 814.878906 644.460938 C 811.488281 642.761719 808.496094 641.367188 808.234375 641.367188 C 807.96875 641.367188 807.75 741.40625 807.75 863.675781 "/></svg>`,

  };

  const normalizedType = iconType?.toLowerCase();
  return iconMap[normalizedType] || iconMap[iconType] || iconMap["map-pin"];
}

// Country Icons Editor Component
function CountryIconsEditor({
  icons,
  timelinePoints,
  onUpdate,
  onEdit,
}: {
  icons: CountryIcon[];
  timelinePoints: Array<{ id: string; label: string; date?: string; year?: string }>;
  onUpdate: (icons: CountryIcon[]) => void;
  onEdit: (icon: CountryIcon) => void;
}) {
  const handleDelete = (id: string) => {
    onUpdate(icons.filter(i => i.id !== id));
  };

  return (
    <div className="mb-6 p-6 bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Country Icons ({icons.length})</h3>
      </div>

      {icons.length === 0 ? (
        <p className="text-gray-400 text-sm">No icons placed yet. Use "Place Icons" mode to add icons to countries.</p>
      ) : (
        <div className="space-y-3">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="p-4 bg-slate-700/50 border border-slate-600/50 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold">{icon.country}</span>
                    <span className="text-xs text-gray-400">({icon.coordinates[0].toFixed(2)}, {icon.coordinates[1].toFixed(2)})</span>
                  </div>
                  <p className="text-sm text-gray-200 font-medium mb-1">{icon.title || "Untitled"}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{icon.description || "No description"}</p>
                  {icon.timelinePointId && (
                    <p className="text-xs text-blue-400 mt-1">
                      Linked to: {timelinePoints.find(p => p.id === icon.timelinePointId)?.label || icon.timelinePointId}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onEdit(icon)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                    title="Edit icon"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(icon.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete icon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Icon Editor Modal Component
function IconEditorModal({
  icon,
  timelinePoints,
  onSave,
  onCancel,
}: {
  icon: CountryIcon;
  timelinePoints: Array<{ id: string; label: string; date?: string; year?: string }>;
  onSave: (icon: CountryIcon) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(icon.title);
  const [description, setDescription] = useState(icon.description);
  const [iconType, setIconType] = useState(icon.iconType);
  const [timelinePointId, setTimelinePointId] = useState(icon.timelinePointId || "");

  const iconTypes = [
    { value: "map-pin", label: "Location Pin" },
    { value: "military", label: "Military" },
    { value: "shield", label: "Shield" },
    { value: "users", label: "Users/Alliance" },
    { value: "flag", label: "Flag" },
    { value: "zap", label: "Event" },
    { value: "building", label: "Building" },
    { value: "globe", label: "Globe" },
  ];

  const handleSave = () => {
    onSave({
      ...icon,
      title,
      description,
      iconType,
      timelinePointId: timelinePointId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Icon - {icon.country}</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Icon Type</label>
              <select
                value={iconType}
                onChange={(e) => setIconType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-white rounded-lg"
              >
                {iconTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter icon title"
                className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter icon description"
                rows={4}
                className="w-full px-3 py-2 border border-slate-600/50 bg-slate-800 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Link to Timeline Point (Optional)</label>
              <select
                value={timelinePointId}
                onChange={(e) => setTimelinePointId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-white rounded-lg"
              >
                <option value="">None</option>
                {timelinePoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.label} ({point.date || point.year || ''})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                If linked, icon will appear when this timeline point is active
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!title.trim() || !description.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Icon
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-700 text-gray-200 rounded-lg hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
