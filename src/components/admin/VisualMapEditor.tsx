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
  useEffect(() => {
    const newIcons = event.countryIcons || [];
    setCountryIcons(newIcons);
    console.log("🔄 VisualMapEditor: Synced countryIcons from event:", newIcons.length, "icons", newIcons.map(i => ({ country: i.country, iconType: i.iconType, coordinates: i.coordinates })));
  }, [event.countryIcons]);

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
            className={`p-4 rounded-lg shadow-xl border backdrop-blur-sm ${
              notification.type === 'success'
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
    if (!map) return;

    const setupIcons = () => {
      if (!map.isStyleLoaded()) {
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

      // Remove old markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // Add new markers
      visibleIcons.forEach((icon) => {
        const el = document.createElement("div");
        el.className = "country-icon-marker";
        el.style.width = "40px";
        el.style.height = "40px";
        el.style.cursor = "pointer";
        el.style.position = "relative";

        // Create marker HTML
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
              ${getIconSVG(icon.iconType)}
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
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([icon.coordinates[1], icon.coordinates[0]])
          .addTo(map);

        markersRef.current.set(icon.id, marker);
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
    "map-pin": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    "shield": '<svg width="18" height="18" viewBox="0 0 1500 1500" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M 750.03125 188.207031 L 1311.792969 749.96875 L 750.03125 1311.730469 L 188.207031 750.03125 L 750.03125 188.207031 M 731.046875 535.082031 C 722.574219 537.0625 717.46875 540.308594 705.875 548.117188 C 693.378906 556.589844 675.238281 565.71875 660.757812 570.945312 C 639.492188 578.757812 620.085938 582.601562 595.9375 583.800781 C 585.726562 584.28125 580.378906 585.0625 573.230469 588.609375 C 562.296875 594.136719 554.90625 602.785156 550.699219 615.042969 C 548.777344 620.328125 548.777344 621.230469 548.660156 697.464844 C 548.539062 772.078125 548.839844 777.726562 548.957031 779.707031 C 551 814.070312 562.894531 848.734375 583.382812 879.914062 C 591.914062 892.828125 601.703125 904.84375 614.441406 917.699219 C 640.875 944.191406 671.152344 965.277344 707.136719 982.21875 C 721.792969 989.1875 730.265625 992.253906 741.621094 992.253906 C 753.515625 992.253906 765.828125 987.328125 783.070312 978.734375 C 805.359375 967.5625 825.664062 954.585938 845.007812 938.90625 C 873.542969 915.777344 896.371094 888.683594 911.03125 860.449219 C 922.207031 839 929.953125 814.910156 932.777344 792.503906 C 934.21875 780.367188 934.402344 770.515625 934.339844 696.441406 L 934.160156 623.511719 L 934.160156 620.507812 C 934.160156 620.507812 933.199219 617.683594 933.199219 617.683594 L 932.238281 614.859375 C 928.152344 602.726562 921.003906 594.375 909.769531 588.609375 L 909.648438 588.609375 C 909.648438 588.609375 909.53125 588.488281 909.53125 588.488281 C 902.019531 584.824219 896.433594 584.222656 886.339844 583.742188 C 876.488281 583.261719 872.761719 582.902344 864.113281 581.578125 C 845.429688 578.816406 827.886719 573.648438 807.28125 564.757812 C 798.03125 560.734375 781.328125 551.363281 774.722656 546.433594 C 765.050781 539.285156 755.976562 534.480469 742.941406 534 C 742.160156 534 741.378906 534 740.597656 534 C 736.875 534 733.929688 534.300781 731.347656 534.960938 M 750.03125 162.734375 L 162.734375 750.03125 L 749.96875 1337.265625 L 1337.203125 750.03125 Z M 741.4375 974.230469 C 734.109375 974.230469 728.703125 972.546875 714.707031 965.941406 C 680.644531 949.898438 651.988281 929.953125 627.117188 904.964844 C 615.460938 893.1875 606.332031 882.136719 598.402344 870 C 579.777344 841.703125 568.722656 809.683594 566.921875 778.625 C 566.679688 774 566.5625 745.222656 566.679688 697.464844 C 566.742188 623.992188 566.742188 623.570312 567.703125 621.046875 C 570.34375 613.238281 574.671875 608.074219 581.398438 604.707031 C 585.363281 602.726562 588.066406 602.246094 596.839844 601.824219 C 622.671875 600.503906 644.117188 596.238281 667.007812 587.886719 C 683.105469 582.058594 702.449219 572.207031 716.027344 563.078125 C 727.683594 555.265625 730.324219 553.765625 735.371094 552.625 C 736.574219 552.324219 738.375 552.203125 740.359375 552.203125 C 740.957031 552.203125 741.558594 552.203125 742.160156 552.203125 C 749.609375 552.441406 755.136719 554.664062 763.726562 561.09375 C 771.476562 566.800781 789.320312 576.894531 799.832031 581.460938 C 821.699219 590.832031 840.921875 596.597656 861.230469 599.542969 C 870.421875 600.984375 874.746094 601.34375 885.257812 601.882812 C 894.75 602.304688 897.273438 602.785156 901.359375 604.769531 C 908.328125 608.3125 912.414062 613.058594 914.996094 620.6875 L 916.015625 623.570312 L 916.199219 696.503906 C 916.257812 770.273438 916.136719 779.40625 914.816406 790.339844 C 912.234375 810.527344 905.082031 832.691406 894.992188 852.15625 C 881.472656 878.230469 860.207031 903.402344 833.59375 924.910156 C 815.390625 939.628906 796.226562 952.003906 774.960938 962.636719 C 757.960938 971.105469 748.886719 974.289062 741.558594 974.289062 Z M 741.4375 974.230469"/><path fill="currentColor" d="M 635.40625 769.433594 C 635.40625 765.289062 636.308594 763.726562 641.414062 758.800781 C 643.996094 756.335938 647.960938 752.671875 650.304688 750.570312 C 652.648438 748.589844 657.875 743.78125 661.960938 739.878906 C 666.046875 735.972656 673.074219 729.304688 677.640625 725.160156 C 691.097656 712.722656 718.609375 687.191406 726.300781 679.984375 C 733.75 672.894531 735.671875 671.453125 738.316406 670.492188 C 740.777344 669.589844 742.941406 669.769531 745.703125 671.089844 C 748.707031 672.59375 750.929688 674.515625 760.722656 683.828125 C 768.050781 690.796875 792.503906 713.625 806.742188 726.78125 C 810.40625 730.085938 813.949219 733.449219 817.554688 736.753906 C 821.097656 740.058594 824.761719 743.421875 828.367188 746.726562 C 839.902344 757.359375 844.46875 761.746094 845.371094 763.1875 C 848.253906 767.453125 847.773438 773.757812 844.226562 777.484375 C 842.003906 779.828125 839.960938 780.667969 836.417969 780.667969 C 832.273438 780.667969 830.171875 779.527344 824.042969 773.578125 C 821.398438 771.117188 817.976562 767.871094 816.472656 766.492188 C 815.089844 765.167969 809.984375 760.484375 805.238281 756.097656 C 793.105469 744.804688 786.976562 739.15625 778.925781 731.765625 C 775.082031 728.28125 767.8125 721.554688 762.707031 716.808594 C 757.71875 712.0625 752.433594 707.257812 751.050781 705.996094 C 749.667969 704.734375 747.328125 702.570312 745.765625 701.1875 C 743.300781 698.847656 742.761719 698.605469 741.257812 698.605469 C 739.457031 698.605469 740.898438 697.285156 719.753906 717.046875 C 714.585938 721.855469 706.777344 729.003906 702.449219 732.96875 C 698.125 736.875 693.921875 740.839844 693.140625 741.621094 C 692.296875 742.460938 689.835938 744.863281 687.492188 746.847656 C 685.269531 748.949219 679.203125 754.476562 674.214844 759.222656 C 654.390625 777.964844 654.03125 778.265625 651.386719 779.585938 C 649.042969 780.726562 648.382812 780.847656 646.101562 780.667969 C 639.792969 780.246094 635.40625 775.621094 635.40625 769.433594 Z"/><path fill="currentColor" d="M 907.605469 696.921875 C 907.546875 626.996094 907.425781 625.675781 906.707031 623.089844 C 905.5625 619.605469 903.640625 616.722656 901.058594 614.621094 C 896.554688 611.078125 894.8125 610.65625 884.539062 610.113281 C 873.003906 609.515625 856.601562 607.472656 846.332031 605.308594 C 818.035156 599.242188 791.660156 588.609375 767.691406 573.589844 C 764.269531 571.425781 760.542969 569.023438 759.402344 568.183594 C 753.152344 563.855469 750.75 562.355469 748.589844 561.515625 C 745.523438 560.371094 739.9375 560.011719 736.453125 560.851562 C 732.546875 561.753906 730.386719 562.835938 725.578125 566.441406 C 719.753906 570.765625 715.605469 573.410156 706.65625 578.574219 C 676.015625 596.117188 639.972656 607.171875 604.886719 609.632812 C 601.464844 609.875 596.175781 610.296875 593.175781 610.476562 C 588.609375 610.835938 587.347656 611.078125 585.363281 611.976562 C 581.21875 613.960938 577.496094 618.285156 575.8125 623.03125 C 575.089844 625.195312 574.789062 777.242188 575.570312 784.332031 C 576.292969 791.722656 577.976562 800.191406 580.617188 810.644531 C 584.34375 825.363281 591.492188 842.546875 599.363281 855.761719 C 608.914062 871.621094 618.527344 884.417969 630.121094 896.132812 C 653.851562 920.28125 678.480469 938.183594 710.5 954.585938 C 718.972656 958.910156 728.945312 963.117188 734.109375 964.558594 C 741.859375 966.660156 748.167969 965.640625 760.363281 960.351562 C 768.894531 956.628906 780.308594 950.621094 792.742188 943.230469 C 814.308594 930.496094 838.820312 911.152344 854.019531 894.75 C 859.246094 889.042969 866.636719 880.453125 869.578125 876.546875 C 872.402344 872.824219 879.492188 862.070312 882.976562 856.363281 C 886.160156 851.136719 892.886719 837.320312 895.710938 830.230469 C 900.636719 818.214844 904.542969 803.136719 906.40625 789.679688 C 907.546875 781.269531 907.789062 768.171875 907.667969 696.984375 Z M 630.058594 758.859375 C 631.082031 757.179688 634.386719 753.875 641.835938 746.964844 C 647.542969 741.679688 658.957031 731.105469 667.066406 723.476562 C 675.296875 715.847656 686.769531 705.214844 692.660156 699.808594 C 698.546875 694.398438 708.21875 685.449219 714.105469 679.863281 C 730.804688 664.183594 731.765625 663.402344 737.355469 662.199219 C 741.980469 661.117188 747.507812 662.140625 751.832031 664.785156 C 752.914062 665.445312 759.222656 671.089844 765.949219 677.398438 C 777.425781 688.210938 808.785156 717.410156 814.851562 722.816406 C 822.601562 729.90625 843.746094 749.488281 847.472656 753.035156 C 850.234375 755.675781 852.097656 758.019531 852.9375 759.523438 C 859.007812 770.816406 853.839844 784.210938 841.886719 788.175781 C 835.996094 790.160156 828.488281 788.359375 822.960938 783.671875 C 821.820312 782.652344 818.757812 779.945312 816.050781 777.425781 C 810.226562 772.015625 802.777344 765.109375 789.800781 753.332031 C 784.511719 748.347656 778.023438 742.398438 775.5 739.9375 C 772.980469 737.472656 767.753906 732.726562 763.847656 729.242188 C 759.941406 725.699219 754.296875 720.351562 751.113281 717.347656 C 748.046875 714.34375 744.5625 711.101562 743.363281 710.140625 L 741.199219 708.398438 L 738.375 710.558594 C 736.8125 711.820312 733.808594 714.527344 731.648438 716.6875 C 727.382812 720.953125 720.351562 727.5 714.644531 732.546875 C 712.664062 734.230469 708.578125 738.015625 705.515625 741.019531 C 702.332031 744.023438 698.367188 747.925781 696.441406 749.550781 C 685.148438 759.820312 672.59375 771.476562 668.269531 775.683594 C 657.214844 786.375 654.089844 788.476562 648.023438 788.777344 C 640.632812 789.257812 634.144531 786.015625 630.242188 779.945312 C 626.035156 773.460938 625.855469 765.410156 629.878906 758.679688 Z M 843.6875 854.5 C 840.382812 856.0625 835.15625 856.421875 831.132812 855.339844 C 826.386719 854.019531 824.824219 852.757812 807.703125 837.078125 C 803.316406 832.933594 795.144531 825.425781 789.679688 820.496094 C 784.210938 815.453125 777.726562 809.382812 775.140625 806.980469 C 772.679688 804.578125 767.332031 799.652344 763.367188 796.046875 C 759.402344 792.382812 754.175781 787.578125 751.710938 785.234375 C 749.308594 783.011719 746.003906 780.007812 744.324219 778.503906 L 741.320312 775.742188 L 737.234375 779.40625 C 732.066406 784.03125 719.933594 795.265625 712.484375 802.234375 C 709.300781 805.238281 704.253906 809.863281 701.1875 812.628906 C 697.644531 815.871094 694.039062 819.117188 690.554688 822.421875 C 687.730469 825.003906 683.585938 828.789062 681.242188 830.890625 C 679.019531 832.992188 673.914062 837.679688 670.011719 841.464844 C 657.632812 853.359375 654.210938 855.582031 647.78125 855.941406 C 639.550781 856.363281 632.582031 852.277344 629.039062 844.886719 C 627.535156 841.703125 627.296875 840.921875 627.117188 837.738281 C 626.9375 833.414062 627.777344 829.75 629.699219 826.625 C 630.960938 824.464844 639.851562 815.753906 648.625 807.941406 C 650.847656 805.960938 654.628906 802.535156 657.035156 800.191406 C 662.921875 794.546875 674.695312 783.671875 680.464844 778.6875 C 682.925781 776.34375 686.769531 772.859375 688.933594 770.695312 C 691.15625 768.59375 698.484375 761.804688 705.394531 755.496094 C 712.183594 749.25 720.351562 741.738281 723.476562 738.734375 C 729.605469 732.726562 733.027344 730.625 737.65625 729.605469 C 741.078125 728.882812 742.21875 728.882812 745.402344 729.605469 C 749.789062 730.6875 752.492188 732.429688 758.441406 738.074219 C 763.425781 742.820312 773.640625 752.371094 781.929688 759.824219 C 783.671875 761.382812 788.058594 765.53125 791.722656 768.953125 C 798.628906 775.441406 806.320312 782.46875 818.875 793.886719 C 822.960938 797.550781 826.265625 800.613281 826.324219 800.855469 C 826.324219 801.035156 829.328125 803.738281 832.8125 806.859375 C 843.507812 816.234375 850.777344 823.140625 852.097656 825.304688 C 854.261719 828.609375 855.582031 832.933594 855.582031 836.539062 C 855.523438 844.527344 851.078125 851.257812 843.628906 854.621094 Z M 840.683594 825.0625 C 833.472656 818.394531 827.167969 812.628906 817.496094 803.558594 C 803.558594 790.519531 797.550781 784.933594 792.382812 780.308594 C 785.234375 774 776.824219 766.191406 776.28125 765.347656 C 775.921875 764.929688 773.640625 762.765625 771.054688 760.542969 C 766.070312 756.21875 760.363281 750.992188 753.515625 744.625 C 747.386719 738.917969 745.285156 737.535156 742.039062 737.292969 C 740.359375 737.234375 738.796875 737.355469 737.773438 737.714844 C 735.3125 738.617188 733.027344 740.359375 729.785156 743.601562 C 726.960938 746.484375 720.171875 752.792969 706.535156 765.347656 C 702.992188 768.652344 698.425781 772.917969 696.382812 774.722656 C 694.402344 776.523438 689.292969 781.207031 685.089844 785.113281 C 680.945312 789.019531 675.957031 793.585938 674.15625 795.328125 C 672.351562 797.007812 668.566406 800.492188 665.863281 802.957031 C 659.078125 809.203125 642.796875 824.28125 639.613281 827.347656 C 635.464844 831.25 634.386719 835.757812 636.1875 840.742188 C 637.75 845.007812 641.472656 847.53125 646.101562 847.53125 C 651.085938 847.53125 652.40625 846.628906 666.527344 833.414062 C 675.238281 825.304688 687.3125 814.070312 694.941406 807.101562 C 703.652344 799.050781 710.859375 792.382812 718.011719 785.773438 C 730.023438 774.480469 737.714844 767.390625 738.496094 766.851562 C 739.398438 766.25 740.660156 766.011719 742.339844 766.191406 C 742.941406 766.191406 744.984375 767.871094 747.566406 770.273438 C 749.910156 772.496094 756.277344 778.386719 761.746094 783.492188 C 767.210938 788.476562 775.261719 795.867188 779.585938 799.832031 C 783.914062 803.917969 788.660156 808.121094 790.039062 809.382812 C 791.363281 810.644531 794.847656 813.890625 797.667969 816.472656 C 800.492188 819.054688 806.980469 825.003906 812.148438 829.75 C 817.3125 834.375 823.203125 839.902344 825.363281 841.882812 C 829.871094 846.03125 832.152344 847.292969 835.515625 847.53125 C 841.886719 848.011719 847.050781 843.144531 847.050781 836.597656 C 847.050781 831.851562 846.148438 830.230469 840.5625 825.125 Z"/><path fill="currentColor" d="M 749.308594 318.8125 L 318.148438 750.03125 L 749.371094 1181.25 L 1180.46875 750.03125 Z"/></svg>',
    "users": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    "flag": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
    "zap": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    "building": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><line x1="9" y1="6" x2="9" y2="10"></line><line x1="12" y1="6" x2="12" y2="10"></line><line x1="15" y1="6" x2="15" y2="10"></line><line x1="9" y1="14" x2="9" y2="18"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="15" y1="14" x2="15" y2="18"></line></svg>',
    "globe": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  };

  return iconMap[iconType] || iconMap["map-pin"];
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
