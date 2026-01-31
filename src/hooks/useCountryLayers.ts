import { useEffect, useRef, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { gsap } from "gsap";
import { COLOR_TRANSITION_CONFIG } from "@/lib/map-config";

interface LayerColors {
  fill: string;
  fillOpacity: number;
  border: string;
  borderWidth: number;
  borderOpacity: number;
  line: string;
  lineWidth: number;
  lineOpacity: number;
}

const DEFAULT_COLORS: LayerColors = {
  fill: "#5a4f3f",
  fillOpacity: 0.5,
  border: "#8b7a5f",
  borderWidth: 2,
  borderOpacity: 0.7,
  line: "#8b7a5f",
  lineWidth: 2.5,
  lineOpacity: 0.6,
};

// Layer IDs as constants for consistency
const LAYER_IDS = {
  highlightFill: "countries-highlight-fill",
  highlightBorder: "countries-highlight-border",
  connectionsLine: "country-connections-line",
  drawnShapesFill: "drawn-shapes-fill",
  drawnShapesBorder: "drawn-shapes-border",
} as const;

const SOURCE_IDS = {
  highlight: "countries-highlight",
  connections: "country-connections",
  drawnShapes: "drawn-shapes",
} as const;

/**
 * Check if layers exist on the map
 */
function layersExist(map: maplibregl.Map): boolean {
  return (
    Boolean(map.getLayer(LAYER_IDS.highlightFill)) &&
    Boolean(map.getLayer(LAYER_IDS.highlightBorder))
  );
}

/**
 * Find first symbol layer to insert custom layers before it
 */
function findFirstSymbolLayer(map: maplibregl.Map): string | undefined {
  const layers = map.getStyle()?.layers;
  if (!layers) return undefined;

  for (const layer of layers) {
    if (layer.type === "symbol") {
      return layer.id;
    }
  }
  return undefined;
}

/**
 * Check if data has changed significantly
 */
function hasDataChanged(
  current: GeoJSON.FeatureCollection | null,
  previous: GeoJSON.FeatureCollection | null
): boolean {
  if (current === null && previous === null) return false;
  if (current === null || previous === null) return true;
  return current.features.length !== previous.features.length;
}

/**
 * Animate color transition using GSAP
 */
function animateColorTransition(
  map: maplibregl.Map,
  layerId: string,
  property: string,
  targetColor: string,
  duration: number = COLOR_TRANSITION_CONFIG.duration
): void {
  const currentColor = map.getPaintProperty(layerId, property);
  if (!currentColor || currentColor === targetColor) {
    map.setPaintProperty(layerId, property, targetColor);
    return;
  }

  gsap.to(
    { color: currentColor },
    {
      color: targetColor,
      duration,
      ease: COLOR_TRANSITION_CONFIG.ease,
      onUpdate: function () {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, property, this.targets()[0].color);
        }
      },
    }
  );
}

/**
 * Setup highlight layers (fill + border)
 */
function setupHighlightLayers(
  map: maplibregl.Map,
  highlighted: GeoJSON.FeatureCollection | null,
  beforeId: string | undefined,
  colors: LayerColors
): void {
  const data = highlighted || { type: "FeatureCollection", features: [] };
  const source = map.getSource(
    SOURCE_IDS.highlight
  ) as maplibregl.GeoJSONSource | null;

  if (!source) {
    // Create new source and layers
    map.addSource(SOURCE_IDS.highlight, {
      type: "geojson",
      data: data as GeoJSON.FeatureCollection,
    });

    map.addLayer(
      {
        id: LAYER_IDS.highlightFill,
        type: "fill",
        source: SOURCE_IDS.highlight,
        paint: {
          "fill-color": colors.fill,
          "fill-opacity": colors.fillOpacity,
        },
      },
      beforeId
    );

    map.addLayer(
      {
        id: LAYER_IDS.highlightBorder,
        type: "line",
        source: SOURCE_IDS.highlight,
        paint: {
          "line-color": colors.border,
          "line-width": colors.borderWidth,
          "line-opacity": colors.borderOpacity,
        },
      },
      beforeId
    );
  } else {
    // Update existing source and paint properties
    // Use setData to update the source - this will trigger a re-render of all layers using this source
    source.setData(data as GeoJSON.FeatureCollection);

    // Ensure layers exist before updating paint properties
    const fillLayer = map.getLayer(LAYER_IDS.highlightFill);
    const borderLayer = map.getLayer(LAYER_IDS.highlightBorder);

    if (fillLayer) {
      map.setPaintProperty(LAYER_IDS.highlightFill, "fill-color", colors.fill);
      map.setPaintProperty(
        LAYER_IDS.highlightFill,
        "fill-opacity",
        colors.fillOpacity
      );
    }
    if (borderLayer) {
      map.setPaintProperty(
        LAYER_IDS.highlightBorder,
        "line-color",
        colors.border
      );
      map.setPaintProperty(
        LAYER_IDS.highlightBorder,
        "line-width",
        colors.borderWidth
      );
      map.setPaintProperty(
        LAYER_IDS.highlightBorder,
        "line-opacity",
        colors.borderOpacity
      );
    }
  }
}

/**
 * Setup connection layers
 */
function setupConnectionLayers(
  map: maplibregl.Map,
  connections: GeoJSON.FeatureCollection | null,
  beforeId: string | undefined,
  colors: LayerColors
): void {
  const data = connections || { type: "FeatureCollection", features: [] };
  const source = map.getSource(
    SOURCE_IDS.connections
  ) as maplibregl.GeoJSONSource | null;

  // Build expressions that use custom properties if available
  const colorExpression: any = [
    "case",
    ["has", "color"],
    ["get", "color"],
    colors.line
  ];
  
  const widthExpression: any = [
    "case",
    ["has", "thickness"],
    ["get", "thickness"],
    colors.lineWidth
  ];
  
  const opacityExpression: any = [
    "case",
    ["has", "opacity"],
    ["get", "opacity"],
    colors.lineOpacity
  ];

  if (!source) {
    map.addSource(SOURCE_IDS.connections, {
      type: "geojson",
      data: data as GeoJSON.FeatureCollection,
    });

    map.addLayer(
      {
        id: LAYER_IDS.connectionsLine,
        type: "line",
        source: SOURCE_IDS.connections,
        paint: {
          "line-color": colorExpression,
          "line-width": widthExpression,
          "line-opacity": opacityExpression,
        },
      },
      beforeId
    );
  } else {
    source.setData(data as GeoJSON.FeatureCollection);
    if (map.getLayer(LAYER_IDS.connectionsLine)) {
      map.setPaintProperty(
        LAYER_IDS.connectionsLine,
        "line-color",
        colorExpression
      );
      map.setPaintProperty(
        LAYER_IDS.connectionsLine,
        "line-width",
        widthExpression
      );
      map.setPaintProperty(
        LAYER_IDS.connectionsLine,
        "line-opacity",
        opacityExpression
      );
    }
  }
}

/**
 * Update layer data sources
 */
function updateLayerData(
  map: maplibregl.Map,
  highlighted: GeoJSON.FeatureCollection | null,
  connections: GeoJSON.FeatureCollection | null,
  drawnShapes: GeoJSON.FeatureCollection | null
): void {
  const highlightData = highlighted || {
    type: "FeatureCollection",
    features: [],
  };
  const connectionData = connections || {
    type: "FeatureCollection",
    features: [],
  };
  const drawnShapesData = drawnShapes || {
    type: "FeatureCollection",
    features: [],
  };

  const highlightSource = map.getSource(
    SOURCE_IDS.highlight
  ) as maplibregl.GeoJSONSource;
  const connectionSource = map.getSource(
    SOURCE_IDS.connections
  ) as maplibregl.GeoJSONSource;
  const drawnShapesSource = map.getSource(
    SOURCE_IDS.drawnShapes
  ) as maplibregl.GeoJSONSource | null;

  if (highlightSource) {
    highlightSource.setData(highlightData as GeoJSON.FeatureCollection);
  }

  if (connectionSource) {
    connectionSource.setData(connectionData as GeoJSON.FeatureCollection);
  }

  if (drawnShapesSource) {
    drawnShapesSource.setData(drawnShapesData as GeoJSON.FeatureCollection);
  } else if (drawnShapes && drawnShapes.features.length > 0) {
    // Need to set up layers if they don't exist
    const beforeId = findFirstSymbolLayer(map);
    setupDrawnShapesLayers(map, drawnShapes, beforeId);
  }
}

/**
 * Update layer colors with smooth transitions
 */
function updateLayerColors(map: maplibregl.Map, colors: LayerColors): void {
  // Update fill layer
  if (map.getLayer(LAYER_IDS.highlightFill)) {
    animateColorTransition(
      map,
      LAYER_IDS.highlightFill,
      "fill-color",
      colors.fill
    );
    map.setPaintProperty(
      LAYER_IDS.highlightFill,
      "fill-opacity",
      colors.fillOpacity
    );
  }

  // Update border layer
  if (map.getLayer(LAYER_IDS.highlightBorder)) {
    animateColorTransition(
      map,
      LAYER_IDS.highlightBorder,
      "line-color",
      colors.border
    );
    map.setPaintProperty(
      LAYER_IDS.highlightBorder,
      "line-width",
      colors.borderWidth
    );
    map.setPaintProperty(
      LAYER_IDS.highlightBorder,
      "line-opacity",
      colors.borderOpacity
    );
  }

  // Update connection line layer (only affects non-drawn lines)
  if (map.getLayer(LAYER_IDS.connectionsLine)) {
    const colorExpression: any = [
      "case",
      ["has", "color"],
      ["get", "color"],
      colors.line
    ];
    
    const widthExpression: any = [
      "case",
      ["has", "thickness"],
      ["get", "thickness"],
      colors.lineWidth
    ];
    
    const opacityExpression: any = [
      "case",
      ["has", "opacity"],
      ["get", "opacity"],
      colors.lineOpacity
    ];
    
    map.setPaintProperty(LAYER_IDS.connectionsLine, "line-color", colorExpression);
    map.setPaintProperty(LAYER_IDS.connectionsLine, "line-width", widthExpression);
    map.setPaintProperty(LAYER_IDS.connectionsLine, "line-opacity", opacityExpression);
  }
}

/**
 * Update layer visibility
 */
function updateLayerVisibility(map: maplibregl.Map, isVisible: boolean): void {
  const visibility = isVisible ? "visible" : "none";
  const layerIds = [
    LAYER_IDS.highlightFill,
    LAYER_IDS.highlightBorder,
    LAYER_IDS.connectionsLine,
    LAYER_IDS.drawnShapesFill,
    LAYER_IDS.drawnShapesBorder,
  ];

  for (const layerId of layerIds) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }
}

/**
 * Setup drawn shapes layer (for unified areas with shape geometry)
 */
function setupDrawnShapesLayers(
  map: maplibregl.Map,
  drawnShapes: GeoJSON.FeatureCollection | null,
  beforeId: string | undefined
): void {
  if (!drawnShapes || drawnShapes.features.length === 0) {
    // Remove layers if they exist but no data
    if (map.getLayer(LAYER_IDS.drawnShapesFill)) {
      map.removeLayer(LAYER_IDS.drawnShapesFill);
    }
    if (map.getLayer(LAYER_IDS.drawnShapesBorder)) {
      map.removeLayer(LAYER_IDS.drawnShapesBorder);
    }
    if (map.getSource(SOURCE_IDS.drawnShapes)) {
      map.removeSource(SOURCE_IDS.drawnShapes);
    }
    return;
  }

  const sourceId = SOURCE_IDS.drawnShapes;
  const fillLayerId = LAYER_IDS.drawnShapesFill;
  const borderLayerId = LAYER_IDS.drawnShapesBorder;

  // Add or update source
  if (map.getSource(sourceId)) {
    (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(drawnShapes);
  } else {
    map.addSource(sourceId, {
      type: "geojson",
      data: drawnShapes,
    });
  }

  // Add fill layer with custom colors from properties
  if (!map.getLayer(fillLayerId)) {
    map.addLayer(
      {
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": [
            "case",
            ["has", "color"],
            ["get", "color"],
            "#10b981" // Default green
          ],
          "fill-opacity": [
            "case",
            ["has", "opacity"],
            ["get", "opacity"],
            0.4 // Default opacity
          ],
        },
      },
      beforeId
    );
  }

  // Add border layer
  if (!map.getLayer(borderLayerId)) {
    map.addLayer(
      {
        id: borderLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": [
            "case",
            ["has", "color"],
            ["get", "color"],
            "#10b981"
          ],
          "line-width": 2,
          "line-opacity": 0.8,
        },
      },
      beforeId
    );
  }
}

/**
 * Initialize all layers
 */
function initializeLayers(
  map: maplibregl.Map,
  highlighted: GeoJSON.FeatureCollection | null,
  connections: GeoJSON.FeatureCollection | null,
  drawnShapes: GeoJSON.FeatureCollection | null,
  isVisible: boolean,
  colors: LayerColors
): void {
  if (!map.isStyleLoaded()) {
    console.warn("Map style not loaded yet");
    return;
  }

  const beforeId = findFirstSymbolLayer(map);
  setupHighlightLayers(map, highlighted, beforeId, colors);
  setupConnectionLayers(map, connections, beforeId, colors);
  setupDrawnShapesLayers(map, drawnShapes, beforeId);
  updateLayerVisibility(map, isVisible);
}

export function useCountryLayers(
  map: maplibregl.Map | null,
  mapLoaded: boolean,
  highlighted: GeoJSON.FeatureCollection | null,
  connections: GeoJSON.FeatureCollection | null,
  drawnShapes: GeoJSON.FeatureCollection | null,
  isVisible: boolean,
  colors: Partial<LayerColors> = {}
) {
  const mergedColors = useMemo(
    () => ({ ...DEFAULT_COLORS, ...colors }),
    [colors]
  );

  // Track previous values to detect changes
  const previousHighlightedRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const previousConnectionsRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const previousDrawnShapesRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const previousColorsRef = useRef<LayerColors>(mergedColors);
  const layersInitializedRef = useRef(false);

  // Stable callback for style load handler
  const handleStyleLoad = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;
    initializeLayers(map, highlighted, connections, drawnShapes, isVisible, mergedColors);
    layersInitializedRef.current = true;
  }, [map, highlighted, connections, drawnShapes, isVisible, mergedColors]);

  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Wait for style to load
    if (!map.isStyleLoaded()) {
      map.once("styledata", handleStyleLoad);
      return () => {
        map.off("styledata", handleStyleLoad);
      };
    }

    // Check if layers need initialization
    const needsInit = !layersInitializedRef.current || !layersExist(map);
    const dataChanged =
      hasDataChanged(highlighted, previousHighlightedRef.current) ||
      hasDataChanged(connections, previousConnectionsRef.current) ||
      hasDataChanged(drawnShapes, previousDrawnShapesRef.current);
    const colorsChanged =
      JSON.stringify(previousColorsRef.current) !==
      JSON.stringify(mergedColors);

    // Special case: if we're going from null/empty to actual data, force full init
    // This ensures layers are properly set up when data first arrives
    const goingFromEmptyToData =
      (previousHighlightedRef.current === null &&
        highlighted !== null &&
        highlighted.features.length > 0) ||
      (previousConnectionsRef.current === null &&
        connections !== null &&
        connections.features.length > 0) ||
      (previousDrawnShapesRef.current === null &&
        drawnShapes !== null &&
        drawnShapes.features.length > 0);

    if (needsInit || dataChanged || goingFromEmptyToData) {
      // Full initialization
      initializeLayers(map, highlighted, connections, drawnShapes, isVisible, mergedColors);
      layersInitializedRef.current = true;
      previousHighlightedRef.current = highlighted;
      previousConnectionsRef.current = connections;
      previousDrawnShapesRef.current = drawnShapes;
      previousColorsRef.current = mergedColors;
    } else {
      // Incremental updates
      updateLayerData(map, highlighted, connections, drawnShapes);
      if (colorsChanged) {
        updateLayerColors(map, mergedColors);
        previousColorsRef.current = mergedColors;
      }
      updateLayerVisibility(map, isVisible);
      previousHighlightedRef.current = highlighted;
      previousConnectionsRef.current = connections;
      previousDrawnShapesRef.current = drawnShapes;
    }
  }, [
    map,
    mapLoaded,
    highlighted,
    connections,
    drawnShapes,
    isVisible,
    mergedColors,
    handleStyleLoad,
  ]);
}
