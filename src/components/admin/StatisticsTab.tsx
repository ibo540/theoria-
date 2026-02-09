"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Save, X, Upload, Eye, CheckCircle, Info, Settings, ChevronLeft, ChevronRight, Palette, Menu } from "lucide-react";
import { EventData, ChartData } from "@/data/events";
import { DataUploader } from "./DataUploader";
import { ExcelLikeSpreadsheet } from "./ExcelLikeSpreadsheet";
import { ChartPreview } from "./ChartPreview";
import { ColorPalettePicker } from "./ColorPalettePicker";
import { ChartStyleSelector } from "./ChartStyleSelector";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import UniversalChart from "@/components/sidebar/UniversalChart";
import { DataSelector } from "./DataSelector";
import { suggestChartTypes, convertToChartData } from "@/lib/chart-suggestions";

interface StatisticsTabProps {
  event: Partial<EventData>;
  setEvent: (event: Partial<EventData>) => void;
}

const CHART_TYPES: Array<{ value: ChartData["type"]; label: string }> = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "radar", label: "Radar Chart" },
];

const THEORIES = [
  { id: "realism", name: "Realism" },
  { id: "neorealism", name: "Neorealism" },
  { id: "liberalism", name: "Liberalism" },
  { id: "neoliberal", name: "Neoliberalism" },
  { id: "englishschool", name: "English School" },
  { id: "constructivism", name: "Constructivism" },
];

// Helper function to generate theory-based styles (from ChartStyleSelector)
const getTheoryBasedStyles = (theoryColor?: string) => {
  if (!theoryColor) {
    return [
      { id: "style1", name: "Classic", description: "Classic with gridlines", colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"] },
      { id: "style2", name: "Minimal", description: "Minimal clean", colors: ["#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"] },
      { id: "style3", name: "Bold", description: "Bold modern", colors: ["#ef4444", "#f97316", "#eab308", "#84cc16"] },
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

export function StatisticsTab({ event, setEvent }: StatisticsTabProps) {
  const charts = event.stats?.charts || [];
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [editingChart, setEditingChart] = useState<Partial<ChartData> | null>(null);
  
  // File upload and spreadsheet state
  const [uploadedData, setUploadedData] = useState<{ headers: string[]; data: any[][] } | null>(null);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [chartSuggestions, setChartSuggestions] = useState<Array<{ type: ChartData["type"]; confidence: number; reason: string }>>([]);
  const [selectedLabelColumn, setSelectedLabelColumn] = useState<number>(0);
  const [selectedValueColumns, setSelectedValueColumns] = useState<number[]>([]);
  const [previewChart, setPreviewChart] = useState<ChartData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
    id: number;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "info" | "error" = "info") => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddChart = () => {
    const newChart: ChartData = {
      id: `chart-${Date.now()}`,
      title: "New Chart",
      type: "bar",
      data: [{ label: "Sample", value: 0 }],
      theory: event.theory, // Auto-detect theory from event
    };

    setEvent({
      ...event,
      stats: {
        ...event.stats,
        charts: [...charts, newChart],
      },
    });

    setEditingChartId(newChart.id);
    setEditingChart(newChart);
  };

  const handleEditChart = (chart: ChartData) => {
    setEditingChartId(chart.id);
    setEditingChart({ ...chart });
  };

  const handleSaveChart = () => {
    if (!editingChart || !editingChartId) return;

    const updatedCharts = charts.map((chart) =>
      chart.id === editingChartId ? (editingChart as ChartData) : chart
    );

    setEvent({
      ...event,
      stats: {
        ...event.stats,
        charts: updatedCharts,
      },
    });

    setEditingChartId(null);
    setEditingChart(null);
  };

  const handleDeleteChart = (chartId: string) => {
    const updatedCharts = charts.filter((chart) => chart.id !== chartId);
    setEvent({
      ...event,
      stats: {
        ...event.stats,
        charts: updatedCharts,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingChartId(null);
    setEditingChart(null);
  };

  const handleUpdateChartField = (field: keyof ChartData, value: any) => {
    if (!editingChart) return;
    setEditingChart({ ...editingChart, [field]: value });
  };

  const handleAddDataPoint = () => {
    if (!editingChart) return;
    const newDataPoint = { label: "New Point", value: 0 };
    setEditingChart({
      ...editingChart,
      data: [...(editingChart.data || []), newDataPoint],
    });
  };

  const handleUpdateDataPoint = (index: number, field: string, value: any) => {
    if (!editingChart || !editingChart.data) return;
    const updatedData = [...editingChart.data];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setEditingChart({ ...editingChart, data: updatedData });
  };

  const handleDeleteDataPoint = (index: number) => {
    if (!editingChart || !editingChart.data) return;
    const updatedData = editingChart.data.filter((_, i) => i !== index);
    setEditingChart({ ...editingChart, data: updatedData });
  };

  // File upload handlers
  const handleDataLoaded = (data: any[][], headers: string[]) => {
    // Limit data size to prevent browser freeze
    const MAX_ROWS = 1000; // Limit to 1000 rows for spreadsheet editor
    const limitedData = data.slice(0, MAX_ROWS);
    
    if (data.length > MAX_ROWS) {
      console.warn(`⚠️ Large dataset detected (${data.length} rows). Limiting to first ${MAX_ROWS} rows for editing.`);
      showNotification(
        `Large dataset detected (${data.length} rows). Showing first ${MAX_ROWS} rows for editing. All data will be used when creating charts.`,
        "info"
      );
    }
    
    setUploadedData({ headers, data: limitedData });
    setShowSpreadsheet(true);
    
    // Analyze data and suggest chart types (use setTimeout to prevent blocking)
    setTimeout(() => {
      const suggestions = suggestChartTypes(headers, limitedData);
      setChartSuggestions(suggestions);
    }, 0);
    
      // Auto-select first column as label, first numeric column as value
      setSelectedLabelColumn(0);
      const firstNumericCol = headers.findIndex((_, i) => {
        const sample = limitedData.slice(0, Math.min(5, limitedData.length)).map(row => row[i]);
        return sample.some(val => !isNaN(Number(val)) && val !== "");
      });
      setSelectedValueColumns(firstNumericCol >= 0 ? [firstNumericCol] : []);
      
      // Initialize selected series and categories
      if (firstNumericCol >= 0) {
        setSelectedSeries([headers[firstNumericCol]]);
      }
      // Get unique categories from first column
      const uniqueCategories = Array.from(new Set(limitedData.map(row => String(row[0] || "")))).filter(v => v !== "");
      setSelectedCategories(uniqueCategories);
  };

  const handleDataError = (error: string) => {
    showNotification(error, "error");
  };

  const handleSpreadsheetDataChange = (data: any[][]) => {
    if (uploadedData) {
      setUploadedData({ ...uploadedData, data });
      // Re-analyze suggestions with debouncing to prevent excessive calculations
      // Use setTimeout to prevent blocking
      setTimeout(() => {
        const suggestions = suggestChartTypes(uploadedData.headers, data);
        setChartSuggestions(suggestions);
      }, 100);
    }
  };

  const handleCreateChartFromData = async () => {
    if (!uploadedData || selectedValueColumns.length === 0) {
      showNotification("Please select at least one value column.", "error");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Limit data processing to prevent browser freeze
      // Process in chunks using setTimeout to allow browser to breathe
      const MAX_DATA_POINTS = 500; // Limit to 500 data points for performance
      
      // Filter data by selected categories if any
      let dataToProcess = uploadedData.data;
      if (selectedCategories.length > 0) {
        dataToProcess = uploadedData.data.filter((row) => 
          selectedCategories.includes(String(row[selectedLabelColumn] || ""))
        );
      }
      dataToProcess = dataToProcess.slice(0, MAX_DATA_POINTS);
      
      if (uploadedData.data.length > MAX_DATA_POINTS) {
        console.warn(`⚠️ Large dataset detected (${uploadedData.data.length} rows). Limiting to first ${MAX_DATA_POINTS} rows for performance.`);
      }

      // Process data asynchronously to prevent blocking
      const chartData = await new Promise<Array<{ label: string; value: number; [key: string]: any }>>((resolve) => {
        // Use setTimeout to break up the work and prevent blocking
        setTimeout(() => {
          const result = convertToChartData(
            uploadedData.headers,
            dataToProcess,
            selectedLabelColumn,
            selectedValueColumns
          );
          resolve(result);
        }, 0);
      });

      if (chartData.length === 0) {
        showNotification("No valid data to create chart from.", "error");
        setIsProcessing(false);
        return;
      }

      // Use first suggestion or default to bar
      const suggestedType = chartSuggestions[0]?.type || "bar";

      // Get selected series names
      const seriesNames = selectedValueColumns.map(i => uploadedData.headers[i]);

      const newChart: ChartData = {
        id: `chart-${Date.now()}`,
        title: `Chart from ${uploadedData.headers[selectedLabelColumn]}`,
        type: suggestedType,
        data: chartData,
        dataKeys: selectedValueColumns.length > 1 ? seriesNames : undefined,
        theory: event.theory, // Auto-detect theory from event
      };

      // Update selected series for DataSelector
      setSelectedSeries(seriesNames);

      // Use setTimeout to ensure state updates don't block
      setTimeout(() => {
        setPreviewChart(newChart);
        setShowPreview(true);
        setIsProcessing(false);
      }, 0);
    } catch (error) {
      console.error("Error creating chart:", error);
      alert(`Error creating chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const handleSavePreviewChart = () => {
    if (!previewChart) return;

    // Check if this is an update to existing chart or new chart
    const existingChartIndex = charts.findIndex((c) => c.id === previewChart.id);
    
    if (existingChartIndex >= 0) {
      // Update existing chart
      const updatedCharts = [...charts];
      updatedCharts[existingChartIndex] = previewChart;
      setEvent({
        ...event,
        stats: {
          ...event.stats,
          charts: updatedCharts,
        },
      });
    } else {
      // Add new chart
      setEvent({
        ...event,
        stats: {
          ...event.stats,
          charts: [...charts, previewChart],
        },
      });
    }

    // Reset state
    setPreviewChart(null);
    setShowPreview(false);
    setUploadedData(null);
    setShowSpreadsheet(false);
    setSelectedLabelColumn(0);
    setSelectedValueColumns([]);
    setChartSuggestions([]);
    setSelectedSeries([]);
    setSelectedCategories([]);
  };

  const handleUpdatePreviewChart = (field: keyof ChartData, value: any) => {
    if (!previewChart) return;
    setPreviewChart({ ...previewChart, [field]: value });
  };

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[9999] max-w-md">
          <div
            className={`p-4 rounded-lg shadow-xl border backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
              notification.type === "success"
                ? "bg-green-600/90 border-green-500 text-white"
                : notification.type === "error"
                ? "bg-red-600/90 border-red-500 text-white"
                : "bg-blue-600/90 border-blue-500 text-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {notification.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                {notification.type === "info" && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                {notification.type === "error" && <X className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <p className="text-sm font-medium flex-1">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Statistics & Charts</h2>
          <p className="text-sm text-gray-400">
            Upload raw data files (Excel/CSV) or manually create charts to display statistical data for this event.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowSpreadsheet(false);
              setUploadedData(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Upload size={16} />
            Upload Data
          </button>
          <button
            onClick={handleAddChart}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Chart Manually
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {!showSpreadsheet && (
        <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6">
          <DataUploader onDataLoaded={handleDataLoaded} onError={handleDataError} />
        </div>
      )}

      {/* Spreadsheet Editor Section */}
      {showSpreadsheet && uploadedData && (
        <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Data Editor</h3>
            <button
              onClick={() => {
                setShowSpreadsheet(false);
                setUploadedData(null);
                setChartSuggestions([]);
              }}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
            >
              Close Editor
            </button>
          </div>

          <ExcelLikeSpreadsheet
            headers={uploadedData.headers}
            initialData={uploadedData.data}
            onDataChange={handleSpreadsheetDataChange}
            onSave={() => {}}
          />

          {/* Column Selection for Chart Creation */}
          <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold text-white">Configure Chart</h4>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Label Column (X-axis / Categories)
              </label>
              <select
                value={selectedLabelColumn}
                onChange={(e) => setSelectedLabelColumn(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
              >
                {uploadedData.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Value Columns (Y-axis / Values) - Select one or more
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedData.headers.map((header, index) => {
                  const isSelected = selectedValueColumns.includes(index);
                  return (
                    <label
                      key={index}
                      className="flex items-center gap-2 p-2 bg-slate-800/50 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedValueColumns([...selectedValueColumns, index]);
                          } else {
                            setSelectedValueColumns(selectedValueColumns.filter(i => i !== index));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-300">
                        {header || `Column ${index + 1}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Chart Type Suggestions */}
            {chartSuggestions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Suggested Chart Types
                </label>
                <div className="space-y-2">
                  {chartSuggestions.slice(0, 3).map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/50 rounded border border-slate-600/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {CHART_TYPES.find(t => t.value === suggestion.type)?.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateChartFromData}
              disabled={selectedValueColumns.length === 0 || isProcessing}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Preview Chart
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chart Preview Modal - Fullscreen */}
      {showPreview && previewChart && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50">
            <h3 className="text-2xl font-bold text-white">
              {charts.find((c) => c.id === previewChart.id) ? "Edit Chart" : "Chart Preview & Editor"}
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Content - Fullscreen Layout */}
          <div className="flex-1 overflow-hidden flex relative">
            {/* Center - Chart Preview (expands when sidebar is hidden) */}
            <div className={`flex-1 overflow-y-auto p-6 bg-slate-900/50 transition-all ${
              !rightSidebarOpen ? 'px-12' : ''
            }`}>
              <ChartPreview
                chart={previewChart}
                onChartUpdate={(updatedChart) => {
                  setPreviewChart(updatedChart);
                }}
                isEditable={true}
              />
            </div>

            {/* Right Sidebar Toggle Button */}
            {!rightSidebarOpen && (
              <button
                onClick={() => setRightSidebarOpen(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-l-lg p-2.5 text-white transition-all flex items-center gap-1.5 shadow-lg"
                title="Show Settings"
              >
                <ChevronLeft size={16} />
                <Settings size={18} />
              </button>
            )}

            {/* Right Sidebar - Data Selector & Settings */}
            {rightSidebarOpen && (
              <div className="w-80 border-l border-slate-700 bg-slate-800/30 overflow-y-auto p-4 space-y-4 relative">
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="absolute top-2 left-2 z-10 p-1.5 bg-slate-700/80 hover:bg-slate-700 rounded text-white transition-all"
                  title="Hide Settings"
                >
                  <ChevronRight size={16} />
                </button>
              {/* Data Selector */}
              {uploadedData && (
                <DataSelector
                  headers={uploadedData.headers}
                  data={uploadedData.data}
                  selectedSeries={selectedSeries}
                  selectedCategories={selectedCategories}
                  onSeriesChange={setSelectedSeries}
                  onCategoriesChange={setSelectedCategories}
                  onApply={() => {
                    if (selectedValueColumns.length > 0) {
                      handleCreateChartFromData();
                    }
                  }}
                  onSelectData={() => {
                    setShowPreview(false);
                    setShowSpreadsheet(true);
                  }}
                />
              )}

              {/* Chart Settings */}
              <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-white mb-4">Chart Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Chart Title
                    </label>
                    <input
                      type="text"
                      value={previewChart.title}
                      onChange={(e) => handleUpdatePreviewChart("title", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Chart Type
                    </label>
                    <select
                      value={previewChart.type}
                      onChange={(e) => handleUpdatePreviewChart("type", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    >
                      {CHART_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {event.theory ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Theory (for color theming)
                      </label>
                      <div className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-700/50 rounded-lg text-gray-400 flex items-center gap-2">
                        <span>{THEORIES.find(t => t.id === event.theory)?.name || event.theory}</span>
                        <span className="text-xs">(Auto-detected from event)</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Theory (for color theming)
                      </label>
                      <select
                        value={previewChart.theory || ""}
                        onChange={(e) => handleUpdatePreviewChart("theory", e.target.value || undefined)}
                        className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      >
                        <option value="">None (default colors)</option>
                        {THEORIES.map((theory) => (
                          <option key={theory.id} value={theory.id}>
                            {theory.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Chart Styles - Show 3 recommended styles based on theory */}
                  {previewChart && (() => {
                    const theoryColor = previewChart.theory
                      ? getTheoryColor(previewChart.theory as TheoryType)
                      : undefined;
                    const recommendedStyles = getTheoryBasedStyles(theoryColor);
                    const seriesCount = previewChart.dataKeys?.length || 1;

                    return (
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-2">
                          Chart Style
                        </label>
                        <div className="space-y-2">
                          {recommendedStyles.map((style) => {
                            const isSelected = selectedStyleId === style.id;
                            const styleColors = style.colors.slice(0, seriesCount);
                            const formatting = {
                              showGridlines: style.id === "style1" || style.id === "style3",
                              legendPosition: "bottom" as const,
                              showDataLabels: style.id === "style3",
                              backgroundColor: style.id === "style3" ? "#1e293b" : undefined,
                            };

                            return (
                              <button
                                key={style.id}
                                type="button"
                                className={`w-full text-left rounded-lg p-3 border transition-all ${
                                  isSelected
                                    ? "border-green-500 ring-2 ring-green-500/50 bg-green-500/10"
                                    : "border-slate-700/50 hover:border-slate-600 bg-slate-800/30"
                                }`}
                                onClick={() => {
                                  setSelectedStyleId(style.id);
                                  // Apply style colors
                                  handleUpdatePreviewChart("customColors", styleColors);
                                  
                                  // Apply style formatting
                                  handleUpdatePreviewChart("formatting", {
                                    ...previewChart.formatting,
                                    ...formatting,
                                  });
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300 font-medium">{style.name}</span>
                                  <span className="text-xs text-gray-500">{style.description}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      X-Axis Label
                    </label>
                    <input
                      type="text"
                      value={previewChart.xAxisLabel || ""}
                      onChange={(e) => handleUpdatePreviewChart("xAxisLabel", e.target.value || undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      placeholder="e.g., Countries, Years"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Y-Axis Label
                    </label>
                    <input
                      type="text"
                      value={previewChart.yAxisLabel || ""}
                      onChange={(e) => handleUpdatePreviewChart("yAxisLabel", e.target.value || undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      placeholder="e.g., Values, Percentage"
                    />
                  </div>

                  {/* Formatting Options */}
                  <div className="border-t border-slate-700 pt-4">
                    <h5 className="text-xs font-semibold text-gray-300 mb-3">Formatting</h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Legend Position
                        </label>
                        <select
                          value={previewChart.formatting?.legendPosition || "top"}
                          onChange={(e) => handleUpdatePreviewChart("formatting", {
                            ...previewChart.formatting,
                            legendPosition: e.target.value as "top" | "bottom" | "left" | "right" | "none",
                          })}
                          className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                        >
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="none">None</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
                          <input
                            type="checkbox"
                            checked={previewChart.formatting?.showGridlines !== false}
                            onChange={(e) => handleUpdatePreviewChart("formatting", {
                              ...previewChart.formatting,
                              showGridlines: e.target.checked,
                            })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          Show Gridlines
                          </label>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
                          <input
                            type="checkbox"
                            checked={previewChart.formatting?.showDataLabels === true}
                            onChange={(e) => handleUpdatePreviewChart("formatting", {
                              ...previewChart.formatting,
                              showDataLabels: e.target.checked,
                            })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          Show Data Labels
                          </label>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-700 p-4 bg-slate-900/50 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePreviewChart}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {charts.find((c) => c.id === previewChart.id) ? "Update Chart" : "Add to Event"}
            </button>
          </div>
        </div>
      )}

      {charts.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-600 rounded-lg">
          <p className="text-gray-400 mb-4">No charts added yet.</p>
          <button
            onClick={handleAddChart}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Add Your First Chart
          </button>
        </div>
      )}

      <div className="space-y-4">
        {charts.map((chart) => (
          <div
            key={chart.id}
            className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4"
          >
            {editingChartId === chart.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Editing Chart</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveChart}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Chart Title
                    </label>
                    <input
                      type="text"
                      value={editingChart?.title || ""}
                      onChange={(e) => handleUpdateChartField("title", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Chart Type
                    </label>
                    <select
                      value={editingChart?.type || "bar"}
                      onChange={(e) => handleUpdateChartField("type", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    >
                      {CHART_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Theory (for color theming)
                    </label>
                    <select
                      value={editingChart?.theory || ""}
                      onChange={(e) => handleUpdateChartField("theory", e.target.value || undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                    >
                      <option value="">None (default colors)</option>
                      {THEORIES.map((theory) => (
                        <option key={theory.id} value={theory.id}>
                          {theory.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={editingChart?.description || ""}
                      onChange={(e) => handleUpdateChartField("description", e.target.value || undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      placeholder="Chart description..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      X-Axis Label (optional)
                    </label>
                    <input
                      type="text"
                      value={editingChart?.xAxisLabel || ""}
                      onChange={(e) => handleUpdateChartField("xAxisLabel", e.target.value || undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      placeholder="e.g., Countries, Years, Categories"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Y-Axis Label (optional)
                    </label>
                    <input
                      type="text"
                      value={editingChart?.yAxisLabel || ""}
                      onChange={(e) => handleUpdateChartField("yAxisLabel", e.target.value || undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      placeholder="e.g., Values, Percentage, Count"
                    />
                  </div>

                  {/* Custom Colors */}
                  <div className="md:col-span-2">
                    <ColorPalettePicker
                      colors={editingChart?.customColors || []}
                      onChange={(colors) => handleUpdateChartField("customColors", colors.length > 0 ? colors : undefined)}
                      maxColors={editingChart?.dataKeys?.length || 1}
                    />
                  </div>
                </div>

                {/* Excel-like Formatting Options */}
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings size={16} className="text-gray-400" />
                    <h4 className="text-sm font-semibold text-white">Chart Formatting (Excel-like)</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gridlines */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
                        <input
                          type="checkbox"
                          checked={editingChart?.formatting?.showGridlines !== false}
                          onChange={(e) => handleUpdateChartField("formatting", {
                            ...editingChart?.formatting,
                            showGridlines: e.target.checked,
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        Show Gridlines
                      </label>
                    </div>

                    {/* Data Labels */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
                        <input
                          type="checkbox"
                          checked={editingChart?.formatting?.showDataLabels === true}
                          onChange={(e) => handleUpdateChartField("formatting", {
                            ...editingChart?.formatting,
                            showDataLabels: e.target.checked,
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        Show Data Labels
                      </label>
                    </div>

                    {/* Legend Position */}
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Legend Position
                      </label>
                      <select
                        value={editingChart?.formatting?.legendPosition || "top"}
                        onChange={(e) => handleUpdateChartField("formatting", {
                          ...editingChart?.formatting,
                          legendPosition: e.target.value as "top" | "bottom" | "left" | "right" | "none",
                        })}
                        className="w-full px-3 py-2 text-sm border border-slate-600/50 bg-slate-800 rounded-lg text-white"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="none">None</option>
                      </select>
                    </div>

                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-300">
                      Data Points
                    </label>
                    <button
                      onClick={handleAddDataPoint}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Plus size={12} />
                      Add Point
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {editingChart?.data?.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-slate-700/50 p-2 rounded"
                      >
                        <input
                          type="text"
                          value={point.label}
                          onChange={(e) => handleUpdateDataPoint(index, "label", e.target.value)}
                          placeholder="Label"
                          className="flex-1 px-2 py-1 text-sm border border-slate-600/50 bg-slate-800 rounded text-white"
                        />
                        <input
                          type="number"
                          value={point.value}
                          onChange={(e) => handleUpdateDataPoint(index, "value", parseFloat(e.target.value) || 0)}
                          placeholder="Value"
                          className="w-24 px-2 py-1 text-sm border border-slate-600/50 bg-slate-800 rounded text-white"
                        />
                        <button
                          onClick={() => handleDeleteDataPoint(index)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{chart.title}</h3>
                    <p className="text-sm text-gray-400">
                      {CHART_TYPES.find((t) => t.value === chart.type)?.label} • {chart.data.length} data points
                      {chart.theory && ` • ${THEORIES.find((t) => t.id === chart.theory)?.name}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPreviewChart(chart);
                        setShowPreview(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                    >
                      <Eye size={14} />
                      Preview & Edit
                    </button>
                    <button
                      onClick={() => handleEditChart(chart)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteChart(chart.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
                {/* Quick Preview */}
                <div className="bg-slate-900/50 rounded p-4">
                  <ChartPreview chart={chart} isEditable={false} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
