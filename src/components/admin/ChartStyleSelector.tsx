"use client";

import React, { useState } from "react";
import { ChartData } from "@/data/events";
import UniversalChart from "@/components/sidebar/UniversalChart";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { getChartColors } from "@/lib/chart-color-utils";

interface ChartStyleSelectorProps {
  chart: ChartData;
  onStyleChange: (style: ChartData["type"]) => void;
  onColorChange: (colors: string[]) => void;
  onFormattingChange?: (formatting: ChartData["formatting"]) => void;
  selectedColors?: string[];
}

// Generate theory-based style recommendations
const getTheoryBasedStyles = (theoryColor?: string) => {
  if (!theoryColor) {
    return [
      { id: "style1", name: "Style 1", description: "Classic with gridlines", colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"] },
      { id: "style2", name: "Style 2", description: "Minimal clean", colors: ["#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"] },
      { id: "style3", name: "Style 3", description: "Bold modern", colors: ["#ef4444", "#f97316", "#eab308", "#84cc16"] },
    ];
  }

  // Generate 3 monochromatic variations from theory color
  const generateMonochromaticVariations = (baseColor: string) => {
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Style 1: Classic - Darker variations
    const style1Colors = [];
    for (let i = 0; i < 4; i++) {
      const factor = 0.3 + (i * 0.2); // 30% to 90% intensity
      const newR = Math.round(r * factor);
      const newG = Math.round(g * factor);
      const newB = Math.round(b * factor);
      style1Colors.push(`#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`);
    }

    // Style 2: Minimal - Lighter, desaturated variations
    const style2Colors = [];
    for (let i = 0; i < 4; i++) {
      const factor = 0.4 + (i * 0.15); // 40% to 85% intensity, more desaturated
      const saturation = 0.6; // Reduce saturation
      const newR = Math.round(r * factor * saturation + 255 * factor * (1 - saturation));
      const newG = Math.round(g * factor * saturation + 255 * factor * (1 - saturation));
      const newB = Math.round(b * factor * saturation + 255 * factor * (1 - saturation));
      style2Colors.push(`#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`);
    }

    // Style 3: Bold - Vibrant, high contrast variations
    const style3Colors = [];
    for (let i = 0; i < 4; i++) {
      const factor = 0.5 + (i * 0.15); // 50% to 95% intensity
      const boost = 1.2; // Boost saturation
      const newR = Math.min(255, Math.round(r * factor * boost));
      const newG = Math.min(255, Math.round(g * factor * boost));
      const newB = Math.min(255, Math.round(b * factor * boost));
      style3Colors.push(`#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`);
    }

    return [style1Colors, style2Colors, style3Colors];
  };

  const [style1Colors, style2Colors, style3Colors] = generateMonochromaticVariations(theoryColor);

  return [
    { id: "style1", name: "Classic", description: "Classic with gridlines", colors: style1Colors },
    { id: "style2", name: "Minimal", description: "Minimal clean", colors: style2Colors },
    { id: "style3", name: "Bold", description: "Bold modern", colors: style3Colors },
  ];
};

export function ChartStyleSelector({
  chart,
  onStyleChange,
  onColorChange,
  onFormattingChange,
  selectedColors,
}: ChartStyleSelectorProps) {
  const [activeTab, setActiveTab] = useState<"style" | "colour">("style");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);

  // Generate sample data for preview
  const sampleData = chart.data.length > 0
    ? chart.data.slice(0, 10) // Use first 10 data points for preview
    : [
        { label: "A", value: 5000 },
        { label: "B", value: 12000 },
        { label: "C", value: 8000 },
        { label: "D", value: 15000 },
        { label: "E", value: 10000 },
      ];

  // Get theory color
  const theoryColor = chart.theory
    ? getTheoryColor(chart.theory as TheoryType)
    : undefined;
  const seriesCount = chart.dataKeys?.length || 1;
  
  // Get theory-based recommended styles
  const recommendedStyles = getTheoryBasedStyles(theoryColor);
  
  // Use selected colors if available, otherwise use first recommended style
  const colors = selectedColors && selectedColors.length > 0
    ? selectedColors
    : recommendedStyles[0]?.colors || ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  // Render style preview
  const renderStylePreview = (style: typeof recommendedStyles[0], isSelected: boolean) => {
    const formatting = {
      showGridlines: style.id === "style1" || style.id === "style3",
      legendPosition: "bottom" as const,
      showDataLabels: style.id === "style3",
      backgroundColor: style.id === "style3" ? "#1e293b" : undefined,
    };

    // Use style-specific colors
    const styleColors = style.colors.slice(0, seriesCount);

    return (
      <div className={`bg-slate-900/50 rounded p-2 border transition-all ${
        isSelected 
          ? "border-green-500 ring-2 ring-green-500/50" 
          : "border-slate-700/50 hover:border-slate-600"
      }`}>
        <UniversalChart
          title="CHART TITLE"
          type={chart.type}
          data={sampleData}
          dataKeys={chart.dataKeys}
          colors={styleColors}
          height={120}
          formatting={formatting}
        />
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab("style")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "style"
              ? "text-white border-b-2 border-green-500 bg-slate-800/50"
              : "text-gray-400 hover:text-white hover:bg-slate-800/30"
          }`}
        >
          Style
        </button>
        <button
          onClick={() => setActiveTab("colour")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "colour"
              ? "text-white border-b-2 border-green-500 bg-slate-800/50"
              : "text-gray-400 hover:text-white hover:bg-slate-800/30"
          }`}
        >
          Colour
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === "style" && (
          <div className="space-y-3">
            {theoryColor && (
              <div className="mb-3 pb-3 border-b border-slate-700">
                <p className="text-xs text-gray-400 mb-2">
                  Recommended styles for {chart.theory ? chart.theory.charAt(0).toUpperCase() + chart.theory.slice(1) : "this theory"}:
                </p>
              </div>
            )}
            {recommendedStyles.map((style) => {
              const isSelected = selectedStyleId === style.id;
              return (
                <div
                  key={style.id}
                  className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                  onClick={() => {
                    setSelectedStyleId(style.id);
                    // Apply style colors
                    const styleColors = style.colors.slice(0, seriesCount);
                    onColorChange(styleColors);
                    
                    // Apply style formatting
                    const newFormatting = {
                      ...chart.formatting,
                      showGridlines: style.id === "style1" || style.id === "style3",
                      legendPosition: "bottom" as const,
                      showDataLabels: style.id === "style3",
                      backgroundColor: style.id === "style3" ? "#1e293b" : chart.formatting?.backgroundColor,
                    };
                    if (onFormattingChange) {
                      onFormattingChange(newFormatting);
                    }
                  }}
                >
                  {renderStylePreview(style, isSelected)}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-300 font-medium">{style.name}</p>
                    <p className="text-xs text-gray-500">{style.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "colour" && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Monochromatic
            </h4>
            <MonochromaticColorPicker
              selectedColors={colors}
              onColorChange={onColorChange}
              seriesCount={seriesCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Monochromatic Color Picker Component
interface MonochromaticColorPickerProps {
  selectedColors: string[];
  onColorChange: (colors: string[]) => void;
  seriesCount: number;
}

function MonochromaticColorPicker({
  selectedColors,
  onColorChange,
  seriesCount,
}: MonochromaticColorPickerProps) {
  // Generate monochromatic color palettes
  const generateMonochromaticPalette = (baseColor: string, steps: number = 8): string[] => {
    // Convert hex to RGB
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const palette: string[] = [];
    for (let i = 0; i < steps; i++) {
      const factor = i / (steps - 1);
      // Create gradient from dark to light
      const newR = Math.round(r * (1 - factor * 0.5) + 255 * factor * 0.3);
      const newG = Math.round(g * (1 - factor * 0.5) + 255 * factor * 0.3);
      const newB = Math.round(b * (1 - factor * 0.5) + 255 * factor * 0.3);
      palette.push(
        `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
      );
    }
    return palette;
  };

  // Predefined base colors for monochromatic palettes
  const baseColors = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f59e0b", // Orange
    "#64748b", // Gray
    "#3b82f6", // Light Blue
    "#ec4899", // Pink
    "#84cc16", // Lime Green
  ];

  const handlePaletteSelect = (baseColor: string) => {
    const palette = generateMonochromaticPalette(baseColor, 8);
    // Select colors evenly spaced from the palette based on series count
    const selected = [];
    for (let i = 0; i < seriesCount; i++) {
      const index = Math.round((i / (seriesCount - 1 || 1)) * (palette.length - 1));
      selected.push(palette[index]);
    }
    onColorChange(selected);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-8 gap-1">
        {baseColors.map((baseColor, index) => {
          const palette = generateMonochromaticPalette(baseColor, 8);
          const isSelected =
            selectedColors.length > 0 &&
            palette.some((color) =>
              selectedColors.some(
                (selected) => selected.toLowerCase() === color.toLowerCase()
              )
            );

          return (
            <div key={index} className="space-y-1">
              <button
                onClick={() => handlePaletteSelect(baseColor)}
                className={`w-full aspect-square rounded border-2 transition-all ${
                  isSelected
                    ? "border-white ring-2 ring-green-500"
                    : "border-slate-600 hover:border-slate-400"
                }`}
                style={{
                  background: `linear-gradient(to bottom, ${palette[0]}, ${palette[palette.length - 1]})`,
                }}
                title={`Monochromatic ${baseColor}`}
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center">
        Click a color to apply monochromatic palette
      </p>
    </div>
  );
}
