"use client";

import React from "react";
import { ChartData } from "@/data/events";
import UniversalChart from "@/components/sidebar/UniversalChart";
import { THEORY_COLORS } from "@/lib/theoryTokens";

interface ChartPreviewProps {
  chart: ChartData;
}

export function ChartPreview({ chart }: ChartPreviewProps) {
  // Get theory color if chart is associated with a theory
  const getTheoryColorValue = (theory: string): string | undefined => {
    return THEORY_COLORS[theory as keyof typeof THEORY_COLORS];
  };

  const theoryColor = chart.theory ? getTheoryColorValue(chart.theory) : undefined;
  const colors = theoryColor
    ? [theoryColor, theoryColor + "CC", theoryColor + "99", theoryColor + "66"]
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
