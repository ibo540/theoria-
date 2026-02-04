"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { EventData, ChartData } from "@/data/events";

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

export function StatisticsTab({ event, setEvent }: StatisticsTabProps) {
  const charts = event.stats?.charts || [];
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [editingChart, setEditingChart] = useState<Partial<ChartData> | null>(null);

  const handleAddChart = () => {
    const newChart: ChartData = {
      id: `chart-${Date.now()}`,
      title: "New Chart",
      type: "bar",
      data: [{ label: "Sample", value: 0 }],
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Statistics & Charts</h2>
          <p className="text-sm text-gray-400">
            Add charts and visualizations to display statistical data for this event.
          </p>
        </div>
        <button
          onClick={handleAddChart}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Chart
        </button>
      </div>

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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
