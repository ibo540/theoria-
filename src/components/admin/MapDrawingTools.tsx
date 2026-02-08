"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Circle, Square, Minus, X, Save, Trash2, Move, Edit2 } from "lucide-react";

interface DrawingShape {
  id: string;
  type: "circle" | "polygon";
  coordinates: [number, number][];
  center?: [number, number];
  radius?: number; // in pixels
  color: string;
  opacity: number;
}

interface DrawingLine {
  id: string;
  type: "straight" | "curved";
  points: [number, number][];
  controlPoints?: [number, number][]; // For bezier curves
  thickness: number;
  color: string;
  opacity: number;
  label?: string;
}

interface MapDrawingToolsProps {
  map: maplibregl.Map | null;
  mode: "unified-area" | "connection" | null;
  onShapeComplete?: (shape: DrawingShape) => void;
  onLineComplete?: (line: DrawingLine) => void;
  onCancel?: () => void;
  existingConnections?: Array<{ line?: { points: [number, number][] } }>; // For snap-to-line functionality
  eventTheory?: string | null; // Theory of the event to filter colors
}

// Export types for use in other components
export type { DrawingShape, DrawingLine };

export function MapDrawingTools({
  map,
  mode,
  onShapeComplete,
  onLineComplete,
  onCancel,
  existingConnections = [],
  eventTheory = null,
}: MapDrawingToolsProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
  const [shapeType, setShapeType] = useState<"circle" | "polygon">("circle");
  const [lineType, setLineType] = useState<"straight" | "curved">("straight");
  // Fixed values for connection lines - not user-configurable
  const lineThickness = 4; // Fixed professional thickness
  
  // Theory color mappings
  const theoryMainColors: Record<string, string> = {
    realism: "#f9464c",
    neorealism: "#91beef",
    liberalism: "#7edef9",
    neoliberal: "#bbe581",
    englishschool: "#f5d6f9",
    constructivism: "#f3db66",
  };

  // Generate 4 color variations for a theory (lighter to darker)
  function generateTheoryColors(mainColor: string): string[] {
    // Convert hex to RGB
    const hex = mainColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Generate 4 variations: lightest, light, medium, dark (main)
    // Lightest: blend with white (70% white)
    const r1 = Math.min(255, Math.floor(r + (255 - r) * 0.7));
    const g1 = Math.min(255, Math.floor(g + (255 - g) * 0.7));
    const b1 = Math.min(255, Math.floor(b + (255 - b) * 0.7));
    
    // Light: blend with white (40% white)
    const r2 = Math.min(255, Math.floor(r + (255 - r) * 0.4));
    const g2 = Math.min(255, Math.floor(g + (255 - g) * 0.4));
    const b2 = Math.min(255, Math.floor(b + (255 - b) * 0.4));
    
    // Medium: blend with white (15% white)
    const r3 = Math.min(255, Math.floor(r + (255 - r) * 0.15));
    const g3 = Math.min(255, Math.floor(g + (255 - g) * 0.15));
    const b3 = Math.min(255, Math.floor(b + (255 - b) * 0.15));

    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    
    return [
      `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`, // Lightest
      `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`, // Light
      `#${toHex(r3)}${toHex(g3)}${toHex(b3)}`, // Medium
      mainColor, // Dark (main color)
    ];
  }

  // Get colors based on selected theory
  const getAvailableColors = (): string[] => {
    if (eventTheory && theoryMainColors[eventTheory]) {
      // Return 4 variations of the selected theory's color
      return generateTheoryColors(theoryMainColors[eventTheory]);
    }
    // Default: return beige variations if no theory selected
    return [
      "#ffe4be", // Light beige
      "#ffd4a3", // Medium beige
      "#ffc47e", // Darker beige
      "#ffb359", // Darkest beige
    ];
  };

  const availableColors = getAvailableColors();
  const defaultColor = availableColors[availableColors.length - 1]; // Use the darkest/main color as default
  
  const [lineColor, setLineColor] = useState(defaultColor);
  const [shapeColor, setShapeColor] = useState(defaultColor);
  const [opacity, setOpacity] = useState(0.4);
  const [snapToLines, setSnapToLines] = useState(true); // Enable snap-to-line by default
  
  // Update colors when theory changes
  useEffect(() => {
    const newColors = getAvailableColors();
    const newDefault = newColors[newColors.length - 1];
    setLineColor(newDefault);
    setShapeColor(newDefault);
  }, [eventTheory]);
  const [snappedPoint, setSnappedPoint] = useState<[number, number] | null>(null);
  
  const drawingLayerRef = useRef<string | null>(null);
  const pointsRef = useRef<[number, number][]>([]);
  const isDraggingRef = useRef(false);
  const startPointRef = useRef<[number, number] | null>(null);

  // Helper functions (must be defined before useCallback hooks that use them)
  
  /**
   * Calculate distance between two points in degrees (approximate)
   */
  function pointDistance(p1: [number, number], p2: [number, number]): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate distance from a point to a line segment
   * Returns the closest point on the line segment and the distance
   */
  function distanceToLineSegment(
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): { distance: number; closestPoint: [number, number] } {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      // Line segment is a point
      return {
        distance: pointDistance(point, lineStart),
        closestPoint: lineStart,
      };
    }
    
    // Project point onto line
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
    const closestPoint: [number, number] = [x1 + t * dx, y1 + t * dy];
    
    return {
      distance: pointDistance(point, closestPoint),
      closestPoint,
    };
  }
  
  /**
   * Find the closest point on any existing line to the given point
   * Returns null if no line is close enough (snap threshold)
   */
  function findSnapPoint(
    point: [number, number],
    snapThreshold: number = 0.01 // ~1km at equator
  ): [number, number] | null {
    if (!snapToLines || existingConnections.length === 0) {
      return null;
    }
    
    let closestDistance = Infinity;
    let closestPoint: [number, number] | null = null;
    
    for (const conn of existingConnections) {
      if (!conn.line || !conn.line.points || conn.line.points.length < 2) continue;
      
      const points = conn.line.points;
      
      // Check distance to each line segment
      for (let i = 0; i < points.length - 1; i++) {
        const result = distanceToLineSegment(point, points[i], points[i + 1]);
        if (result.distance < closestDistance && result.distance < snapThreshold) {
          closestDistance = result.distance;
          closestPoint = result.closestPoint;
        }
      }
      
      // Also check distance to endpoints
      for (const endpoint of [points[0], points[points.length - 1]]) {
        const dist = pointDistance(point, endpoint);
        if (dist < closestDistance && dist < snapThreshold) {
          closestDistance = dist;
          closestPoint = endpoint;
        }
      }
    }
    
    return closestPoint;
  }
  
  function createCircleGeoJSON(center: [number, number], radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
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
  }

  function createBezierCurve(
    start: [number, number],
    control: [number, number],
    end: [number, number]
  ): GeoJSON.Feature<GeoJSON.LineString> {
    const points: [number, number][] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lng = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
      const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];
      points.push([lng, lat]);
    }
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: points,
      },
      properties: {},
    };
  }

  // Update circle preview
  const updateCirclePreview = useCallback((center: [number, number], point: [number, number]) => {
    if (!map || !currentShape) return;
    
    try {
      // Calculate radius in kilometers, accounting for latitude distortion
      // Longitude distance needs to be adjusted by cosine of latitude
      const latDiff = point[1] - center[1];
      const lngDiff = point[0] - center[0];
      const latKm = latDiff * 111; // 1 degree latitude ≈ 111 km
      const lngKm = lngDiff * 111 * Math.cos(center[1] * Math.PI / 180); // Adjust for latitude
      const radius = Math.sqrt(latKm * latKm + lngKm * lngKm);
      
      // Create circle GeoJSON
      const circle = createCircleGeoJSON(center, radius);
      
      const sourceId = "drawing-preview";
      const layerId = "drawing-preview-layer";
      
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(circle);
      } else {
        map.addSource(sourceId, { type: "geojson", data: circle });
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": currentShape.color,
            "fill-opacity": currentShape.opacity,
          },
        });
        map.addLayer({
          id: `${layerId}-outline`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": currentShape.color,
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });
      }
      drawingLayerRef.current = layerId;
    } catch (error) {
      console.warn("Error updating circle preview:", error);
    }
  }, [map, currentShape]);

  // Update line preview
  const updateLinePreview = useCallback((points: [number, number][]) => {
    if (!map || !currentLine || points.length < 2) return;
    
    try {
      let lineGeoJSON: GeoJSON.Feature<GeoJSON.LineString>;
      
      if (currentLine.type === "curved" && points.length === 3) {
        // Bezier curve
        lineGeoJSON = createBezierCurve(points[0], points[1], points[2]);
      } else {
        // Straight line
        lineGeoJSON = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points,
          },
          properties: {},
        };
      }
      
      const sourceId = "drawing-preview";
      const layerId = "drawing-preview-layer";
      
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [lineGeoJSON],
        });
      } else {
        map.addSource(sourceId, { type: "geojson", data: { type: "FeatureCollection", features: [lineGeoJSON] } });
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": currentLine.color,
            "line-width": currentLine.thickness,
            "line-opacity": currentLine.opacity,
          },
        });
      }
      drawingLayerRef.current = layerId;
    } catch (error) {
      console.warn("Error updating line preview:", error);
    }
  }, [map, currentLine]);

  // Update polygon preview
  const updatePolygonPreview = useCallback((points: [number, number][]) => {
    if (!map || !currentShape || points.length < 3) return;
    
    try {
      const polygon: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...points, points[0]]], // Close the polygon
        },
        properties: {},
      };
      
      const sourceId = "drawing-preview";
      const layerId = "drawing-preview-layer";
      
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [polygon],
        });
      } else {
        map.addSource(sourceId, { type: "geojson", data: { type: "FeatureCollection", features: [polygon] } });
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": currentShape.color,
            "fill-opacity": currentShape.opacity,
          },
        });
        map.addLayer({
          id: `${layerId}-outline`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": currentShape.color,
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });
      }
      drawingLayerRef.current = layerId;
    } catch (error) {
      console.warn("Error updating polygon preview:", error);
    }
  }, [map, currentShape]);

  // Start drawing
  const startDrawing = useCallback(() => {
    if (!map) {
      console.warn("Map instance not available for drawing");
      return;
    }
    setIsDrawing(true);
    pointsRef.current = [];
    isDraggingRef.current = false;
    startPointRef.current = null;
    
    if (mode === "unified-area") {
      setCurrentShape({
        id: `shape-${Date.now()}`,
        type: shapeType,
        coordinates: [],
        color: shapeColor,
        opacity,
      });
    } else if (mode === "connection") {
      setCurrentLine({
        id: `line-${Date.now()}`,
        type: lineType,
        points: [],
        thickness: lineThickness,
        color: lineColor,
        opacity,
      });
    }
  }, [map, mode, shapeType, shapeColor, opacity, lineType, lineThickness, lineColor]);

  // Handle map click for drawing
  useEffect(() => {
    if (!map || !isDrawing) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      let lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      // Check for snap-to-line if drawing a connection
      if (mode === "connection" && snapToLines) {
        const snapPoint = findSnapPoint(lngLat, 0.01); // ~1km snap threshold
        if (snapPoint) {
          lngLat = snapPoint;
          setSnappedPoint(snapPoint);
        } else {
          setSnappedPoint(null);
        }
      } else {
        setSnappedPoint(null);
      }
      
      if (mode === "unified-area") {
        if (shapeType === "circle") {
          if (!startPointRef.current) {
            // First click: set center
            startPointRef.current = lngLat;
            setCurrentShape(prev => prev ? {
              ...prev,
              center: lngLat,
              coordinates: [lngLat],
            } : null);
          } else {
            // Second click: set radius and complete
            const center = startPointRef.current;
            // Calculate radius in kilometers, accounting for latitude distortion
            const latDiff = lngLat[1] - center[1];
            const lngDiff = lngLat[0] - center[0];
            const latKm = latDiff * 111; // 1 degree latitude ≈ 111 km
            const lngKm = lngDiff * 111 * Math.cos(center[1] * Math.PI / 180); // Adjust for latitude
            const radius = Math.sqrt(latKm * latKm + lngKm * lngKm);
            
            if (currentShape && onShapeComplete) {
              onShapeComplete({
                ...currentShape,
                center,
                radius,
                coordinates: [center, lngLat],
              });
            }
            setIsDrawing(false);
            startPointRef.current = null;
            setCurrentShape(null);
          }
        } else {
          // Polygon mode
          pointsRef.current.push(lngLat);
          setCurrentShape(prev => prev ? {
            ...prev,
            coordinates: [...pointsRef.current],
          } : null);
        }
      } else if (mode === "connection") {
        if (lineType === "straight") {
          pointsRef.current.push(lngLat);
          if (pointsRef.current.length === 2) {
            // Complete straight line
            if (currentLine && onLineComplete) {
              onLineComplete({
                ...currentLine,
                points: [...pointsRef.current],
              });
            }
            setIsDrawing(false);
            pointsRef.current = [];
            setCurrentLine(null);
          } else {
            setCurrentLine(prev => prev ? {
              ...prev,
              points: [...pointsRef.current],
            } : null);
          }
        } else {
          // Curved line - need 2 points + control point
          pointsRef.current.push(lngLat);
          if (pointsRef.current.length === 3) {
            // Complete curved line
            if (currentLine && onLineComplete) {
              onLineComplete({
                ...currentLine,
                points: [pointsRef.current[0], pointsRef.current[2]],
                controlPoints: [pointsRef.current[1]],
              });
            }
            setIsDrawing(false);
            pointsRef.current = [];
            setCurrentLine(null);
          } else {
            setCurrentLine(prev => prev ? {
              ...prev,
              points: [...pointsRef.current],
            } : null);
          }
        }
      }
    };

    const handleMapMove = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing || !mode) return;
      let lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      // Check for snap-to-line if drawing a connection
      if (mode === "connection" && snapToLines) {
        const snapPoint = findSnapPoint(lngLat, 0.01); // ~1km snap threshold
        if (snapPoint) {
          lngLat = snapPoint;
          setSnappedPoint(snapPoint);
        } else {
          setSnappedPoint(null);
        }
      } else {
        setSnappedPoint(null);
      }
      
      // Update preview
      if (mode === "unified-area" && shapeType === "circle" && startPointRef.current) {
        const center = startPointRef.current;
        updateCirclePreview(center, lngLat);
      } else if (mode === "connection" && pointsRef.current.length > 0) {
        updateLinePreview([...pointsRef.current, lngLat]);
      } else if (mode === "unified-area" && shapeType === "polygon" && pointsRef.current.length > 0) {
        // Show polygon preview with current point
        const previewPoints = [...pointsRef.current, lngLat];
        if (previewPoints.length >= 2) {
          updatePolygonPreview(previewPoints);
        }
      }
    };

    const handleDoubleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing || mode !== "unified-area" || shapeType !== "polygon") return;
      
      // Finish polygon on double click
      if (pointsRef.current.length >= 3 && currentShape && onShapeComplete) {
        onShapeComplete({
          ...currentShape,
          coordinates: [...pointsRef.current],
        });
        setIsDrawing(false);
        pointsRef.current = [];
        setCurrentShape(null);
      }
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMapMove);
    map.on("dblclick", handleDoubleClick);

    return () => {
      map.off("click", handleMapClick);
      map.off("mousemove", handleMapMove);
      map.off("dblclick", handleDoubleClick);
    };
  }, [map, isDrawing, mode, shapeType, lineType, currentShape, currentLine, onShapeComplete, onLineComplete, updateCirclePreview, updateLinePreview, updatePolygonPreview, snapToLines, existingConnections]);

  // Render snapped point indicator
  useEffect(() => {
    if (!map || !isDrawing || !snappedPoint || mode !== "connection") return;
    
    const snapSourceId = "snap-indicator";
    const snapLayerId = "snap-indicator-layer";
    
    const snapFeature: GeoJSON.Feature<GeoJSON.Point> = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: snappedPoint,
      },
      properties: {},
    };
    
    if (map.getSource(snapSourceId)) {
      (map.getSource(snapSourceId) as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [snapFeature],
      });
    } else {
      map.addSource(snapSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [snapFeature],
        },
      });
      
      map.addLayer({
        id: snapLayerId,
        type: "circle",
        source: snapSourceId,
        paint: {
          "circle-radius": 8,
          "circle-color": "#ffd700",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });
    }
    
    return () => {
      try {
        if (map.getLayer(snapLayerId)) map.removeLayer(snapLayerId);
        if (map.getSource(snapSourceId)) map.removeSource(snapSourceId);
      } catch (e) {
        // Ignore errors
      }
    };
  }, [map, isDrawing, snappedPoint, mode]);
  
  // Cleanup preview
  useEffect(() => {
    if (!map || isDrawing) return;
    
    // Clean up preview layers
    if (drawingLayerRef.current) {
      try {
        if (map.getLayer(drawingLayerRef.current)) {
          map.removeLayer(drawingLayerRef.current);
        }
        if (map.getLayer(`${drawingLayerRef.current}-outline`)) {
          map.removeLayer(`${drawingLayerRef.current}-outline`);
        }
        if (map.getSource("drawing-preview")) {
          map.removeSource("drawing-preview");
        }
      } catch (e) {
        // Ignore errors
      }
      drawingLayerRef.current = null;
    }
  }, [map, isDrawing]);

  if (!mode) return null;

  return (
    <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm border-2 border-slate-600/50 rounded-xl shadow-2xl z-50 p-4 min-w-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          {mode === "unified-area" ? "Draw Area" : "Draw Connection"}
        </h3>
        <button
          onClick={() => {
            setIsDrawing(false);
            onCancel?.();
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {mode === "unified-area" ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">Shape Type:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShapeType("circle")}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  shapeType === "circle"
                    ? "border-green-500 bg-green-500/20 text-white"
                    : "border-slate-600/50 bg-slate-700/80 text-gray-200 hover:border-slate-500"
                }`}
              >
                <Circle className="w-4 h-4 mx-auto" />
                <span className="text-xs mt-1 block">Circle</span>
              </button>
              <button
                onClick={() => setShapeType("polygon")}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  shapeType === "polygon"
                    ? "border-green-500 bg-green-500/20 text-white"
                    : "border-slate-600/50 bg-slate-700/80 text-gray-200 hover:border-slate-500"
                }`}
              >
                <Square className="w-4 h-4 mx-auto" />
                <span className="text-xs mt-1 block">Polygon</span>
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">Color:</label>
            <div className="grid grid-cols-5 gap-2">
              {unifiedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setShapeColor(color)}
                  className={`h-10 w-full rounded border-2 transition-all hover:scale-110 ${
                    shapeColor === color
                      ? "border-white ring-2 ring-white/50"
                      : "border-slate-600/50 hover:border-slate-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              Selected: <span className="font-mono">{shapeColor}</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            onClick={startDrawing}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {isDrawing ? "Drawing..." : "Start Drawing"}
          </button>
          {isDrawing && (
            <p className="text-xs text-gray-300 mt-2 text-center">
              {shapeType === "circle"
                ? "Click center, then click edge"
                : "Click points to create polygon"}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <input
                type="checkbox"
                checked={snapToLines}
                onChange={(e) => setSnapToLines(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600/50 bg-slate-700/80 text-purple-500 focus:ring-purple-500"
              />
              <span>Snap to existing lines</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">Line Type:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLineType("straight")}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  lineType === "straight"
                    ? "border-purple-500 bg-purple-500/20 text-white"
                    : "border-slate-600/50 bg-slate-700/80 text-gray-200 hover:border-slate-500"
                }`}
              >
                <Minus className="w-4 h-4 mx-auto" />
                <span className="text-xs mt-1 block">Straight</span>
              </button>
              <button
                onClick={() => setLineType("curved")}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  lineType === "curved"
                    ? "border-purple-500 bg-purple-500/20 text-white"
                    : "border-slate-600/50 bg-slate-700/80 text-gray-200 hover:border-slate-500"
                }`}
              >
                <Edit2 className="w-4 h-4 mx-auto" />
                <span className="text-xs mt-1 block">Curved</span>
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Line Color: {eventTheory ? `(${eventTheory})` : '(No theory selected)'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableColors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  onClick={() => setLineColor(color)}
                  className={`h-12 w-full rounded border-2 transition-all hover:scale-110 ${
                    lineColor === color
                      ? "border-white ring-2 ring-white/50 shadow-lg"
                      : "border-slate-600/50 hover:border-slate-400"
                  }`}
                  style={{ 
                    backgroundColor: color,
                    // Ensure visibility with a subtle border if color is too light
                    boxShadow: lineColor === color ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none'
                  }}
                  title={`${color} - Variation ${index + 1}`}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              Selected: <span className="font-mono text-white">{lineColor}</span>
            </div>
          </div>
          {/* Thickness is fixed - not user-configurable */}
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
            <p className="text-xs text-gray-400 mb-1">Connection Line Style</p>
            <p className="text-sm text-white">
              Color: <span className="text-gray-300">Automatic (theory-based)</span>
            </p>
            <p className="text-sm text-white">
              Thickness: <span className="text-gray-300">4px (fixed)</span>
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            onClick={startDrawing}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            {isDrawing ? "Drawing..." : "Start Drawing"}
          </button>
          {isDrawing && (
            <p className="text-xs text-gray-300 mt-2 text-center">
              {lineType === "straight"
                ? "Click start point, then end point"
                : "Click start, control point, then end"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
