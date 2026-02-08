"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DataSelectorProps {
  headers: string[];
  data: any[][];
  selectedSeries: string[];
  selectedCategories: string[];
  onSeriesChange: (series: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onApply: () => void;
  onSelectData?: () => void;
}

export function DataSelector({
  headers,
  data,
  selectedSeries,
  selectedCategories,
  onSeriesChange,
  onCategoriesChange,
  onApply,
  onSelectData,
}: DataSelectorProps) {
  const [activeTab, setActiveTab] = useState<"values" | "names">("values");
  const [seriesExpanded, setSeriesExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  // Get unique values for categories (first column typically)
  const getUniqueCategories = (): string[] => {
    if (data.length === 0) return [];
    const firstColumn = data.map((row) => String(row[0] || ""));
    return Array.from(new Set(firstColumn)).filter((v) => v !== "");
  };

  const categories = getUniqueCategories();
  const allSeries = headers.slice(1); // Exclude first column (usually labels)

  const handleSeriesToggle = (series: string) => {
    if (selectedSeries.includes(series)) {
      onSeriesChange(selectedSeries.filter((s) => s !== series));
    } else {
      onSeriesChange([...selectedSeries, series]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const handleSelectAllSeries = () => {
    if (selectedSeries.length === allSeries.length) {
      onSeriesChange([]);
    } else {
      onSeriesChange([...allSeries]);
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      onCategoriesChange([]);
    } else {
      onCategoriesChange([...categories]);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab("values")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "values"
              ? "text-white border-b-2 border-green-500 bg-slate-800/50"
              : "text-gray-400 hover:text-white hover:bg-slate-800/30"
          }`}
        >
          Values
        </button>
        <button
          onClick={() => setActiveTab("names")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "names"
              ? "text-white border-b-2 border-green-500 bg-slate-800/50"
              : "text-gray-400 hover:text-white hover:bg-slate-800/30"
          }`}
        >
          Names
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Series Section */}
        <div className="mb-4">
          <button
            onClick={() => setSeriesExpanded(!seriesExpanded)}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-700/30 rounded transition-colors"
          >
            <span className="text-sm font-semibold text-white">Series</span>
            {seriesExpanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronUp size={16} className="text-gray-400" />
            )}
          </button>

          {seriesExpanded && (
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2 p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSeries.length === allSeries.length && allSeries.length > 0}
                  onChange={handleSelectAllSeries}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">(Select All)</span>
              </label>

              {allSeries.map((series, index) => {
                const isSelected = selectedSeries.includes(series);
                return (
                  <label
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSeriesToggle(series)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="w-3 h-8 bg-blue-500 rounded-sm" />
                    <span className="text-sm text-gray-300">{series || `Column ${index + 2}`}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div>
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-700/30 rounded transition-colors"
          >
            <span className="text-sm font-semibold text-white">Categories</span>
            {categoriesExpanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronUp size={16} className="text-gray-400" />
            )}
          </button>

          {categoriesExpanded && (
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2 p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.length === categories.length && categories.length > 0}
                  onChange={handleSelectAllCategories}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">(Select All)</span>
              </label>

              {categories.map((category, index) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <label
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-300">{category}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-700 p-4 flex items-center justify-between">
        <button
          onClick={onApply}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm"
        >
          Apply
        </button>
        {onSelectData && (
          <button
            onClick={onSelectData}
            className="text-green-500 hover:text-green-400 underline text-sm transition-colors"
          >
            Select Data...
          </button>
        )}
      </div>
    </div>
  );
}
