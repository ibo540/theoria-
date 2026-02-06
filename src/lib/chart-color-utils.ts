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
 * Generate distinct color variations from a base color
 * @param baseColor - The theory color (hex format)
 * @param count - Number of variations needed
 * @returns Array of distinct colors that maintain the theory color identity
 */
export function generateColorVariations(baseColor: string, count: number): string[] {
  if (count === 0) return [];
  if (count === 1) return [baseColor];

  const { h, s, l } = hexToHsl(baseColor);
  const colors: string[] = [baseColor]; // First color is always the base

  // Generate variations by adjusting hue, saturation, and lightness
  // while staying within the same color family
  for (let i = 1; i < count; i++) {
    const progress = i / (count - 1);
    
    // Vary hue slightly (±30 degrees) to create distinct but related colors
    const hueVariation = (progress - 0.5) * 40; // ±20 degrees
    const newH = (h + hueVariation + 360) % 360;
    
    // Vary saturation (60-100%) to keep colors vibrant
    const newS = Math.max(60, Math.min(100, s + (progress - 0.5) * 20));
    
    // Vary lightness (40-70%) to ensure good contrast
    const lightnessVariation = (progress - 0.5) * 30;
    const newL = Math.max(40, Math.min(70, l + lightnessVariation));
    
    colors.push(hslToHex(newH, newS, newL));
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
    "#d97706", // amber-600
    "#b45309", // amber-700
    "#92400e", // amber-800
    "#78350f", // amber-900
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
