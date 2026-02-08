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

// Chart style previews with different visual styles
const CHART_STYLES = [
  { id: "style1", name: "Style 1", description: "Classic with gridlines" },
  { id: "style2", name: "Style 2", description: "Minimal clean" },
  { id: "style3", name: "Style 3", description: "Bold modern" },
];

export function ChartStyleSelector({
  chart,
  onStyleChange,
  onColorChange,
  onFormattingChange,
  selectedColors,
}: ChartStyleSelectorProps) {
  const [activeTab, setActiveTab] = useState<"style" | "colour">("style");
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

  // Get colors
  const theoryColor = chart.theory
    ? getTheoryColor(chart.theory as TheoryType)
    : undefined;
  const seriesCount = chart.dataKeys?.length || 1;
  const theoryColors = theoryColor
    ? getChartColors(theoryColor, seriesCount)
    : undefined;
  const colors = selectedColors && selectedColors.length > 0
    ? selectedColors
    : theoryColors || ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  // Render style preview
  const renderStylePreview = (styleId: string) => {
    const formatting = {
      showGridlines: styleId === "style1" || styleId === "style3",
      legendPosition: "bottom" as const,
      showDataLabels: styleId === "style3",
      backgroundColor: styleId === "style3" ? "#1e293b" : undefined,
    };

    return (
      <div className="bg-slate-900/50 rounded p-2 border border-slate-700/50">
        <UniversalChart
          title="CHART TITLE"
          type={chart.type}
          data={sampleData}
          dataKeys={chart.dataKeys}
          colors={colors}
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
            {CHART_STYLES.map((style) => (
              <div
                key={style.id}
                className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 transition-colors border border-slate-700/50 hover:border-slate-600"
                onClick={() => {
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
                {renderStylePreview(style.id)}
                <p className="text-xs text-gray-400 mt-1 text-center">{style.name}</p>
              </div>
            ))}
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
