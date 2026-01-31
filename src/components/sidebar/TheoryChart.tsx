
"use client";

import React, { useState } from "react";
import { BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SIDEBAR_TYPOGRAPHY } from "./typography";

interface ChartDataPoint {
    label: string;
    value: number; // 0 to 100
    color?: string;
}

interface TheoryChartProps {
    title: string;
    data: ChartDataPoint[];
    description?: string;
}

export default function TheoryChart({ title, data, description }: TheoryChartProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-6 border border-neutral-800 bg-black/20 rounded-lg overflow-hidden">
            {/* Toggle Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
            >
                <div className="flex items-center gap-2 text-primary-gold/90 font-medium text-sm">
                    <BarChart2 size={16} />
                    <span>{isOpen ? "Hide Visual Analysis" : "Show Visual Analysis"}</span>
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
                        <div className="p-4 border-t border-neutral-800">
                            <h4 className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-4`}>
                                {title}
                            </h4>

                            {/* Chart Container */}
                            <div className="space-y-3 mb-4">
                                {data.map((point, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex justify-between text-xs text-primary-gold/70">
                                            <span>{point.label}</span>
                                            <span>{point.value}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${point.value}%` }}
                                                transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                                className="h-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                style={{ backgroundColor: point.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {description && (
                                <p className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/60 italic`}>
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
