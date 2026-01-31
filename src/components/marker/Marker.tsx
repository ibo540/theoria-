"use client";

import React, { useState } from "react";
import { MarkerData } from "./types";
import { TheoryType } from "@/stores/useTheoryStore";
import MarkerIcon from "./MarkerIcon";

interface MarkerProps {
  marker: MarkerData;
  activeTheory: TheoryType | null;
  getTheoryColor: (theory: TheoryType) => string;
  onClick?: (marker: MarkerData) => void;
}

const SIZES = {
  unified: { outer: 44, inner: 30, icon: 20 },
  individual: { outer: 40, inner: 26, icon: 18 },
};

export default function Marker({
  marker,
  activeTheory,
  getTheoryColor,
  onClick,
}: MarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const size = SIZES[marker.isUnified ? "unified" : "individual"];

  const matchesTheory =
    activeTheory && marker.supportedTheories?.includes(activeTheory);
  const theoryColor = matchesTheory ? getTheoryColor(activeTheory) : null;

  const borderColor = theoryColor || "rgba(255, 228, 190, 0.4)";
  const fillColor = theoryColor || "#ffe4be";

  return (
    <button
      onClick={() => onClick?.(marker)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={marker.name}
      className="relative transition-all duration-300"
      style={{ width: size.outer, height: size.outer }}
    >
      {/* Outer border */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          border: `2px solid ${borderColor}`,
          transform: `translate(-50%, -50%) rotate(45deg) scale(${
            isHovered ? 1.15 : 1
          })`,
          top: "50%",
          left: "50%",
          width: size.outer,
          height: size.outer,
          boxShadow: matchesTheory ? `0 0 18px ${fillColor}55` : undefined,
        }}
      />

      {/* Inner fill */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: fillColor,
          transform: `translate(-50%, -50%) rotate(45deg) scale(${
            isHovered ? 1.2 : 1
          })`,
          top: "50%",
          left: "50%",
          width: size.inner,
          height: size.inner,
          boxShadow: `0 0 12px ${
            matchesTheory ? `${fillColor}88` : "rgba(255, 228, 190, 0.6)"
          }`,
        }}
      />

      {/* Icon */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 10 }}
      >
        <MarkerIcon marker={marker} size={size.icon} />
      </div>
    </button>
  );
}
