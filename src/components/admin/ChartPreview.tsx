"use client";

import React, { useMemo } from "react";
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
  
  // Memoize color calculation to prevent unnecessary recalculations
  const { theoryColor, colors } = useMemo(() => {
    const theory = chart.theory 
      ? getTheoryColor(chart.theory as TheoryType)
      : undefined;
    
    // Determine number of data series (dataKeys or default to 1)
    const seriesCount = chart.dataKeys?.length || 1;
    
    // Generate distinct color variations from theory color
    // This maintains theory identity while ensuring readability
    const chartColors = theory
      ? getChartColors(theory, seriesCount)
      : undefined;
    
    return { theoryColor: theory, colors: chartColors };
  }, [chart.theory, chart.dataKeys, getTheoryColor]);
  
  // Limit data points for preview to prevent performance issues
  const limitedData = useMemo(() => {
    const MAX_PREVIEW_POINTS = 200;
    if (chart.data.length <= MAX_PREVIEW_POINTS) {
      return chart.data;
    }
    // Sample data evenly for preview
    const step = Math.ceil(chart.data.length / MAX_PREVIEW_POINTS);
    return chart.data.filter((_, index) => index % step === 0);
  }, [chart.data]);

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
          data={limitedData}
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
