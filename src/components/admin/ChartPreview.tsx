"use client";

import React from "react";
import { ChartData } from "@/data/events";
import UniversalChart from "@/components/sidebar/UniversalChart";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { getChartColors } from "@/lib/chart-color-utils";

interface ChartPreviewProps {
  chart: ChartData;
}

export function ChartPreview({ chart }: ChartPreviewProps) {
  // Get theory color using the same function as country highlighting
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);
  
  const theoryColor = chart.theory 
    ? getTheoryColor(chart.theory as TheoryType)
    : undefined;
  
  // Determine number of data series (dataKeys or default to 1)
  const seriesCount = chart.dataKeys?.length || 1;
  
  // Generate distinct color variations from theory color
  // This maintains theory identity while ensuring readability
  const colors = theoryColor
    ? getChartColors(theoryColor, seriesCount)
    : undefined;

  return (
    <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-white mb-2">{chart.title}</h4>
      {chart.description && (
        <p className="text-xs text-gray-400 mb-4">{chart.description}</p>
      )}
      <div className="bg-slate-900/50 rounded p-4">
        <UniversalChart
          title=""
          type={chart.type}
          data={chart.data}
          dataKeys={chart.dataKeys}
          colors={colors}
          height={300}
          xAxisLabel={chart.xAxisLabel}
          yAxisLabel={chart.yAxisLabel}
        />
      </div>
    </div>
  );
}
