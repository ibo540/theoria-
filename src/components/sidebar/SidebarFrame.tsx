"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import gsap from "gsap";

const sidebarBorderStyle: React.CSSProperties = {
  borderImageSource: "url('/assets/windows/Window_08.png')",
  borderImageSlice: "370 370 370 370",
  borderImageRepeat: "round",
  borderImageWidth: "28px",
  boxSizing: "border-box",
};

interface SidebarFrameProps {
  children: React.ReactNode;
  width: number;
  onResizeStart: () => void;
  isTimelineNavigating?: boolean;
}

export const SidebarFrame = forwardRef<HTMLElement, SidebarFrameProps>(
  ({ children, width, onResizeStart, isTimelineNavigating = false }, ref) => {
    const asideRef = useRef<HTMLElement>(null);
    const timelineNavigationAnimationRef = useRef<gsap.core.Timeline | null>(null);
    const previousIsTimelineNavigatingRef = useRef<boolean>(false);

    // Combine refs
    React.useImperativeHandle(ref, () => asideRef.current as HTMLElement, []);

    // Handle timeline navigation animations - slide left/right
    useEffect(() => {
      if (!asideRef.current) return;

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
        // Hide sidebar - slide left, completely off-screen
        // Set overflow hidden before animation starts
        if (asideRef.current) {
          asideRef.current.style.overflow = "hidden";
        }

        timelineNavigationAnimationRef.current = gsap.timeline({
          onComplete: () => {
            // Completely hide the container after animation
            if (asideRef.current) {
              asideRef.current.style.visibility = "hidden";
              asideRef.current.style.pointerEvents = "none";
              asideRef.current.style.width = "0";
            }
          },
        });
        
        // Calculate the distance to move (width + left margin)
        const moveDistance = width + 16; // width + left margin (16px)
        
        // Animate x while preserving y transform (translateY(-50%))
        timelineNavigationAnimationRef.current.to(asideRef.current, {
          x: -moveDistance, // Move left by width + margin
          opacity: 0,
          duration: 0.5,
          ease: "expo.in",
          force3D: true,
        });
      } else {
        // Show sidebar - slide in from left
        // First ensure they're visible and reset position
        if (asideRef.current) {
          asideRef.current.style.visibility = "visible";
          asideRef.current.style.pointerEvents = "auto";
          asideRef.current.style.width = `${width}px`;
          // Reset overflow after animation completes
          setTimeout(() => {
            if (asideRef.current && !isTimelineNavigating) {
              asideRef.current.style.overflow = "visible";
            }
          }, 650); // Slightly longer than animation duration
        }

        // Calculate the distance to move from
        const moveDistance = width + 16; // width + left margin (16px)
        
        // Set initial position (off-screen to the left)
        gsap.set(asideRef.current, { x: -moveDistance, opacity: 0 });

        timelineNavigationAnimationRef.current = gsap.timeline();
        timelineNavigationAnimationRef.current.to(asideRef.current, {
          x: 0, // Return to original position
          opacity: 1,
          duration: 0.6,
          ease: "expo.out",
          force3D: true,
        });
      }
    }, [isTimelineNavigating, width]);
    return (
      <aside
        ref={asideRef}
        className="fixed"
        style={{
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: `${width}px`,
          height: "calc(70vh)",
          zIndex: -1,
          overflow: "visible", // Always visible by default, only hidden during animation
          ...sidebarBorderStyle,
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            onResizeStart();
          }}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-primary-gold/30 transition-colors z-10"
          style={{ touchAction: "none" }}
        />

        {/* Background with blur */}
        <div
          className="absolute bg-black/70 backdrop-blur-xl"
          style={{
            top: "15px",
            left: "15px",
            right: "15px",
            bottom: "15px",
            zIndex: -1,
          }}
        >
          {/* Top corner gradient decoration */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: "1500px",
              background:
                "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255, 228, 190, 0.25) 0%, rgba(255, 228, 190, 0.15) 30%, rgba(255, 228, 190, 0.08) 50%, transparent 75%)",
              zIndex: -1,
            }}
          />
        </div>

        {/* Content */}
        <div
          className="flex flex-col w-full h-full relative"
          style={{ paddingBottom: "28px" }}
        >
          {children}
        </div>
      </aside>
    );
  }
);

SidebarFrame.displayName = "SidebarFrame";
