/**
 * Hook to manage automatic playback/walkthrough of timeline points
 * Handles auto-advancing through timeline points when playing
 * @module useTimelinePlayback
 */

"use client";

import { useEffect, useRef } from "react";
import { useEventStore } from "@/stores/useEventStore";

/**
 * Hook that handles automatic timeline playback
 * When isTimelinePlaying is true, automatically advances to next timeline point
 * at intervals defined by timelinePlaySpeed
 *
 * Features:
 * - Auto-advance through timeline points
 * - Pause at end of timeline (no loop by default)
 * - Respects playback speed setting
 * - Cleans up on unmount or pause
 *
 * @example
 * ```tsx
 * // In WorldMap or Timeline component
 * useTimelinePlayback();
 * ```
 */
export function useTimelinePlayback() {
  const activeEvent = useEventStore((state) => state.activeEvent);
  const activeTimelinePointId = useEventStore(
    (state) => state.activeTimelinePointId
  );
  const isTimelinePlaying = useEventStore((state) => state.isTimelinePlaying);
  const timelinePlaySpeed = useEventStore((state) => state.timelinePlaySpeed);
  const navigateTimelinePoint = useEventStore(
    (state) => state.navigateTimelinePoint
  );
  const pauseTimeline = useEventStore((state) => state.pauseTimeline);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only set up interval if playing
    if (!isTimelinePlaying || !activeEvent?.timelinePoints) {
      return;
    }

    // Set up auto-advance interval
    intervalRef.current = setInterval(() => {
      const points = activeEvent.timelinePoints;
      if (!points || points.length === 0) {
        pauseTimeline();
        return;
      }

      // Find current point index
      const currentIndex = activeTimelinePointId
        ? points.findIndex((p) => p.id === activeTimelinePointId)
        : -1;

      // Check if we're at the last point
      if (currentIndex >= points.length - 1) {
        // Stop at end (don't loop)
        pauseTimeline();
        return;
      }

      // Advance to next point
      navigateTimelinePoint("next");
    }, timelinePlaySpeed);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isTimelinePlaying,
    activeEvent,
    activeTimelinePointId,
    timelinePlaySpeed,
    navigateTimelinePoint,
    pauseTimeline,
  ]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}


