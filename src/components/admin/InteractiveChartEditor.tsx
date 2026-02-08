"use client";

import React, { useState, useRef, useMemo } from "react";
import { ChartData } from "@/data/events";
import UniversalChart from "@/components/sidebar/UniversalChart";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { getChartColors } from "@/lib/chart-color-utils";
import { Edit2, X, Save } from "lucide-react";

interface InteractiveChartEditorProps {
  chart: ChartData;
  onChartUpdate: (chart: ChartData) => void;
  isEditable?: boolean;
}

interface EditableElement {
  type: "title" | "axis" | "data" | "legend" | "background";
  id: string;
  value: any;
}

export function InteractiveChartEditor({
  chart,
  onChartUpdate,
  isEditable = true,
}: InteractiveChartEditorProps) {
  const [editingElement, setEditingElement] = useState<EditableElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);

  // Get colors
  const theoryColor = chart.theory
    ? getTheoryColor(chart.theory as TheoryType)
    : undefined;
  const seriesCount = chart.dataKeys?.length || 1;
  const theoryColors = theoryColor
    ? getChartColors(theoryColor, seriesCount)
    : undefined;
  // Use customColors if provided, otherwise use theory colors or default
  const colors = useMemo(() => {
    if (chart.customColors && chart.customColors.length > 0) {
      return chart.customColors;
    }
    return theoryColors || ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  }, [chart.customColors, theoryColors]);

  const handleElementClick = (element: EditableElement, event: React.MouseEvent) => {
    if (!isEditable) return;
    event.stopPropagation();
    setEditingElement(element);
  };

  const handleSaveEdit = () => {
    if (!editingElement) return;

    const updatedChart = { ...chart };

    switch (editingElement.type) {
      case "title":
        updatedChart.title = editingElement.value;
        break;
      case "axis":
        if (editingElement.id === "xAxis") {
          updatedChart.xAxisLabel = editingElement.value;
        } else if (editingElement.id === "yAxis") {
          updatedChart.yAxisLabel = editingElement.value;
        }
        break;
      case "data":
        // Update data point
        const dataIndex = parseInt(editingElement.id);
        if (!isNaN(dataIndex) && updatedChart.data[dataIndex]) {
          updatedChart.data[dataIndex] = {
            ...updatedChart.data[dataIndex],
            ...editingElement.value,
          };
        }
        break;
      case "background":
        updatedChart.formatting = {
          ...updatedChart.formatting,
          backgroundColor: editingElement.value,
        };
        break;
    }

    onChartUpdate(updatedChart);
    setEditingElement(null);
  };

  const handleCancelEdit = () => {
    setEditingElement(null);
  };

  // Render editable overlay
  const renderEditableOverlay = () => {
    if (!isEditable) return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Title Overlay */}
        <div
          className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-auto"
          onMouseEnter={() => setHoveredElement("title")}
          onMouseLeave={() => setHoveredElement(null)}
        >
          <div
            className={`px-3 py-1 rounded cursor-pointer transition-all ${
              hoveredElement === "title" || editingElement?.id === "title"
                ? "bg-blue-600/80 text-white"
                : "bg-black/50 text-gray-300 opacity-0 hover:opacity-100"
            }`}
            onClick={(e) =>
              handleElementClick(
                { type: "title", id: "title", value: chart.title },
                e
              )
            }
          >
            {editingElement?.id === "title" ? (
              <input
                type="text"
                value={editingElement.value}
                onChange={(e) =>
                  setEditingElement({ ...editingElement, value: e.target.value })
                }
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                autoFocus
                className="bg-transparent border-none outline-none text-white"
                style={{ width: `${chart.title.length * 8}px` }}
              />
            ) : (
              <span className="text-sm font-semibold">{chart.title}</span>
            )}
          </div>
        </div>

        {/* X-Axis Label Overlay */}
        {chart.xAxisLabel && (
          <div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto"
            onMouseEnter={() => setHoveredElement("xAxis")}
            onMouseLeave={() => setHoveredElement(null)}
          >
            <div
              className={`px-2 py-1 rounded cursor-pointer transition-all ${
                hoveredElement === "xAxis" || editingElement?.id === "xAxis"
                  ? "bg-blue-600/80 text-white"
                  : "bg-black/50 text-gray-300 opacity-0 hover:opacity-100"
              }`}
              onClick={(e) =>
                handleElementClick(
                  { type: "axis", id: "xAxis", value: chart.xAxisLabel || "" },
                  e
                )
              }
            >
              {editingElement?.id === "xAxis" ? (
                <input
                  type="text"
                  value={editingElement.value}
                  onChange={(e) =>
                    setEditingElement({ ...editingElement, value: e.target.value })
                  }
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                  className="bg-transparent border-none outline-none text-white text-xs"
                  style={{ width: `${(chart.xAxisLabel?.length || 0) * 6}px` }}
                />
              ) : (
                <span className="text-xs">{chart.xAxisLabel}</span>
              )}
            </div>
          </div>
        )}

        {/* Y-Axis Label Overlay */}
        {chart.yAxisLabel && (
          <div
            className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 origin-center pointer-events-auto"
            onMouseEnter={() => setHoveredElement("yAxis")}
            onMouseLeave={() => setHoveredElement(null)}
          >
            <div
              className={`px-2 py-1 rounded cursor-pointer transition-all ${
                hoveredElement === "yAxis" || editingElement?.id === "yAxis"
                  ? "bg-blue-600/80 text-white"
                  : "bg-black/50 text-gray-300 opacity-0 hover:opacity-100"
              }`}
              onClick={(e) =>
                handleElementClick(
                  { type: "axis", id: "yAxis", value: chart.yAxisLabel || "" },
                  e
                )
              }
            >
              {editingElement?.id === "yAxis" ? (
                <input
                  type="text"
                  value={editingElement.value}
                  onChange={(e) =>
                    setEditingElement({ ...editingElement, value: e.target.value })
                  }
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                  className="bg-transparent border-none outline-none text-white text-xs"
                  style={{ width: `${(chart.yAxisLabel?.length || 0) * 6}px` }}
                />
              ) : (
                <span className="text-xs">{chart.yAxisLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-slate-900/50 rounded p-4" ref={chartRef}>
      {isEditable && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            onClick={() => setEditingElement({ type: "title", id: "title", value: chart.title })}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Edit Chart"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )}

      <div className="relative">
        <UniversalChart
          title=""
          type={chart.type}
          data={chart.data}
          dataKeys={chart.dataKeys}
          colors={colors}
          height={400}
          xAxisLabel={chart.xAxisLabel}
          yAxisLabel={chart.yAxisLabel}
          customColors={chart.customColors}
          formatting={chart.formatting}
        />
        {renderEditableOverlay()}
      </div>

      {/* Edit Modal */}
      {editingElement && editingElement.type === "data" && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Data Point</h3>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={editingElement.value.label || ""}
                  onChange={(e) =>
                    setEditingElement({
                      ...editingElement,
                      value: { ...editingElement.value, label: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={editingElement.value.value || 0}
                  onChange={(e) =>
                    setEditingElement({
                      ...editingElement,
                      value: {
                        ...editingElement.value,
                        value: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-2"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
