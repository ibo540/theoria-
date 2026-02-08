"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import TheoryButton from "./TheoryButton";
import { useLoaderComplete } from "@/hooks/useLoaderComplete";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { useEventStore } from "@/stores/useEventStore";

const theories: TheoryType[] = [
  "realism",
  "neorealism",
  "liberalism",
  "neoliberal",
  "englishschool",
  "constructivism",
];

interface TheorySidebarProps {
  theoryButtonRefs?: React.MutableRefObject<HTMLElement[]>;
  isTimelineNavigating?: boolean;
}

// Animation constants - synchronized with TheoryButton
const ANIMATION_DURATION = 0.9;
const ANIMATION_EASE = "expo.out";
const STAGGER_DELAY = 0.12;
const GAP_ANIMATION_DURATION = 0.7;
const GAP_ANIMATION_EASE = "expo.out";

export default function TheorySidebar({
  theoryButtonRefs,
  isTimelineNavigating = false,
}: TheorySidebarProps) {
  const activeTheory = useTheoryStore((state) => state.activeTheory);
  const toggleTheory = useTheoryStore((state) => state.toggleTheory);
  const activeEventId = useEventStore((state) => state.activeEventId);
  const isLoaderComplete = useLoaderComplete();

  const hasActiveTheory = activeTheory !== null;
  const shouldShow = Boolean(isLoaderComplete && activeEventId);

  const containerRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const previousShouldShowRef = useRef<boolean>(false);
  const isFirstRenderRef = useRef<boolean>(true);
  const showHideTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Handle show/hide animations - smooth coordinated transitions
  useEffect(() => {
    if (!containerRef.current || !asideRef.current) return;

    const buttonElements = Array.from(containerRef.current.children).filter(
      (el) => el.tagName === "DIV"
    ) as HTMLElement[];

    if (buttonElements.length === 0) return;

    // Kill any existing show/hide animation
    if (showHideTimelineRef.current) {
      showHideTimelineRef.current.kill();
    }

    // First render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousShouldShowRef.current = shouldShow;

      // Always set initial visibility based on shouldShow
      asideRef.current.style.visibility = shouldShow ? "visible" : "hidden";

      if (shouldShow) {
        showHideTimelineRef.current = gsap.timeline();
        showHideTimelineRef.current
          .set(buttonElements, { opacity: 0, y: -30 })
          .to(buttonElements, {
            opacity: 1,
            y: 0,
            duration: ANIMATION_DURATION,
            ease: ANIMATION_EASE,
            stagger: { each: STAGGER_DELAY, from: "start" },
            force3D: true,
          });
      } else {
        gsap.set(buttonElements, { opacity: 0, y: 0 });
      }
      return;
    }

    if (previousShouldShowRef.current === shouldShow) return;
    previousShouldShowRef.current = shouldShow;

    if (shouldShow) {
      // Enter animation - smooth coordinated entry
      if (asideRef.current) {
        asideRef.current.style.visibility = "visible";
      }
      showHideTimelineRef.current = gsap.timeline();
      showHideTimelineRef.current.fromTo(
        buttonElements,
        { opacity: 0, y: -150 },
        {
          opacity: 1,
          y: 0,
          duration: ANIMATION_DURATION,
          ease: ANIMATION_EASE,
          stagger: { each: STAGGER_DELAY, from: "start" },
          force3D: true,
        }
      );
    } else {
      // Exit animation - smooth coordinated exit
      showHideTimelineRef.current = gsap.timeline({
        onComplete: () => {
          gsap.set(buttonElements, { y: 0 });
          if (asideRef.current) {
            asideRef.current.style.visibility = "hidden";
          }
        },
      });
      showHideTimelineRef.current.to(buttonElements, {
        opacity: 0,
        y: -150,
        duration: 0.4,
        ease: "expo.in",
        stagger: { each: 0.02, from: "start" },
        force3D: true,
      });
    }
  }, [shouldShow]);

  const previousHasActiveTheoryRef = useRef<boolean>(false);
  const gapAnimationRef = useRef<gsap.core.Tween | null>(null);
  const timelineNavigationAnimationRef = useRef<gsap.core.Timeline | null>(null);
  const previousIsTimelineNavigatingRef = useRef<boolean>(false);

  // Animate gap when selecting/deselecting theory - synchronized with button animations
  useEffect(() => {
    if (!containerRef.current) return;

    const wasActive = previousHasActiveTheoryRef.current;
    const isActive = hasActiveTheory;

    if (wasActive === isActive) {
      previousHasActiveTheoryRef.current = isActive;
      return;
    }

    previousHasActiveTheoryRef.current = isActive;

    // Kill any existing gap animation for smooth transitions
    if (gapAnimationRef.current) {
      gapAnimationRef.current.kill();
    }

    // When selected, smaller gap (buttons compress together)
    // When unselected, normal gap
    const targetGap = isActive ? 8 : 12;

    gapAnimationRef.current = gsap.to(containerRef.current, {
      gap: targetGap,
      duration: GAP_ANIMATION_DURATION,
      ease: GAP_ANIMATION_EASE,
      overwrite: "auto",
      force3D: true,
      onComplete: () => {
        gapAnimationRef.current = null;
      },
    });
  }, [hasActiveTheory]);

  // Handle timeline navigation animations - hide/show icons one by one
  useEffect(() => {
    if (!containerRef.current || !asideRef.current) return;

    const buttonElements = Array.from(containerRef.current.children).filter(
      (el) => el.tagName === "DIV"
    ) as HTMLElement[];

    if (buttonElements.length === 0) return;

    // Skip if state hasn't changed
    if (previousIsTimelineNavigatingRef.current === isTimelineNavigating) {
      return;
    }

    previousIsTimelineNavigatingRef.current = isTimelineNavigating;

    // Kill any existing timeline navigation animation
    if (timelineNavigationAnimationRef.current) {
      timelineNavigationAnimationRef.current.kill();
    }

    if (isTimelineNavigating) {
      // Hide icons - slide up one by one, completely off-screen
      timelineNavigationAnimationRef.current = gsap.timeline({
        onComplete: () => {
          // Completely hide the container after animation
          if (asideRef.current) {
            asideRef.current.style.visibility = "hidden";
            asideRef.current.style.pointerEvents = "none";
            asideRef.current.style.height = "0";
            asideRef.current.style.overflow = "hidden";
          }
          gsap.set(buttonElements, { pointerEvents: "none" });
        },
      });
      timelineNavigationAnimationRef.current.to(buttonElements, {
        y: -250, // Move even further up to ensure completely hidden
        opacity: 0,
        duration: 0.5,
        ease: "expo.in",
        stagger: { each: 0.08, from: "start" }, // Staggered animation, one by one
        force3D: true,
      });
    } else {
      // Show icons - slide down one by one
      // First ensure they're visible and reset position
      if (asideRef.current) {
        asideRef.current.style.visibility = "visible";
        asideRef.current.style.pointerEvents = "auto";
        asideRef.current.style.height = "auto";
        asideRef.current.style.overflow = "visible";
      }
      gsap.set(buttonElements, { pointerEvents: "auto", y: -250, opacity: 0 });
      
      timelineNavigationAnimationRef.current = gsap.timeline();
      timelineNavigationAnimationRef.current.to(
        buttonElements,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "expo.out",
          stagger: { each: 0.08, from: "start" }, // Staggered animation, one by one
          force3D: true,
        }
      );
    }
  }, [isTimelineNavigating]);

  return (
    <aside
      ref={asideRef}
      className="fixed top-[24px] left-1/2 -translate-x-1/2 z-1"
      style={{
        overflow: "visible", // Always visible by default, only hidden during animation
        height: "auto", // Always auto by default
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-row items-center"
        style={{
          gap: hasActiveTheory ? 8 : 12, // Compress gap when theory selected
        }}
      >
        {theories.map((theory, index) => (
          <TheoryButton
            key={theory}
            theory={theory}
            onClick={() => toggleTheory(theory)}
            isActive={activeTheory === theory}
            hasActiveTheory={hasActiveTheory}
            containerRefCallback={(el) => {
              if (theoryButtonRefs?.current && el) {
                theoryButtonRefs.current[index] = el;
              }
            }}
          />
        ))}
      </div>
    </aside>
  );
}
