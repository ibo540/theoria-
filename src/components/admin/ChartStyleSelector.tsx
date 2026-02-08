"use client";

import React, { useState } from "react";
import { ChartData } from "@/data/events";
import UniversalChart from "@/components/sidebar/UniversalChart";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { ChevronRight, ChevronLeft, Palette } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-full flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-600/50 rounded-lg hover:bg-slate-800/70 transition-colors text-white"
      >
        <Palette size={20} />
        <span className="text-sm font-medium">Show Style Options</span>
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Chart Styles</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
          title="Hide Style Options"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Style Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {theoryColor && (
            <div className="mb-3 pb-3 border-b border-slate-700">
              <p className="text-xs text-gray-400">
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
      </div>
    </div>
  );
}

