"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { useEventStore } from "@/stores/useEventStore";
import { getTheoryDataKey } from "@/lib/marker-utils";
import Button from "@/components/ui/Buttons/p-button/Button";
import TimelineTooltip from "./TimelineTooltip";

interface TimelineProps {
  timelineContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function Timeline({ timelineContainerRef }: TimelineProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const activeTheory = useTheoryStore((state) => state.activeTheory);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);

  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeEventId = useEventStore((state) => state.activeEventId);
  const activeTimelinePointId = useEventStore(
    (state) => state.activeTimelinePointId
  );
  const setActiveTimelinePoint = useEventStore(
    (state) => state.setActiveTimelinePoint
  );
  const navigateTimelinePoint = useEventStore(
    (state) => state.navigateTimelinePoint
  );

  const theoryDataKey = activeTheory ? getTheoryDataKey(activeTheory) : null;
  const theoryAccent = activeTheory ? getTheoryColor(activeTheory) : "#ffe4be";

  const localTimelineRef = useRef<HTMLDivElement>(null);
  const containerRef = timelineContainerRef || localTimelineRef;

  const hasData = activeEventId && activeEvent && activeEvent.timelinePoints;
  const timelinePoints = hasData ? activeEvent.timelinePoints : [];

  // Keyboard navigation still works (Left/Right arrows)
  useEffect(() => {
    if (!hasData) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateTimelinePoint("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateTimelinePoint("next");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [hasData, navigateTimelinePoint]);

  const handlePointClick = (pointId: string) => {
    // Always set the timeline point, even if it's already active
    // This ensures clicks on the first point work even when it's already selected
    setActiveTimelinePoint(pointId);
  };

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 z-1 px-4"
      style={{
        bottom: 10,
        pointerEvents: hasData ? "auto" : "none",
      }}
    >
      <div
        className="relative flex items-center"
        style={{
          width: "100%",
          height: 100,
        }}
      >
        {/* Left navigation button */}
        {hasData && timelinePoints.length > 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              flex: "0 0 auto",
              paddingRight: 24,
              height: 80,
            }}
          >
            <Button
              onClick={() => navigateTimelinePoint("prev")}
              borderStyle="five"
              variant="icon"
              type="button"
              aria-label="Previous timeline point"
            >
              <ArrowLeft size={20} />
            </Button>
          </div>
        )}

        {/* Timeline core area */}
        <div
          className="relative"
          style={{
            flex: "1 1 auto",
            height: 80,
          }}
        >
          <div
            className="absolute left-0 right-0"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              height: 60,
            }}
          >
            {/* Base line */}
            <div
              className="absolute left-0 right-0 overflow-hidden"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                height: 3,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255, 228, 190, 0.2) 10%, rgba(255, 228, 190, 0.5) 50%, rgba(255, 228, 190, 0.2) 90%, transparent 100%)",
                }}
              />
            </div>

            {/* Points */}
            {timelinePoints.map((point, index) => {
              const isHovered = hoveredPoint === point.id;
              const isActive = activeTimelinePointId === point.id;

              const matchesTheory = theoryDataKey
                ? point.relevantTheories?.includes(theoryDataKey) ?? false
                : false;

              const isTurningPoint = Boolean(point.isTurningPoint);
              const shouldHighlight =
                isActive || matchesTheory || isTurningPoint;

              return (
                <div
                  key={point.id}
                  className="absolute"
                  style={{
                    left: `${point.position}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: isHovered || isActive ? 20 : 10,
                  }}
                >
                  <button
                    className="relative group flex items-center justify-center cursor-pointer transition-all duration-300"
                    style={{ width: 40, height: 40 }}
                    aria-label={point.label}
                    onClick={() => handlePointClick(point.id)}
                    onMouseEnter={() => setHoveredPoint(point.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Outer diamond */}
                    <div
                      className="absolute pointer-events-none transition-all duration-300"
                      style={{
                        width: 24,
                        height: 24,
                        border: `2px solid ${
                          shouldHighlight
                            ? matchesTheory
                              ? theoryAccent
                              : "#ffe4be"
                            : "rgba(255, 228, 190, 0.4)"
                        }`,
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(45deg) scale(${
                          isHovered || isActive ? 1.2 : 1
                        })`,
                        boxShadow: shouldHighlight
                          ? `0 0 18px ${
                              matchesTheory ? theoryAccent : "#ffe4be"
                            }55`
                          : undefined,
                      }}
                    />

                    {/* Inner diamond */}
                    <div
                      className="transition-all duration-300"
                      style={{
                        width: 14,
                        height: 14,
                        backgroundColor: shouldHighlight
                          ? matchesTheory
                            ? theoryAccent
                            : "#ffe4be"
                          : "transparent",
                        border: shouldHighlight
                          ? "none"
                          : `2px solid ${
                              matchesTheory ? theoryAccent : "#ffe4be"
                            }`,
                        boxShadow: shouldHighlight
                          ? `0 0 12px ${
                              matchesTheory
                                ? `${theoryAccent}88`
                                : "rgba(255, 228, 190, 0.6)"
                            }`
                          : "none",
                        transform: `rotate(45deg) scale(${
                          isHovered || isActive ? 1.3 : 1
                        })`,
                      }}
                    />
                  </button>

                  {activeEvent && (
                    <TimelineTooltip
                      isVisible={isHovered}
                      point={point}
                      matchesTheory={matchesTheory}
                      theoryAccent={theoryAccent}
                      eventTitle={activeEvent.title}
                    />
                  )}

                  {/* Connection line to next point */}
                  {index < timelinePoints.length - 1 && (
                    <div
                      className="absolute h-[3px]"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: `${
                          timelinePoints[index + 1].position - point.position
                        }%`,
                        background:
                          "linear-gradient(90deg, rgba(255, 228, 190, 0.5) 0%, rgba(255, 228, 190, 0.3) 100%)",
                        zIndex: -1,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right navigation button */}
        {hasData && timelinePoints.length > 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              flex: "0 0 auto",
              paddingLeft: 24,
              height: 80,
            }}
          >
            <Button
              onClick={() => navigateTimelinePoint("next")}
              borderStyle="five"
              variant="icon"
              type="button"
              aria-label="Next timeline point"
            >
              <ArrowRight size={20} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
