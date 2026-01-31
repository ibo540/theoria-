/**
 * Map configuration constants
 * Centralized configuration for MapLibre GL map instance
 */

export const MAP_CONFIG = {
  style: "https://demotiles.maplibre.org/style.json",
  initialCenter: [0, 20] as [number, number],
  targetZoom: 2.2,
  zoomDuration: 6000,
  minZoom: 0.4,
  pitch: 15,
  minPitch: 0,
  maxPitch: 35,
  pitchSensitivity: 0.06,
} as const;

export const MAP_COLORS = {
  background: "#0f1114",
  water: "#0b0d10",
  land: "#14161a",
  boundary: "#3e4249",
  line: "#1a1f25",
} as const;

export const MAP_TEXTURE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
    <feComponentTransfer>
      <feFuncA type='table' tableValues='0 0.6'/>
    </feComponentTransfer>
  </filter>
  <rect width='100%' height='100%' filter='url(%23n)'/>
</svg>`;

export const MAP_TEXTURE_DATA_URL = `url("data:image/svg+xml;utf8,${MAP_TEXTURE_SVG}")`;

// Marker focus configuration
export const MARKER_FOCUS_CONFIG = {
  zoom: 4.2,
  pitch: 30,
  duration: 1500,
  rotationBearing: 360, // Full rotation when focusing on marker
  rotationDuration: 2500, // Slightly longer for smooth rotation
} as const;

// Camera animation configuration
export const CAMERA_ANIMATION_CONFIG = {
  connectionDuration: 2000,
  connectionPitch: 35,
  connectionBearing: 0,
  defaultDuration: 2000,
} as const;

// Color transition configuration (shared between map and cursor)
export const COLOR_TRANSITION_CONFIG = {
  duration: 0.8,
  ease: "power2.inOut" as const,
} as const;
