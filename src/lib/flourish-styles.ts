// Flourish-like chart styling system
// Professional, publication-quality chart presets

export interface FlourishStyle {
  id: string;
  name: string;
  description: string;
  colors: string[];
  formatting: {
    showGridlines: boolean;
    gridlineStyle: "solid" | "dashed" | "dotted" | "none";
    gridlineColor: string;
    legendPosition: "top" | "bottom" | "left" | "right" | "none";
    showDataLabels: boolean;
    dataLabelStyle: "default" | "bold" | "minimal";
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius: number;
    padding: number;
    fontFamily: string;
    fontSize: number;
    fontWeight: "normal" | "medium" | "semibold" | "bold";
    animation: "smooth" | "bounce" | "fade" | "none";
    shadow: boolean;
    gradient: boolean;
    opacity: number;
  };
}

// Professional color palettes inspired by Flourish
export const FLOURISH_COLOR_PALETTES = {
  vibrant: [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80"
  ],
  elegant: [
    "#2C3E50", "#34495E", "#7F8C8D", "#95A5A6", "#BDC3C7",
    "#ECF0F1", "#3498DB", "#9B59B6", "#E74C3C", "#F39C12"
  ],
  modern: [
    "#667EEA", "#764BA2", "#F093FB", "#4FACFE", "#00F2FE",
    "#43E97B", "#38F9D7", "#FA709A", "#FEE140", "#30CFD0"
  ],
  corporate: [
    "#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE",
    "#065F46", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"
  ],
  pastel: [
    "#FFE5E5", "#FFE5F1", "#F0E5FF", "#E5F0FF", "#E5FFF0",
    "#FFF5E5", "#FFE5F5", "#E5F5FF", "#F5FFE5", "#FFE5E0"
  ],
  monochrome: [
    "#000000", "#1A1A1A", "#333333", "#4D4D4D", "#666666",
    "#808080", "#999999", "#B3B3B3", "#CCCCCC", "#E6E6E6"
  ],
};

// Generate theory-based color palette
export function generateTheoryPalette(baseColor: string, count: number = 5): string[] {
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.3 + (i * 0.15); // 30% to 90% intensity
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    colors.push(`#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`);
  }
  return colors;
}

// Flourish-style presets
export const FLOURISH_STYLES: FlourishStyle[] = [
  {
    id: "flourish-modern",
    name: "Modern Flourish",
    description: "Clean, contemporary design with smooth gradients",
    colors: FLOURISH_COLOR_PALETTES.modern,
    formatting: {
      showGridlines: true,
      gridlineStyle: "dashed",
      gridlineColor: "rgba(255, 255, 255, 0.1)",
      legendPosition: "top",
      showDataLabels: false,
      dataLabelStyle: "default",
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      borderRadius: 12,
      padding: 20,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 12,
      fontWeight: "medium",
      animation: "smooth",
      shadow: true,
      gradient: true,
      opacity: 0.9,
    },
  },
  {
    id: "flourish-elegant",
    name: "Elegant Flourish",
    description: "Sophisticated, professional look with subtle styling",
    colors: FLOURISH_COLOR_PALETTES.elegant,
    formatting: {
      showGridlines: true,
      gridlineStyle: "solid",
      gridlineColor: "rgba(255, 255, 255, 0.15)",
      legendPosition: "bottom",
      showDataLabels: true,
      dataLabelStyle: "bold",
      backgroundColor: "rgba(30, 41, 59, 0.9)",
      borderColor: "rgba(255, 228, 190, 0.2)",
      borderWidth: 1,
      borderRadius: 8,
      padding: 24,
      fontFamily: "Georgia, serif",
      fontSize: 13,
      fontWeight: "semibold",
      animation: "fade",
      shadow: true,
      gradient: false,
      opacity: 1,
    },
  },
  {
    id: "flourish-minimal",
    name: "Minimal Flourish",
    description: "Ultra-clean, minimal aesthetic",
    colors: [
      "#E8D5B7", // Light beige
      "#D4A574", // Medium beige
      "#C4956A", // Darker beige
      "#B8865F", // Dark beige
      "#A67854", // Darkest beige
    ],
    formatting: {
      showGridlines: false,
      gridlineStyle: "none",
      gridlineColor: "transparent",
      legendPosition: "right",
      showDataLabels: false,
      dataLabelStyle: "minimal",
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      borderRadius: 16,
      padding: 16,
      fontFamily: "system-ui, sans-serif",
      fontSize: 11,
      fontWeight: "normal",
      animation: "none",
      shadow: false,
      gradient: false,
      opacity: 1,
    },
  },
  {
    id: "flourish-bold",
    name: "Bold Flourish",
    description: "High-impact, vibrant design",
    colors: FLOURISH_COLOR_PALETTES.vibrant,
    formatting: {
      showGridlines: true,
      gridlineStyle: "dotted",
      gridlineColor: "rgba(255, 255, 255, 0.2)",
      legendPosition: "top",
      showDataLabels: true,
      dataLabelStyle: "bold",
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      borderRadius: 0,
      padding: 20,
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fontWeight: "bold",
      animation: "bounce",
      shadow: true,
      gradient: true,
      opacity: 1,
    },
  },
  {
    id: "flourish-corporate",
    name: "Corporate Flourish",
    description: "Professional, business-ready charts",
    colors: FLOURISH_COLOR_PALETTES.corporate,
    formatting: {
      showGridlines: true,
      gridlineStyle: "solid",
      gridlineColor: "rgba(255, 255, 255, 0.1)",
      legendPosition: "bottom",
      showDataLabels: false,
      dataLabelStyle: "default",
      backgroundColor: "rgba(30, 58, 138, 0.1)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      borderWidth: 2,
      borderRadius: 6,
      padding: 18,
      fontFamily: "Roboto, sans-serif",
      fontSize: 12,
      fontWeight: "medium",
      animation: "smooth",
      shadow: false,
      gradient: false,
      opacity: 1,
    },
  },
  {
    id: "flourish-monochrome",
    name: "Monochrome Flourish",
    description: "Classic black and white elegance",
    colors: [
      "#FFFFFF", // White
      "#E6E6E6", // Very light gray
      "#CCCCCC", // Light gray
      "#B3B3B3", // Medium-light gray
      "#999999", // Medium gray
      "#808080", // Medium-dark gray
      "#666666", // Dark gray
      "#4D4D4D", // Darker gray
    ],
    formatting: {
      showGridlines: true,
      gridlineStyle: "solid",
      gridlineColor: "rgba(255, 255, 255, 0.3)",
      legendPosition: "right",
      showDataLabels: true,
      dataLabelStyle: "minimal",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderWidth: 1,
      borderRadius: 4,
      padding: 20,
      fontFamily: "Courier New, monospace",
      fontSize: 11,
      fontWeight: "normal",
      animation: "fade",
      shadow: false,
      gradient: false,
      opacity: 1,
    },
  },
];

// Generate theory-specific Flourish styles
export function getTheoryFlourishStyles(theoryColor?: string): FlourishStyle[] {
  if (!theoryColor) {
    return FLOURISH_STYLES;
  }

  const theoryColors = generateTheoryPalette(theoryColor, 10);
  
  return FLOURISH_STYLES.map((style, index) => ({
    ...style,
    colors: theoryColors,
    formatting: {
      ...style.formatting,
      borderColor: theoryColor + "40", // Add opacity
    },
  }));
}

// Apply Flourish style to chart formatting
export function applyFlourishStyle(
  style: FlourishStyle,
  customColors?: string[]
): {
  colors: string[];
  formatting: {
    showGridlines?: boolean;
    legendPosition?: "top" | "bottom" | "left" | "right" | "none";
    showDataLabels?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
} {
  return {
    colors: customColors || style.colors,
    formatting: {
      showGridlines: style.formatting.showGridlines,
      legendPosition: style.formatting.legendPosition,
      showDataLabels: style.formatting.showDataLabels,
      backgroundColor: style.formatting.backgroundColor,
      borderColor: style.formatting.borderColor,
      borderWidth: style.formatting.borderWidth,
    },
  };
}
