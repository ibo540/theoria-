"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CONFIG, MAP_COLORS } from "@/lib/map-config";

interface InteractiveMapProps {
  highlightedCountries: string[];
  countryColors?: Record<string, string>; // Map of country name to color
  onCountryClick: (countryName: string, clickEvent?: { point: { x: number; y: number } }) => void;
  onCountryHover?: (countryName: string | null) => void;
  selectedCountries?: string[]; // Countries selected for unified area
  connectionFrom?: string | null; // Country selected as "from" for connection
  mapInstance?: React.MutableRefObject<maplibregl.Map | null>;
}

export default function InteractiveMap({
  highlightedCountries,
  countryColors = {},
  onCountryClick,
  onCountryHover,
  selectedCountries = [],
  connectionFrom = null,
  mapInstance,
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoveredCountryId = useRef<string | null>(null);
  const mapReady = useRef<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply monochrome dark style to match main page
  function applyMonochromeStyle(map: maplibregl.Map): void {
    const style = map.getStyle();
    if (!style?.layers) return;

    interface MapLayer {
      id: string;
      type: "symbol" | "background" | "fill" | "line";
      "source-layer"?: string;
    }

    for (const layer of style.layers) {
      const layerId = layer.id;
      const layerType = (layer as MapLayer).type;
      const sourceLayer = (layer as MapLayer)["source-layer"];
      const layerIdLower = layerId.toLowerCase();

      switch (layerType) {
        case "symbol":
          map.setLayoutProperty(layerId, "visibility", "none");
          break;

        case "background":
          map.setPaintProperty(
            layerId,
            "background-color",
            MAP_COLORS.background
          );
          break;

        case "fill": {
          const isWater =
            layerIdLower.includes("water") || sourceLayer?.includes("water");
          map.setPaintProperty(
            layerId,
            "fill-color",
            isWater ? MAP_COLORS.water : MAP_COLORS.land
          );
          map.setPaintProperty(layerId, "fill-opacity", 1);
          break;
        }

        case "line": {
          const isBoundary =
            layerIdLower.includes("boundary") ||
            layerIdLower.includes("admin") ||
            sourceLayer?.includes("boundary") ||
            sourceLayer?.includes("admin");

          if (isBoundary) {
            map.setPaintProperty(layerId, "line-color", MAP_COLORS.boundary);
            map.setPaintProperty(layerId, "line-opacity", 0.7);
            map.setPaintProperty(layerId, "line-width", 1.2);
          } else {
            map.setPaintProperty(layerId, "line-color", MAP_COLORS.line);
            map.setPaintProperty(layerId, "line-opacity", 0.4);
          }
          break;
        }
      }
    }
  }

  // Expose map instance to parent if requested
  useEffect(() => {
    if (mapInstance && map.current) {
      (mapInstance as any).current = map.current;
    }
  }, [mapInstance, map.current]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    setLoading(true);
    setError(null);

    // Add a timeout for the entire map initialization
    const initTimeout = setTimeout(() => {
      if (loading && !mapReady.current) {
        console.error("Map initialization timeout");
        setError("Map is taking too long to load. Please check your internet connection and try refreshing.");
        setLoading(false);
      }
    }, 20000); // 20 second total timeout

    try {
      console.log("Initializing map...");
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_CONFIG.style,
        center: MAP_CONFIG.initialCenter,
        zoom: 2,
      });

      // Handle map errors
      map.current.on("error", (e) => {
        clearTimeout(initTimeout);
        console.error("Map error:", e);
        setError(`Failed to load map base style: ${e.error?.message || "Unknown error"}. Please check your internet connection.`);
        setLoading(false);
      });

      // Handle style loading errors
      map.current.on("style.loading", () => {
        console.log("Map style is loading...");
      });

      map.current.on("style.error", (e) => {
        clearTimeout(initTimeout);
        console.error("Map style error:", e);
        setError("Failed to load map style. Please check your internet connection.");
        setLoading(false);
      });

      map.current.on("load", () => {
        clearTimeout(initTimeout);
        if (!map.current) return;

        // Apply dark monochrome style like main page
        applyMonochromeStyle(map.current);

        console.log("Map base style loaded, fetching GeoJSON...");

        // Add timeout for fetch
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
          controller.abort();
          timeoutId = null;
        }, 15000); // 15 second timeout

        const clearTimeoutSafe = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };

        // Load countries GeoJSON
        fetch("/geo/countries.geojson", {
          cache: "no-cache",
          signal: controller.signal,
        })
          .then(async (res) => {
            clearTimeoutSafe();
            console.log("GeoJSON fetch response:", res.status, res.statusText);
            if (!res.ok) {
              throw new Error(`Failed to load countries data: ${res.status} ${res.statusText}`);
            }
            const contentType = res.headers.get("content-type");
            console.log("Content-Type:", contentType);
            if (!contentType || (!contentType.includes("application/json") && !contentType.includes("text/plain"))) {
              console.warn("Unexpected content type, but continuing...");
            }
            return res.json();
          })
          .then((data) => {
            console.log("GeoJSON data received, features:", data?.features?.length);
            if (!data || !data.features) {
              throw new Error("Invalid GeoJSON data structure");
            }
            if (!map.current) {
              console.error("Map instance is null");
              return;
            }

            try {
              // Add source
              map.current.addSource("countries", {
                type: "geojson",
                data: data,
              });
              console.log("Countries source added");

              // Add base fill layer (dark theme to match main page)
              map.current.addLayer({
                id: "countries-base",
                type: "fill",
                source: "countries",
                paint: {
                  "fill-color": MAP_COLORS.land,
                  "fill-opacity": 0.3, // Subtle visibility for dark theme
                },
              });
              console.log("Base layer added");

              // Add fill layer for highlights (on top of base) with individual colors
              // Build the color expression properly - case expression needs at least condition + value + default
              let colorExpression: any;

              if (highlightedCountries.length > 0) {
                colorExpression = ["case"];
                highlightedCountries.forEach((country) => {
                  const color = countryColors[country] || "#5a4f3f";
                  // Check both 'name' (lowercase) and 'NAME' (uppercase) properties
                  colorExpression.push([
                    "any",
                    ["==", ["get", "name"], country],
                    ["==", ["get", "NAME"], country]
                  ]);
                  colorExpression.push(color);
                });
                colorExpression.push("transparent");
              } else {
                // If no countries highlighted, just use transparent
                colorExpression = "transparent";
              }

              map.current.addLayer({
                id: "countries-highlight",
                type: "fill",
                source: "countries",
                paint: {
                  "fill-color": colorExpression,
                  "fill-opacity": 0.75,
                },
              });
              console.log("Highlight layer added");

              // Add border layer (dark theme)
              map.current.addLayer({
                id: "countries-border",
                type: "line",
                source: "countries",
                paint: {
                  "line-color": MAP_COLORS.boundary,
                  "line-width": 0.5,
                  "line-opacity": 0.5,
                },
              });
              console.log("Border layer added");

              // Click handler - attach to the map canvas directly
              const handleMapClick = (e: maplibregl.MapMouseEvent) => {
                if (!map.current) return;

                console.log("Map clicked at:", e.point);
                console.log("LngLat:", e.lngLat);

                // Try querying all layers
                const allFeatures = map.current.queryRenderedFeatures(e.point);
                console.log("All features at point:", allFeatures.length);

                // Query specific country layers
                const features = map.current.queryRenderedFeatures(e.point, {
                  layers: ["countries-base", "countries-highlight", "countries-border"],
                });

                console.log("Country features found:", features.length);
                console.log("Features:", features);

                // Find country feature - check 'name' (lowercase) first since GeoJSON uses that
                let countryFeature = features.find(
                  (f) => f.source === "countries" && (f.properties?.name || f.properties?.NAME)
                );

                if (!countryFeature) {
                  // Try querying without layer filter
                  const anyFeatures = map.current.queryRenderedFeatures(e.point);
                  console.log("Trying all features. Total:", anyFeatures.length);
                  if (anyFeatures.length > 0) {
                    console.log("First feature:", {
                      source: anyFeatures[0].source,
                      layer: anyFeatures[0].layer?.id,
                      properties: Object.keys(anyFeatures[0].properties || {})
                    });
                  }

                  countryFeature = anyFeatures.find(
                    (f) => f.source === "countries" && (f.properties?.name || f.properties?.NAME)
                  );
                }

                if (countryFeature) {
                  const countryName = countryFeature.properties?.name ||
                    countryFeature.properties?.NAME ||
                    countryFeature.properties?.NAME_LONG ||
                    countryFeature.properties?.ADMIN;

                  if (countryName) {
                    console.log("✅ COUNTRY FOUND:", countryName);
                    onCountryClick(countryName, {
                      point: { x: e.point.x, y: e.point.y }
                    });
                  } else {
                    console.error("❌ Country name not found. Properties:", countryFeature.properties);
                  }
                } else {
                  console.warn("❌ No country found. Total features:", allFeatures.length);
                  if (allFeatures.length > 0) {
                    console.log("Sample feature:", {
                      source: allFeatures[0].source,
                      layer: allFeatures[0].layer?.id,
                      propertyKeys: Object.keys(allFeatures[0].properties || {})
                    });
                  }
                }
              };

              map.current.on("click", handleMapClick);

              // Also add click handler directly to the base layer
              map.current.on("click", "countries-base", (e) => {
                if (!map.current || !e.features || e.features.length === 0) {
                  console.log("No features in countries-base click");
                  return;
                }

                const feature = e.features[0];
                console.log("Direct click on countries-base:", feature.properties);

                const countryName = feature.properties?.NAME ||
                  feature.properties?.name ||
                  feature.properties?.NAME_LONG ||
                  feature.properties?.ADMIN;

                if (countryName) {
                  console.log("Calling onCountryClick with:", countryName);
                  onCountryClick(countryName, {
                    point: { x: e.point.x, y: e.point.y }
                  });
                } else {
                  console.error("No country name in properties:", feature.properties);
                }
              });

              // Also try click on highlight layer
              map.current.on("click", "countries-highlight", (e) => {
                if (!map.current || !e.features || e.features.length === 0) return;

                const feature = e.features[0];
                const countryName = feature.properties?.NAME ||
                  feature.properties?.name ||
                  feature.properties?.NAME_LONG ||
                  feature.properties?.ADMIN;

                if (countryName) {
                  onCountryClick(countryName, {
                    point: { x: e.point.x, y: e.point.y }
                  });
                }
              });

              // Hover effects - work on all country layers
              map.current.on("mousemove", (e) => {
                if (!map.current) return;

                const features = map.current.queryRenderedFeatures(e.point, {
                  layers: ["countries-base", "countries-highlight"],
                });

                const countryFeature = features.find(
                  (f) => f.source === "countries" && (f.properties?.name || f.properties?.NAME)
                );

                if (countryFeature) {
                  const countryName = countryFeature.properties?.name || countryFeature.properties?.NAME;
                  if (hoveredCountryId.current !== countryName) {
                    hoveredCountryId.current = countryName;
                    if (onCountryHover) onCountryHover(countryName);

                    // Change cursor
                    map.current.getCanvas().style.cursor = "pointer";
                  }
                } else {
                  if (hoveredCountryId.current) {
                    hoveredCountryId.current = null;
                    if (onCountryHover) onCountryHover(null);
                    map.current.getCanvas().style.cursor = "";
                  }
                }
              });

              // Mark map as ready
              mapReady.current = true;
              setLoading(false);
              clearTimeout(initTimeout);
              console.log("Map fully loaded and ready");
            } catch (error) {
              clearTimeout(initTimeout);
              console.error("Error adding map layers:", error);
              setError(`Failed to add map layers: ${error instanceof Error ? error.message : String(error)}`);
              setLoading(false);
              mapReady.current = false;
            }
          })
          .catch((error) => {
            clearTimeoutSafe();
            clearTimeout(initTimeout);
            console.error("Error loading countries GeoJSON:", error);
            if (error.name === "AbortError") {
              setError("Request timed out after 15 seconds. The countries file may be too large or the server is slow.");
            } else {
              setError(`Failed to load countries data: ${error.message || "Unknown error"}. Please check that /geo/countries.geojson exists and is accessible.`);
            }
            setLoading(false);
            mapReady.current = false;
          });
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to initialize map. Please refresh the page.");
      setLoading(false);
    }

    return () => {
      clearTimeout(initTimeout);
      map.current?.remove();
      map.current = null;
      mapReady.current = false;
    };
  }, []);

  // Update highlights when countries or colors change
  useEffect(() => {
    if (!map.current || !mapReady.current) return;

    // Wait for map to be loaded
    if (!map.current.isStyleLoaded()) {
      const handleStyleLoad = () => {
        updateHighlights();
        updateSelections();
      };
      map.current.once("styledata", handleStyleLoad);
      return () => {
        map.current?.off("styledata", handleStyleLoad);
      };
    }

    updateHighlights();
    updateSelections();

    function updateHighlights() {
      if (!map.current || !mapReady.current) return;

      try {
        // Check if source and layer exist
        const source = map.current.getSource("countries");
        const layer = map.current.getLayer("countries-highlight");

        if (source && layer) {
          // Build color expression with individual colors per country
          let colorExpression: any;

          if (highlightedCountries.length > 0) {
            colorExpression = ["case"];
            highlightedCountries.forEach((country) => {
              const color = countryColors[country] || "#5a4f3f";
              // Check both 'name' (lowercase) and 'NAME' (uppercase) properties
              colorExpression.push([
                "any",
                ["==", ["get", "name"], country],
                ["==", ["get", "NAME"], country]
              ]);
              colorExpression.push(color);
            });
            colorExpression.push("transparent");
          } else {
            // If no countries highlighted, just use transparent
            colorExpression = "transparent";
          }

          map.current.setPaintProperty("countries-highlight", "fill-color", colorExpression);
        }
      } catch (error) {
        // Silently ignore if source/layer not ready yet
        console.warn("Map not ready for highlight update:", error);
      }
    }

    function updateSelections() {
      if (!map.current || !mapReady.current) return;

      try {
        const source = map.current.getSource("countries");
        const layer = map.current.getLayer("countries-selected");

        if (source && layer && selectedCountries.length > 0) {
          // Update filter to show selected countries
          map.current.setFilter("countries-selected", [
            "in",
            ["get", "name"],
            ["literal", selectedCountries]
          ]);
        } else if (layer) {
          // Hide selection layer if no countries selected
          map.current.setFilter("countries-selected", ["literal", false]);
        }
      } catch (error) {
        console.warn("Map not ready for selection update:", error);
      }
    }
  }, [highlightedCountries, countryColors, selectedCountries]);

  // Update connection "from" country highlight
  useEffect(() => {
    if (!map.current || !mapReady.current || !connectionFrom) return;

    try {
      // Add a special highlight for the "from" country
      const source = map.current.getSource("countries");
      if (!source) return;

      // Check if connection-from layer exists, if not create it
      if (!map.current.getLayer("connection-from")) {
        map.current.addLayer({
          id: "connection-from",
          type: "fill",
          source: "countries",
          paint: {
            "fill-color": "#8b5cf6",
            "fill-opacity": 0.6,
          },
          filter: [
            "any",
            ["==", ["get", "name"], connectionFrom],
            ["==", ["get", "NAME"], connectionFrom]
          ],
        });
      } else {
        // Update filter
        map.current.setFilter("connection-from", [
          "any",
          ["==", ["get", "name"], connectionFrom],
          ["==", ["get", "NAME"], connectionFrom]
        ]);
      }
    } catch (error) {
      console.warn("Error updating connection-from highlight:", error);
    }

    return () => {
      // Clean up connection-from layer when connectionFrom changes
      try {
        if (map.current && map.current.getLayer("connection-from") && !connectionFrom) {
          map.current.removeLayer("connection-from");
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, [connectionFrom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-95 z-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-base text-gray-700 font-medium mb-1">Loading map...</p>
            <p className="text-xs text-gray-500">This may take a few moments</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-95 z-20 border-2 border-red-300 rounded-lg">
          <div className="text-center p-6 max-w-md">
            <p className="text-lg text-red-700 font-bold mb-3">⚠️ Error loading map</p>
            <p className="text-sm text-red-600 mb-4 bg-white p-3 rounded border border-red-200">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
            <p className="text-xs text-red-500 mt-4">Check the browser console (F12) for more details</p>
          </div>
        </div>
      )}
      {!loading && !error && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm font-medium text-gray-700">
            💡 Click on any country to highlight it
          </p>
        </div>
      )}
    </div>
  );
}
