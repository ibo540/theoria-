
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { BarChart2, ChevronDown, ChevronUp, Activity, PieChart as PieIcon, X, Maximize2 } from "lucide-react";
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

// Calm, muted color palette for charts
const THEME_COLORS = [
    "#8b7355", // Muted brown
    "#6b8e9f", // Soft blue-gray
    "#7a8b7a", // Muted green-gray
    "#9b8b7a", // Warm gray
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
    const [isAnimating, setIsAnimating] = useState(false); // Disable animations to keep labels visible
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const chartRef = React.useRef<HTMLDivElement>(null);

    // Ensure component is mounted before using portal
    useEffect(() => {
        setMounted(true);
    }, []);

    const renderChart = (fullscreenHeight?: number) => {
        const chartHeight = fullscreenHeight || height;
        switch (type) {
            case "line":
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="label"
                                stroke="#ccc"
                                fontSize={12}
                                tick={{ fill: "#ffe4be", fontSize: 11, fontWeight: 500 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            >
                                {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} style={{ fill: "#ffe4be", fontSize: 12, fontWeight: 600 }} />}
                            </XAxis>
                            <YAxis
                                stroke="#ccc"
                                fontSize={12}
                                tick={{ fill: "#ffe4be", fontSize: 11, fontWeight: 500 }}
                            >
                                {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: "#ffe4be", fontSize: 12, fontWeight: 600, textAnchor: "middle" }} />}
                            </YAxis>
                            <Tooltip 
                                contentStyle={CUSTOM_TOOLTIP_STYLE} 
                                itemStyle={{ color: "#fff" }}
                                cursor={{ stroke: "#ffe4be", strokeWidth: 1, strokeDasharray: "3 3" }}
                            />
                            <Legend 
                                wrapperStyle={{ paddingTop: "10px", fontSize: "11px", textTransform: "uppercase" }} 
                                iconType="line"
                                formatter={(value) => <span style={{ color: "#ffe4be", fontWeight: 500 }}>{value}</span>}
                            />
                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ fill: "#000", stroke: colors[index % colors.length], strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: colors[index % colors.length] }}
                                    animationDuration={0}
                                    animationBegin={0}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case "area":
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                                dataKey="label" 
                                stroke="#ccc" 
                                fontSize={12}
                                tick={{ fill: "#ffe4be", fontSize: 11, fontWeight: 500 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            >
                                {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} style={{ fill: "#ffe4be", fontSize: 12, fontWeight: 600 }} />}
                            </XAxis>
                            <YAxis 
                                stroke="#ccc" 
                                fontSize={12}
                                tick={{ fill: "#ffe4be", fontSize: 11, fontWeight: 500 }}
                            >
                                {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: "#ffe4be", fontSize: 12, fontWeight: 600, textAnchor: "middle" }} />}
                            </YAxis>
                            <Tooltip 
                                contentStyle={CUSTOM_TOOLTIP_STYLE} 
                                itemStyle={{ color: "#fff" }}
                                cursor={{ stroke: "#ffe4be", strokeWidth: 1, strokeDasharray: "3 3" }}
                            />
                            <Legend 
                                wrapperStyle={{ paddingTop: "10px", fontSize: "11px", textTransform: "uppercase" }} 
                                iconType="line"
                                formatter={(value) => <span style={{ color: "#ffe4be", fontWeight: 500 }}>{value}</span>}
                            />
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stackId="1" // Stacked by default for Area
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.4}
                                    animationDuration={0}
                                    animationBegin={0}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case "radar":
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <RadarChart outerRadius="70%" data={data}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="label" tick={{ fill: "#ffe4be", fontSize: 12, fontWeight: 500 }} />
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
                            <Legend 
                                wrapperStyle={{ fontSize: "11px", textTransform: "uppercase" }} 
                                formatter={(value) => <span style={{ color: "#ffe4be", fontWeight: 500 }}>{value}</span>}
                            />
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} itemStyle={{ color: "#fff" }} />
                        </RadarChart>
                    </ResponsiveContainer>
                );

            case "pie":
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <RechartsPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                                labelLine={{ stroke: "#ffe4be", strokeWidth: 1 }}
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
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                            <XAxis 
                                type="number" 
                                stroke="#ccc" 
                                fontSize={12}
                                tick={{ fill: "#ffe4be", fontSize: 11, fontWeight: 500 }}
                                hide={!xAxisLabel}
                            >
                                {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} style={{ fill: "#ffe4be", fontSize: 12, fontWeight: 600 }} />}
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
                                    animationDuration={0}
                                    animationBegin={0}
                                >
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
                            <div className="flex items-center justify-between mb-4">
                                <h4 className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80`}>
                                    {title}
                                </h4>
                                <button
                                    onClick={() => setIsFullscreen(true)}
                                    className="p-2 text-primary-gold/60 hover:text-primary-gold/90 transition-colors rounded hover:bg-neutral-800/50"
                                    title="Expand to fullscreen"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>

                            <div 
                                className="w-full cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
                            >
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

            {/* Fullscreen Modal - Rendered via Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isFullscreen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="fixed inset-0 bg-black/90 z-[9999] backdrop-blur-sm"
                                onClick={() => setIsFullscreen(false)}
                            />

                            {/* Fullscreen Chart Container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ 
                                    duration: 0.4,
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                                className="fixed inset-4 md:inset-8 lg:inset-16 z-[10000] bg-black/95 border border-primary-gold/30 rounded-lg overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                                style={{ 
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    margin: '1rem',
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-primary-gold/20 bg-neutral-900/50">
                                    <div className="flex-1">
                                        <h2 className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/90 text-xl mb-2`}>
                                            {title}
                                        </h2>
                                        {description && (
                                            <p className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/70 italic`}>
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsFullscreen(false)}
                                        className="p-2 text-primary-gold/60 hover:text-primary-gold/90 transition-colors rounded hover:bg-neutral-800/50 ml-4"
                                        title="Close fullscreen"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Chart Content */}
                                <div className="p-6 h-[calc(100%-120px)] overflow-auto">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="w-full h-full"
                                    >
                                        {renderChart(Math.max(600, typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600))}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
