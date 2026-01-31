/**
 * Hook to coordinate smooth GSAP animations when timeline points change
 * Handles marker transitions, area fades, and flow animations
 * @module useTimelinePointAnimation
 */

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useEventStore } from "@/stores/useEventStore";

/**
 * Configuration for timeline point transition animations
 */
const ANIMATION_CONFIG = {
  // Marker animations
  markerFadeOut: 0.3,
  markerFadeIn: 0.4,
  markerFadeInDelay: 0.4,
  markerStagger: 0.05,
  markerScale: { from: 0.8, to: 1 },

  // Area animations
  areaFadeOut: 0.3,
  areaFadeIn: 0.5,
  areaFadeInDelay: 0.5,

  // Flow animations
  flowFadeOut: 0.3,
  flowFadeIn: 0.5,
  flowFadeInDelay: 0.6,

  // Active point indicator
  activePointScale: 1.3,
  activePointDuration: 0.3,
};

/**
 * Hook that coordinates GSAP animations for timeline point transitions
 * Manages:
 * - Active timeline point visual state
 * - Marker fade in/out transitions
 * - Area overlay transitions
 * - Flow/movement transitions
 *
 * @example
 * ```tsx
 * useTimelinePointAnimation();
 * // Now timeline point changes trigger smooth GSAP animations
 * ```
 */
export function useTimelinePointAnimation() {
  const activeTimelinePointId = useEventStore(
    (state) => state.activeTimelinePointId
  );
  const lastActiveIdRef = useRef<string | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Skip if this is the same point (no change)
    if (lastActiveIdRef.current === activeTimelinePointId) {
      return;
    }

    // Kill any existing timeline animation
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // If no active point, just cleanup
    if (!activeTimelinePointId) {
      animateDeactivation();
      lastActiveIdRef.current = null;
      return;
    }

    // Animate transition to new timeline point
    animateTransition(lastActiveIdRef.current, activeTimelinePointId);
    lastActiveIdRef.current = activeTimelinePointId;
  }, [activeTimelinePointId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);
}

/**
 * Animate deactivation (fade out all elements)
 */
function animateDeactivation() {
  // Find all timeline-related DOM elements
  const markers = document.querySelectorAll('[data-timeline-marker="true"]');
  const areas = document.querySelectorAll('[id^="timeline-area-"]');
  const flows = document.querySelectorAll('[id^="timeline-flow-"]');

  // Create fade-out timeline
  const tl = gsap.timeline();

  if (markers.length > 0) {
    tl.to(
      markers,
      {
        opacity: 0,
        scale: ANIMATION_CONFIG.markerScale.from,
        duration: ANIMATION_CONFIG.markerFadeOut,
        ease: "power2.in",
      },
      0
    );
  }

  if (areas.length > 0) {
    tl.to(
      areas,
      {
        opacity: 0,
        duration: ANIMATION_CONFIG.areaFadeOut,
        ease: "power2.in",
      },
      0
    );
  }

  if (flows.length > 0) {
    tl.to(
      flows,
      {
        opacity: 0,
        duration: ANIMATION_CONFIG.flowFadeOut,
        ease: "power2.in",
      },
      0
    );
  }
}

/**
 * Animate transition from one timeline point to another
 */
function animateTransition(oldPointId: string | null, newPointId: string) {
  // Find DOM elements for old and new timeline points
  const oldMarkers = oldPointId
    ? document.querySelectorAll(`[data-timeline-point="${oldPointId}"]`)
    : [];
  const newMarkers = document.querySelectorAll(
    `[data-timeline-point="${newPointId}"]`
  );

  // Timeline point indicator elements (the diamond shapes on the timeline)
  const oldIndicator = oldPointId
    ? document.querySelector(`[data-timeline-indicator="${oldPointId}"]`)
    : null;
  const newIndicator = document.querySelector(
    `[data-timeline-indicator="${newPointId}"]`
  );

  // Create coordinated timeline
  const tl = gsap.timeline({
    defaults: {
      ease: "power2.out",
    },
  });

  // 1. Animate old timeline point indicator (shrink)
  if (oldIndicator) {
    tl.to(
      oldIndicator,
      {
        scale: 1,
        duration: ANIMATION_CONFIG.activePointDuration,
        ease: "power2.in",
      },
      0
    );
  }

  // 2. Animate new timeline point indicator (grow)
  if (newIndicator) {
    tl.fromTo(
      newIndicator,
      {
        scale: 1,
      },
      {
        scale: ANIMATION_CONFIG.activePointScale,
        duration: ANIMATION_CONFIG.activePointDuration,
        ease: "back.out(1.2)",
      },
      0
    );
  }

  // 3. Fade out old markers
  if (oldMarkers.length > 0) {
    tl.to(
      oldMarkers,
      {
        opacity: 0,
        scale: ANIMATION_CONFIG.markerScale.from,
        duration: ANIMATION_CONFIG.markerFadeOut,
        ease: "power2.in",
      },
      0
    );
  }

  // 4. Fade in new markers (with stagger)
  if (newMarkers.length > 0) {
    tl.fromTo(
      newMarkers,
      {
        opacity: 0,
        scale: ANIMATION_CONFIG.markerScale.from,
      },
      {
        opacity: 1,
        scale: ANIMATION_CONFIG.markerScale.to,
        duration: ANIMATION_CONFIG.markerFadeIn,
        stagger: ANIMATION_CONFIG.markerStagger,
        ease: "back.out(1.2)",
      },
      ANIMATION_CONFIG.markerFadeInDelay
    );
  }

  // Note: Area and flow animations are handled by their respective hooks
  // through MapLibre layer opacity changes, which are smoother for large geometries
}

/**
 * Helper to animate timeline point diamond on activation
 * Call this from Timeline.tsx when a point becomes active
 */
export function animateTimelinePointActivation(element: HTMLElement) {
  gsap.fromTo(
    element,
    {
      scale: 1,
    },
    {
      scale: ANIMATION_CONFIG.activePointScale,
      duration: ANIMATION_CONFIG.activePointDuration,
      ease: "back.out(1.2)",
    }
  );
}

/**
 * Helper to animate timeline point diamond on deactivation
 * Call this from Timeline.tsx when a point becomes inactive
 */
export function animateTimelinePointDeactivation(element: HTMLElement) {
  gsap.to(element, {
    scale: 1,
    duration: ANIMATION_CONFIG.activePointDuration,
    ease: "power2.in",
  });
}


