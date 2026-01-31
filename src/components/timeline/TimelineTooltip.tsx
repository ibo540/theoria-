"use client";

import React from "react";
import { TimelinePoint } from "@/data/events";

interface TimelineTooltipProps {
  isVisible: boolean;
  point: TimelinePoint;
  matchesTheory: boolean;
  theoryAccent: string;
  eventTitle: string;
}

export default function TimelineTooltip({
  isVisible,
  point,
  matchesTheory,
  theoryAccent,
  eventTitle,
}: TimelineTooltipProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ 
        bottom: "calc(100% + 28px)", // Increased space to prevent overlap with point
        zIndex: 1000,
      }}
    >
      <div
        className="px-4 py-2.5 backdrop-blur-md rounded-md shadow-2xl"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.96)",
          border: `1.5px solid ${matchesTheory ? `${theoryAccent}88` : "rgba(255, 228, 190, 0.4)"}`,
          boxShadow: matchesTheory 
            ? `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${theoryAccent}44`
            : "0 8px 32px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          className="text-sm font-semibold"
          style={{
            color: matchesTheory ? theoryAccent : "#ffe4be",
          }}
        >
          {point.label}
        </div>
        <div
          className="text-xs mt-1"
          style={{ color: "rgba(255, 228, 190, 0.7)" }}
        >
          {point.date}
        </div>
        {point.year && (
          <div
            className="text-[11px] mt-0.5 uppercase tracking-wide"
            style={{
              color: matchesTheory
                ? `${theoryAccent}cc`
                : "rgba(255, 228, 190, 0.5)",
            }}
          >
            {point.year}
          </div>
        )}
        <div
          className="text-[10px] mt-1 opacity-60"
          style={{
            color: matchesTheory
              ? `${theoryAccent}aa`
              : "rgba(255, 228, 190, 0.5)",
          }}
        >
          {eventTitle}
        </div>
        {matchesTheory && point.relevantTheories && (
          <div
            className="text-[10px] mt-1 uppercase tracking-[0.2em]"
            style={{ color: `${theoryAccent}aa` }}
          >
            Theory match
          </div>
        )}
      </div>
      {/* Arrow pointing down to the point */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
        style={{
          top: "calc(100% - 5px)",
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          borderRight: `1.5px solid ${matchesTheory ? `${theoryAccent}88` : "rgba(255, 228, 190, 0.4)"}`,
          borderBottom: `1.5px solid ${matchesTheory ? `${theoryAccent}88` : "rgba(255, 228, 190, 0.4)"}`,
        }}
      />
    </div>
  );
}

