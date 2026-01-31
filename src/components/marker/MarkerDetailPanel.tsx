"use client";

import React, { useRef, useMemo } from "react";
import { X } from "lucide-react";
import Button from "../ui/Buttons/p-button/Button";
import Divider from "../Divider";
import { TheoryType } from "@/stores/useTheoryStore";
import { getTheoryDataKey } from "@/lib/marker-utils";
import { MarkerData } from "./types";
import MarkerIcon from "./MarkerIcon";

const panelBorderStyle: React.CSSProperties = {
  borderImageSource: "url('/assets/windows/Window_08.png')",
  borderImageSlice: "370 370 370 370",
  borderImageRepeat: "round",
  borderImageWidth: "28px",
  overflow: "hidden",
  boxSizing: "border-box",
};

interface MarkerDetailPanelProps {
  marker: MarkerData | null;
  activeTheory: TheoryType | null;
  getTheoryColor: (theory: TheoryType) => string;
  onClose: () => void;
}

export default function MarkerDetailPanel({
  marker,
  activeTheory,
  getTheoryColor,
  onClose,
}: MarkerDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisible = marker !== null;

  // Memoize theory perspective lookup
  const theoryPerspective = useMemo(() => {
    if (!activeTheory || !marker?.perspectives) return null;

    // Try multiple key formats
    const keys = [
      activeTheory,
      getTheoryDataKey(activeTheory),
      activeTheory.replace(/([A-Z])/g, "-$1").toLowerCase(),
    ];

    for (const key of keys) {
      if (marker.perspectives[key]) {
        return marker.perspectives[key];
      }
    }

    // Try finding by partial match
    for (const [key, value] of Object.entries(marker.perspectives)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");
      const normalizedTheory = activeTheory.toLowerCase().replace(/[-_]/g, "");
      if (
        normalizedKey.includes(normalizedTheory) ||
        normalizedTheory.includes(normalizedKey)
      ) {
        return value;
      }
    }

    return null;
  }, [activeTheory, marker]);

  const theoryColor = useMemo(
    () => (activeTheory ? getTheoryColor(activeTheory) : null),
    [activeTheory, getTheoryColor]
  );

  if (!marker) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-10001"
      style={{
        left: "24px",
        top: "24px",
        width: "420px",
        maxHeight: "calc(100vh - 48px)",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        ...panelBorderStyle,
      }}
    >
      <div
        className="absolute overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-xl"
        style={{
          top: "15px",
          left: "15px",
          right: "15px",
          bottom: "15px",
        }}
      >
        {/* Top corner gradient decoration */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "300px",
            background:
              "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255, 228, 190, 0.2) 0%, rgba(255, 228, 190, 0.1) 30%, transparent 70%)",
            zIndex: 0,
          }}
        />

        <div ref={contentRef} className="relative p-5" style={{ zIndex: 10 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5 marker-detail-section">
            <div className="flex items-center gap-3">
              <div style={{ color: theoryColor || "#ffcc7c" }}>
                <MarkerIcon
                  marker={marker}
                  size={28}
                />
              </div>
              <div>
                <h2 className="text-2xl text-primary-gold font-light tracking-wide">
                  {marker.name}
                </h2>
                {marker.role && (
                  <p className="text-sm text-primary-gold/60 mt-1">
                    {marker.role}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={onClose}
              borderStyle="five"
              variant="icon"
              className="relative"
              style={{ zIndex: 20, pointerEvents: "auto" }}
              type="button"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Countries in unified area */}
          {marker.isUnified &&
            marker.countries &&
            marker.countries.length > 0 && (
              <div className="marker-detail-section mb-4">
                <Divider type="line" />
                <p className="text-sm text-primary-gold/60 uppercase tracking-[0.2em] mb-3">
                  Member Countries
                </p>
                <div className="flex flex-wrap gap-2">
                  {marker.countries.map((country) => (
                    <span
                      key={country}
                      className="px-3 py-1.5 border border-primary-gold/25 text-xs text-primary-gold/70 rounded bg-black/20"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Supported Theories */}
          {marker.supportedTheories && marker.supportedTheories.length > 0 && (
            <div className="marker-detail-section mb-4">
              <Divider type="line" />
              <p className="text-sm text-primary-gold/60 uppercase tracking-[0.2em] mb-3">
                Relevant Theories
              </p>
              <div className="flex flex-wrap gap-2">
                {marker.supportedTheories.map((theory) => {
                  const color = getTheoryColor(theory);
                  return (
                    <span
                      key={theory}
                      className="px-3 py-1.5 border rounded text-xs uppercase tracking-[0.2em] font-medium"
                      style={{
                        borderColor: `${color}60`,
                        color: color,
                        backgroundColor: `${color}15`,
                      }}
                    >
                      {theory.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Theory Perspective */}
          {activeTheory && theoryPerspective && (
            <div className="marker-detail-section">
              <Divider type="line" />
              <div
                className="p-4 bg-black/30 border rounded-lg"
                style={{ borderColor: `${theoryColor}40` }}
              >
                <p
                  className="text-xs uppercase tracking-[0.3em] mb-3 font-medium"
                  style={{ color: theoryColor || undefined }}
                >
                  {activeTheory.replace(/([A-Z])/g, " $1").trim()} Perspective
                </p>
                <p className="text-sm text-primary-gold/80 leading-relaxed">
                  {theoryPerspective}
                </p>
              </div>
            </div>
          )}

          {/* No theory selected message */}
          {!activeTheory &&
            marker.perspectives &&
            Object.keys(marker.perspectives).length > 0 && (
              <div className="marker-detail-section">
                <Divider type="line" />
                <p className="text-sm text-primary-gold/50 italic leading-relaxed">
                  Select a theory from the right sidebar to see perspectives on
                  this {marker.isUnified ? "region" : "country"}.
                </p>
              </div>
            )}

          {/* Additional info if available */}
          {marker.perspectives &&
            Object.keys(marker.perspectives).length === 0 && (
              <div className="marker-detail-section">
                <Divider type="line" />
                <p className="text-sm text-primary-gold/50 italic">
                  No detailed perspectives available for this{" "}
                  {marker.isUnified ? "region" : "country"}.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
