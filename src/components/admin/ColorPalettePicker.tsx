"use client";

import React, { useState } from "react";
import { Palette, X } from "lucide-react";

interface ColorPalettePickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
}

// Predefined color palettes
const COLOR_PALETTES = {
  theme: [
    "#d4b896", // Soft gold
    "#a8c8d4", // Soft blue
    "#c4d4a8", // Soft green
    "#d4a8c8", // Soft purple
    "#a8b8d4", // Soft navy
    "#d4c4a8", // Soft yellow
  ],
  vibrant: [
    "#f9464c", // Red
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#8b5cf6", // Purple
    "#ec4899", // Pink
  ],
  pastel: [
    "#fecaca", // Light red
    "#bfdbfe", // Light blue
    "#bbf7d0", // Light green
    "#fde68a", // Light yellow
    "#e9d5ff", // Light purple
    "#fbcfe8", // Light pink
  ],
  professional: [
    "#64748b", // Slate
    "#475569", // Dark slate
    "#334155", // Darker slate
    "#1e293b", // Darkest slate
    "#94a3b8", // Light slate
    "#cbd5e1", // Lighter slate
  ],
  warm: [
    "#dc2626", // Red
    "#ea580c", // Orange
    "#d97706", // Amber
    "#ca8a04", // Yellow
    "#eab308", // Bright yellow
    "#f59e0b", // Orange-yellow
  ],
  cool: [
    "#0284c7", // Sky blue
    "#0891b2", // Cyan
    "#06b6d4", // Light cyan
    "#0d9488", // Teal
    "#059669", // Green
    "#10b981", // Emerald
  ],
};

const PRESET_COLORS = [
  "#f9464c", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6", "#ef4444",
  "#0ea5e9", "#22c55e", "#a855f7", "#d4b896", "#a8c8d4", "#c4d4a8",
  "#d4a8c8", "#a8b8d4", "#d4c4a8", "#c8a8b8", "#b8c8d4", "#c8d4b8",
];

export function ColorPalettePicker({ colors, onChange, maxColors = 10 }: ColorPalettePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    onChange(newColors);
  };

  const handleAddColor = () => {
    if (colors.length < maxColors) {
      onChange([...colors, "#d4b896"]);
    }
  };

  const handleRemoveColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    onChange(newColors);
  };

  const handlePaletteSelect = (palette: string[]) => {
    onChange(palette.slice(0, maxColors));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-300">
          Custom Colors ({colors.length}/{maxColors})
        </label>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          <Palette size={14} />
          {showPicker ? "Hide" : "Show"} Options
        </button>
      </div>

      {/* Color Swatches */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <div key={index} className="relative group">
            <div
              className="w-10 h-10 rounded border-2 border-slate-600 cursor-pointer hover:border-slate-400 transition-colors"
              style={{ backgroundColor: color }}
              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
            />
            {editingIndex === index && (
              <div className="absolute top-12 left-0 z-10 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-xl">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-32 h-8 cursor-pointer"
                />
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(index)}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {colors.length < maxColors && (
          <button
            type="button"
            onClick={handleAddColor}
            className="w-10 h-10 rounded border-2 border-dashed border-slate-600 hover:border-slate-400 text-slate-400 hover:text-slate-300 flex items-center justify-center transition-colors"
          >
            +
          </button>
        )}
      </div>

      {/* Color Options Panel */}
      {showPicker && (
        <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4 space-y-4">
          {/* Preset Palettes */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Preset Palettes
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(COLOR_PALETTES).map(([name, palette]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePaletteSelect(palette)}
                  className="flex items-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 rounded text-left transition-colors"
                >
                  <div className="flex gap-1">
                    {palette.slice(0, 6).map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded border border-slate-600"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-300 capitalize">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Color Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Quick Colors
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (colors.length < maxColors) {
                      handleAddColor();
                      handleColorChange(colors.length, color);
                    } else {
                      handleColorChange(0, color);
                    }
                  }}
                  className="w-8 h-8 rounded border-2 border-slate-600 hover:border-slate-400 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Custom Color (Hex)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="#d4b896"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value;
                    if (/^#[0-9A-Fa-f]{6}$/i.test(value)) {
                      if (colors.length < maxColors) {
                        handleAddColor();
                        handleColorChange(colors.length, value);
                      } else {
                        handleColorChange(0, value);
                      }
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <input
                type="color"
                onChange={(e) => {
                  if (colors.length < maxColors) {
                    handleAddColor();
                    handleColorChange(colors.length, e.target.value);
                  } else {
                    handleColorChange(0, e.target.value);
                  }
                }}
                className="w-12 h-10 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
