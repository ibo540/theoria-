/**
 * Analyze data and suggest appropriate chart types
 */

export type ChartType = "bar" | "line" | "area" | "radar" | "pie";

interface ChartSuggestion {
  type: ChartType;
  confidence: number;
  reason: string;
}

/**
 * Analyze data structure and suggest chart types
 */
export function suggestChartTypes(
  headers: string[],
  data: any[][]
): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];

  if (data.length === 0 || headers.length === 0) {
    return [
      {
        type: "bar",
        confidence: 0.5,
        reason: "Default suggestion - add data to get better recommendations",
      },
    ];
  }

  // Count numeric columns
  const numericColumns: number[] = [];
  headers.forEach((header, colIndex) => {
    const sampleValues = data
      .slice(0, Math.min(10, data.length))
      .map((row) => row[colIndex])
      .filter((val) => val !== null && val !== undefined && val !== "");
    
    const numericCount = sampleValues.filter(
      (val) => !isNaN(Number(val)) && val !== ""
    ).length;
    
    if (numericCount > sampleValues.length * 0.8) {
      numericColumns.push(colIndex);
    }
  });

  // Count categorical columns (non-numeric)
  const categoricalColumns: number[] = [];
  headers.forEach((header, colIndex) => {
    if (!numericColumns.includes(colIndex)) {
      categoricalColumns.push(colIndex);
    }
  });

  // Suggestion 1: Pie Chart
  // Good for: Single numeric column with categorical labels
  if (numericColumns.length === 1 && categoricalColumns.length >= 1) {
    suggestions.push({
      type: "pie",
      confidence: 0.9,
      reason: "Perfect for showing proportions of a single metric across categories",
    });
  }

  // Suggestion 2: Bar Chart
  // Good for: Comparing values across categories
  if (numericColumns.length >= 1 && categoricalColumns.length >= 1) {
    suggestions.push({
      type: "bar",
      confidence: 0.85,
      reason: "Great for comparing values across different categories",
    });
  }

  // Suggestion 3: Line Chart
  // Good for: Time series or sequential data
  const hasTimeLikeColumn = headers.some((header) => {
    const lowerHeader = header.toLowerCase();
    return (
      lowerHeader.includes("date") ||
      lowerHeader.includes("time") ||
      lowerHeader.includes("year") ||
      lowerHeader.includes("month") ||
      lowerHeader.includes("day")
    );
  });

  if (hasTimeLikeColumn && numericColumns.length >= 1) {
    suggestions.push({
      type: "line",
      confidence: 0.9,
      reason: "Ideal for showing trends over time or sequential data",
    });
  }

  // Suggestion 4: Area Chart
  // Good for: Cumulative data or time series with multiple series
  if (hasTimeLikeColumn && numericColumns.length > 1) {
    suggestions.push({
      type: "area",
      confidence: 0.8,
      reason: "Good for showing cumulative values or multiple series over time",
    });
  }

  // Suggestion 5: Radar Chart
  // Good for: Multiple metrics for comparison
  if (numericColumns.length >= 3 && categoricalColumns.length >= 1) {
    suggestions.push({
      type: "radar",
      confidence: 0.75,
      reason: "Excellent for comparing multiple metrics across different categories",
    });
  }

  // Default fallback
  if (suggestions.length === 0) {
    suggestions.push({
      type: "bar",
      confidence: 0.6,
      reason: "General purpose chart suitable for most data types",
    });
  }

  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Convert spreadsheet data to chart data format
 */
export function convertToChartData(
  headers: string[],
  data: any[][],
  labelColumnIndex: number,
  valueColumnIndices: number[]
): Array<{ label: string; value: number; [key: string]: any }> {
  const chartData: Array<{ label: string; value: number; [key: string]: any }> = [];
  
  // Limit data points to prevent performance issues
  const MAX_DATA_POINTS = 500;
  const dataToProcess = data.slice(0, MAX_DATA_POINTS);

  // Process in batches to prevent blocking
  for (let i = 0; i < dataToProcess.length; i++) {
    const row = dataToProcess[i];
    const label = String(row[labelColumnIndex] ?? "");
    
    if (!label) continue; // Skip rows without labels
    
    const dataPoint: { label: string; value: number; [key: string]: any } = {
      label,
      value: 0,
    };

    // Add all value columns
    valueColumnIndices.forEach((colIndex) => {
      const header = headers[colIndex];
      const value = parseFloat(row[colIndex]) || 0;
      
      if (colIndex === valueColumnIndices[0]) {
        // First value column is the primary "value"
        dataPoint.value = value;
      } else {
        // Additional columns become extra keys for multi-series charts
        dataPoint[header] = value;
      }
    });

    chartData.push(dataPoint);
  }

  if (data.length > MAX_DATA_POINTS) {
    console.warn(`⚠️ Data truncated from ${data.length} to ${MAX_DATA_POINTS} points for chart rendering.`);
  }

  return chartData;
}
