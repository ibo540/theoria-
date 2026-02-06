/**
 * Generate distinct color variations from a base theory color
 * Maintains color identity while ensuring readability
 */

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calm color palette matching website theme
 * Based on website colors but with reduced saturation for a softer look
 */
const DISTINCT_COLOR_PALETTE = [
  "#d4b896", // Soft gold (from primary-gold #ffe4be)
  "#a8c8d4", // Soft blue (from #7edef9)
  "#c4d4a8", // Soft green (from #bbe581)
  "#d4a8c8", // Soft purple (from #f5d6f9)
  "#a8b8d4", // Soft navy (from #91beef)
  "#d4c4a8", // Soft yellow (from #f3db66)
  "#c8a8b8", // Soft rose (from red #f9464c)
  "#b8c8d4", // Light blue-gray
  "#c8d4b8", // Light green-gray
  "#d4b8c8", // Light purple-gray
  "#b8d4c8", // Soft teal
  "#c8b8d4", // Soft lavender
  "#d4c8b8", // Warm beige
  "#b8c4d4", // Cool blue-gray
  "#c4c8d4", // Neutral blue-gray
];

/**
 * Generate distinct colors for chart series
 * Uses the theory color as primary, then selects distinct colors from palette
 * @param baseColor - The theory color (hex format)
 * @param count - Number of colors needed
 * @returns Array of distinct colors with theory color as first
 */
export function generateColorVariations(baseColor: string, count: number): string[] {
  if (count === 0) return [];
  if (count === 1) return [baseColor];

  const colors: string[] = [baseColor]; // First color is always the theory color
  
  // Find the theory color in the palette to avoid duplicates
  const baseColorIndex = DISTINCT_COLOR_PALETTE.findIndex(
    color => color.toLowerCase() === baseColor.toLowerCase()
  );
  
  // Create a filtered palette excluding the theory color
  const availableColors = baseColorIndex >= 0
    ? [...DISTINCT_COLOR_PALETTE.slice(0, baseColorIndex), ...DISTINCT_COLOR_PALETTE.slice(baseColorIndex + 1)]
    : DISTINCT_COLOR_PALETTE;
  
  // Select distinct colors from the palette
  for (let i = 1; i < count; i++) {
    // Cycle through available colors, ensuring we get distinct ones
    const colorIndex = (i - 1) % availableColors.length;
    colors.push(availableColors[colorIndex]);
  }

  return colors;
}

/**
 * Generate colors for chart data series
 * If a theory color is provided, generates variations from it
 * Otherwise uses default theme colors
 */
export function getChartColors(
  baseColor: string | undefined,
  count: number,
  defaultColors: string[] = [
    "#d4b896", // Soft gold (from primary-gold #ffe4be)
    "#a8c8d4", // Soft blue (from #7edef9)
    "#c4d4a8", // Soft green (from #bbe581)
    "#d4a8c8", // Soft purple (from #f5d6f9)
  ]
): string[] {
  if (baseColor && count > 0) {
    return generateColorVariations(baseColor, count);
  }
  
  // If no base color, cycle through default colors
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(defaultColors[i % defaultColors.length]);
  }
  return colors;
}
