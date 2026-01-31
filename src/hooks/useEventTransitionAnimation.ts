"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AnimationRefs {
  // Bottom timeline ref
  timelineContainerRef: React.RefObject<HTMLDivElement | null>;
  // Right sidebar theory button refs
  theoryButtonRefs: React.MutableRefObject<HTMLElement[]>;
}

/**
 * Custom hook to manage synchronized GSAP animations for event transitions.
 * Coordinates two main animation sequences:
 * 1. Bottom timeline entrance/exit
 * 2. Right theory sidebar button stagger
 */
export function useEventTransitionAnimation(
  isEventOpen: boolean,
  refs: AnimationRefs
) {
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;

      // Set initial states immediately without animation
      if (!isEventOpen) {
        // Set timeline to hidden state initially
        if (refs.timelineContainerRef.current) {
          gsap.set(refs.timelineContainerRef.current, {
            y: 40,
            opacity: 0,
            scale: 0.95,
            filter: "blur(8px)",
          });
        }
        // Theory buttons will be hidden by their own conditional rendering
      }
      return;
    }

    const {
      timelineContainerRef,
      theoryButtonRefs,
    } = refs;

    // Kill any existing timeline
    if (masterTimelineRef.current) {
      masterTimelineRef.current.kill();
    }

    // Create master timeline with defaults
    const tl = gsap.timeline({
      defaults: {
        duration: 0.6,
        ease: "power3.inOut",
      },
    });

    if (isEventOpen) {
      // ============================================
      // ENTER ANIMATION: Show Event UI
      // ============================================

      // STEP 1: Bottom Timeline - materialize from bottom
      if (timelineContainerRef.current) {
        tl.fromTo(
          timelineContainerRef.current,
          {
            y: 40,
            opacity: 0,
            scale: 0.95,
            filter: "blur(8px)",
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.7,
            ease: "power3.out",
          },
          0.05
        );
      }

      // STEP 2: Right Theory Sidebar - stagger from left to right
      if (theoryButtonRefs.current && theoryButtonRefs.current.length > 0) {
        tl.fromTo(
          theoryButtonRefs.current,
          {
            x: -24,
            opacity: 0,
            filter: "blur(10px)",
            scale: 0.96,
          },
          {
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: {
              each: 0.08,
              from: "start", // Start from left (first element)
            },
          },
          0.15
        );
      }
    } else {
      // ============================================
      // EXIT ANIMATION: Hide Event UI
      // ============================================

      // STEP 1: Right Theory Sidebar - stagger out (reverse)
      if (theoryButtonRefs.current && theoryButtonRefs.current.length > 0) {
        tl.to(
          theoryButtonRefs.current,
          {
            x: -24,
            opacity: 0,
            filter: "blur(10px)",
            scale: 0.96,
            duration: 0.45,
            ease: "power3.in",
            stagger: {
              each: 0.06,
              from: "end", // Exit from right (last element)
            },
          },
          0
        );
      }

      // STEP 2: Bottom Timeline - dissolve to bottom
      if (timelineContainerRef.current) {
        tl.to(
          timelineContainerRef.current,
          {
            y: 40,
            opacity: 0,
            scale: 0.95,
            filter: "blur(8px)",
            duration: 0.5,
            ease: "power3.in",
          },
          0.05
        );
      }
    }

    masterTimelineRef.current = tl;

    // Cleanup
    return () => {
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }
    };
  }, [isEventOpen, refs]);

  return masterTimelineRef;
}
