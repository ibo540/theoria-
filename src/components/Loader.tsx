"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const LAST_UPDATE_DATE = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const COLORS = {
  background: "var(--dark)",
  gold: "var(--primary-gold)",
} as const;

const ANIMATION = {
  progressDuration: 2.5,
  curtainDuration: 1.2,
  fadeInDuration: 0.4,
  percentageFadeOutDuration: 0.4,
  dateSlideInDuration: 0.8,
  dateSlideInDelay: 0.3,
  dateFadeOutDuration: 0.5,
  dateFadeOutDelay: 0.2,
} as const;

export default function Loader() {
  const [isVisible, setIsVisible] = useState(true);
  const [percentage, setPercentage] = useState(0);

  const topOverlayRef = useRef<HTMLDivElement>(null);
  const bottomOverlayRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topOverlayRef.current || !bottomOverlayRef.current) return;

    // Initialize
    gsap.set(topOverlayRef.current, { yPercent: 0 });
    gsap.set(bottomOverlayRef.current, { yPercent: 0 });
    gsap.set(percentageRef.current, { opacity: 0 });
    gsap.set(dateRef.current, { opacity: 0, y: -30 });

    const timeline = gsap.timeline();

    // Percentage fade in
    timeline.to(
      percentageRef.current,
      {
        opacity: 1,
        duration: ANIMATION.fadeInDuration,
        ease: "power2.out",
      },
      0
    );

    // Percentage counter
    const counter = { value: 0 };
    timeline.to(
      counter,
      {
        value: 100,
        duration: ANIMATION.progressDuration,
        ease: "power3.inOut",
        onUpdate: () => setPercentage(Math.round(counter.value)),
      },
      0
    );

    // Date slide down and fade in
    timeline.to(
      dateRef.current,
      {
        opacity: 1,
        y: 0,
        duration: ANIMATION.dateSlideInDuration,
        ease: "power3.out",
      },
      ANIMATION.dateSlideInDelay
    );

    const curtainStartTime = ANIMATION.progressDuration;

    // Percentage fade out when reaching 100%
    timeline.to(
      percentageRef.current,
      {
        opacity: 0,
        duration: ANIMATION.percentageFadeOutDuration,
        ease: "power2.in",
      },
      curtainStartTime - ANIMATION.percentageFadeOutDuration
    );

    // Date fade out
    timeline.to(
      dateRef.current,
      {
        opacity: 0,
        y: 30,
        duration: ANIMATION.dateFadeOutDuration,
        ease: "power2.in",
      },
      curtainStartTime - ANIMATION.dateFadeOutDelay
    );

    // Curtains open
    timeline.call(
      () => {
        // Dispatch event when curtains start opening - cursor becomes free
        window.dispatchEvent(new CustomEvent("curtains-open"));
      },
      [],
      curtainStartTime
    );

    timeline.to(
      topOverlayRef.current,
      {
        yPercent: -100,
        duration: ANIMATION.curtainDuration,
        ease: "power4.inOut",
      },
      curtainStartTime
    );

    timeline.to(
      bottomOverlayRef.current,
      {
        yPercent: 100,
        duration: ANIMATION.curtainDuration,
        ease: "power4.inOut",
        onComplete: () => {
          setIsVisible(false);
          // Dispatch event to notify CustomCursor that loader is done
          window.dispatchEvent(new CustomEvent("loader-complete"));
        },
      },
      curtainStartTime
    );

    return () => {
      timeline.kill();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
      <div
        ref={topOverlayRef}
        className="absolute top-0 left-0 right-0"
        style={{
          height: "50vh",
          backgroundColor: COLORS.background,
          willChange: "transform",
          zIndex: 1,
        }}
      />
      <div
        ref={bottomOverlayRef}
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "50vh",
          backgroundColor: COLORS.background,
          willChange: "transform",
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 2 }}
      >
        <div
          ref={percentageRef}
          style={{
            fontFamily: "var(--font-forum)",
            fontSize: "1.5rem",
            color: COLORS.gold,
            fontWeight: 300,
            opacity: 0,
          }}
        >
          {percentage}%
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 pb-8 text-center"
        style={{
          zIndex: 2,
          fontFamily: "var(--font-forum)",
          color: COLORS.gold,
        }}
      >
        <div
          ref={dateRef}
          className="text-sm opacity-70"
          style={{
            letterSpacing: "0.05em",
            fontWeight: 300,
            willChange: "transform, opacity",
          }}
          suppressHydrationWarning
        >
          {LAST_UPDATE_DATE}
        </div>
      </div>
    </div>
  );
}
