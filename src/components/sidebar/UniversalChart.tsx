
"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    PieChart as RechartsPieChart,
    Pie,
    Label,
    LabelList,
} from "recharts";
import { BarChart2, ChevronDown, ChevronUp, Activity, PieChart as PieIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SIDEBAR_TYPOGRAPHY } from "./typography";

export type ChartType = "bar" | "line" | "area" | "radar" | "pie";

export interface DataPoint {
    label: string;
    value: number;
    [key: string]: any; // Allow extra keys for multi-line charts
}

interface UniversalChartProps {
    title: string;
    type: ChartType;
    data: DataPoint[];
    description?: string;
    dataKeys?: string[]; // Keys to plot (default: ['value'])
    colors?: string[];   // Colors for each key
    height?: number;
    xAxisLabel?: string; // Custom X-axis label
    yAxisLabel?: string; // Custom Y-axis label
}

const THEME_COLORS = [
    "#d97706", // amber-600 (Primary)
    "#b45309", // amber-700
    "#92400e", // amber-800
    "#78350f", // amber-900
];

const CUSTOM_TOOLTIP_STYLE = {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#f59e0b",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
};

export default function UniversalChart({
    title,
    type,
    data,
    description,
    dataKeys = ["value"],
    colors = THEME_COLORS,
    height = 250,
    xAxisLabel,
    yAxisLabel,
}: UniversalChartProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);

    const renderChart = () => {
        switch (type) {
            case "line":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="label"
                                stroke="#666"
                                fontSize={10}
                                tick={{ fill: "#888" }}
                            >
                                {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} style={{ fill: "#888", fontSize: 11 }} />}
                            </XAxis>
                            <YAxis
                                stroke="#666"
                                fontSize={10}
                                tick={{ fill: "#888" }}
                            >
                                {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: "#888", fontSize: 11, textAnchor: "middle" }} />}
                            </YAxis>
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} />
                            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px", textTransform: "uppercase" }} />
                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ fill: "#000", stroke: colors[index % colors.length], strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: colors[index % colors.length] }}
                                    animationDuration={isAnimating ? 1000 : 0}
                                    animationBegin={index * 100}
                                >
                                    <LabelList 
                                        dataKey={key} 
                                        position="top" 
                                        style={{ fill: colors[index % colors.length], fontSize: 10, fontWeight: "bold" }}
                                    />
                                </Line>
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case "area":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                                dataKey="label" 
                                stroke="#666" 
                                fontSize={10}
                            >
                                {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} style={{ fill: "#888", fontSize: 11 }} />}
                            </XAxis>
                            <YAxis 
                                stroke="#666" 
                                fontSize={10}
                            >
                                {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: "#888", fontSize: 11, textAnchor: "middle" }} />}
                            </YAxis>
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} />
                            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px", textTransform: "uppercase" }} />
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stackId="1" // Stacked by default for Area
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.6}
                                    animationDuration={isAnimating ? 1000 : 0}
                                    animationBegin={index * 100}
                                >
                                    <LabelList 
                                        dataKey={key} 
                                        position="top" 
                                        style={{ fill: colors[index % colors.length], fontSize: 10, fontWeight: "bold" }}
                                    />
                                </Area>
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case "radar":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <RadarChart outerRadius="70%" data={data}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="label" tick={{ fill: "#888", fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#444" tick={false} />
                            {dataKeys.map((key, index) => (
                                <Radar
                                    key={key}
                                    name={key}
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.4}
                                />
                            ))}
                            <Legend wrapperStyle={{ fontSize: "10px", textTransform: "uppercase" }} />
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} />
                        </RadarChart>
                    </ResponsiveContainer>
                );

            case "pie":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <RechartsPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                                animationDuration={isAnimating ? 1000 : 0}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                );

            case "bar":
            default:
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                            <XAxis 
                                type="number" 
                                stroke="#666" 
                                fontSize={10} 
                                hide={!xAxisLabel}
                            >
                                {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} style={{ fill: "#888", fontSize: 11 }} />}
                            </XAxis>
                            <YAxis
                                type="category"
                                dataKey="label"
                                stroke="#666"
                                fontSize={10}
                                width={80}
                                tick={{ fill: "#ccc" }}
                            >
                                {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: "#888", fontSize: 11, textAnchor: "middle" }} />}
                            </YAxis>
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    barSize={12}
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={isAnimating ? 1000 : 0}
                                    animationBegin={index * 100}
                                >
                                    {/* Always show values on bars */}
                                    <LabelList 
                                        dataKey={key} 
                                        position="right" 
                                        style={{ fill: colors[index % colors.length], fontSize: 10, fontWeight: "bold" }}
                                    />
                                    {/* Optional: Add cell coloring if single series */}
                                    {dataKeys.length === 1 && data.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color || colors[idx % colors.length]} />
                                    ))}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    const getIcon = () => {
        switch (type) {
            case "line": return <Activity size={16} />;
            case "radar":
            case "pie": return <PieIcon size={16} />;
            default: return <BarChart2 size={16} />;
        }
    };

    return (
        <div className="mt-6 border border-neutral-800 bg-black/40 rounded-lg overflow-hidden backdrop-blur-sm">
            {/* Toggle Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-neutral-900/50 hover:bg-neutral-900 transition-colors border-b border-neutral-800/50"
            >
                <div className="flex items-center gap-2 text-primary-gold/90 font-medium text-sm uppercase tracking-wide">
                    {getIcon()}
                    <span>{isOpen ? "Hide Visuals" : "Visual Analysis"}</span>
                </div>
                {isOpen ? (
                    <ChevronUp size={16} className="text-primary-gold/60" />
                ) : (
                    <ChevronDown size={16} className="text-primary-gold/60" />
                )}
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4">
                            <h4 className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-4`}>
                                {title}
                            </h4>

                            <div className="w-full">
                                {renderChart()}
                            </div>

                            {description && (
                                <p className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/60 italic mt-4 border-t border-neutral-800 pt-3`}>
                                    {description}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
