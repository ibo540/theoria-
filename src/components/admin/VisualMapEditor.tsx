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
                alert(`Shape detected ${detectedCountries.length} countr${detectedCountries.length === 1 ? 'y' : 'ies'}: ${detectedCountries.join(', ')}`);
              } else {
                alert('No countries detected in this shape. You may need to adjust the shape or manually add countries.');
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
                      {Object.entries(THEORY_COLORS_DARK).map(([theory, color]) => {
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
                      })}
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
                      {Object.entries(THEORY_COLORS_DARK).map(([theory, color]) => {
                        const theoryName = theory.charAt(0).toUpperCase() + theory.slice(1).replace(/([A-Z])/g, ' $1').trim();
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
                      })}
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
                      {Object.entries(THEORY_COLORS_DARK).map(([theory, c]) => {
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
              color: line.color || "#d4af37", // Enhanced gold color
              thickness: line.thickness || 3.5,
              opacity: line.opacity !== undefined ? line.opacity : 0.85,
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
          (feature.properties as any).color = line.color || "#d4af37"; // Enhanced gold color
          (feature.properties as any).thickness = line.thickness || 3.5;
          (feature.properties as any).opacity = line.opacity !== undefined ? line.opacity : 0.85;
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
            paint: {
              "line-color": ["get", "color"],
              "line-width": 2.5,
              "line-opacity": 0.9,
              "line-cap": "round",
              "line-join": "round",
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

            // Add glow layer
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
                  ["+", ["get", "thickness"], 4],
                  10,
                  ["+", ["get", "thickness"], 6],
                ],
                "line-opacity": [
                  "*",
                  ["get", "opacity"],
                  0.3
                ],
                "line-blur": 3,
              },
            }, beforeId);

            // Add main line layer
            map.addLayer({
              id: lineLayerId,
              type: "line",
              source: lineSourceId,
              paint: {
                "line-color": ["get", "color"],
                "line-width": ["get", "thickness"],
                "line-opacity": ["get", "opacity"],
                "line-cap": "round",
                "line-join": "round",
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

          // Add glow layer
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
                ["+", ["get", "thickness"], 4],
                10,
                ["+", ["get", "thickness"], 6],
              ],
              "line-opacity": [
                "*",
                ["get", "opacity"],
                0.3
              ],
              "line-blur": 3,
            },
          }, beforeId);

          // Add main line layer
          map.addLayer({
            id: lineLayerId,
            type: "line",
            source: lineSourceId,
            paint: {
              "line-color": ["get", "color"],
              "line-width": ["get", "thickness"],
              "line-opacity": ["get", "opacity"],
              "line-cap": "round",
              "line-join": "round",
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
      const visibleIcons = icons.filter((icon) => {
        if (!icon.timelinePointId) return true; // Always show icons without timeline linkage
        if (!activeTimelinePointId) return false; // Hide timeline-linked icons if no point is active
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
    "shield": '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
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
