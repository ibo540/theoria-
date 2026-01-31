"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { RotateCw } from "lucide-react";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { COLOR_TRANSITION_CONFIG } from "@/lib/map-config";

// ============================================================================
// Constants
// ============================================================================

const ANIMATION = {
  fadeIn: 0.3,
  dotShow: 0.2,
  dotHide: 0.2,
  scaleDown: 0.2,
  bounce: 0.4,
  reset: 0.2,
  loaderRotationSpeed: 3.7,
  handoffDuration: 0.9,
  handoffRotationDuration: 0.5,
  handoffScaleDuration: 0.7,
  buttonHoverRotationSpeed: 8,
  buttonHoverRotationReset: 0.6,
} as const;

const CURSOR = {
  defaultScale: 1,
  clickedScale: 0.85,
  trailingEasing: 0.1,
  loaderScale: 1.5,
  size: 72,
} as const;

const EASING = {
  power2Out: "power2.out",
  power3Out: "power3.out",
  backOut: "back.out(1.2)",
} as const;

// ============================================================================
// Utility Helpers
// ============================================================================

const isButtonElement = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof Element)) return false;
  const target = element as HTMLElement;

  return (
    target.tagName === "BUTTON" ||
    target.closest("button") !== null ||
    target.classList.contains("map-country-pin") ||
    target.closest(".map-country-pin") !== null
  );
};

const isResizeHandleElement = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof Element)) return false;
  const target = element as HTMLElement;

  return (
    target.classList.contains("cursor-ew-resize") ||
    target.closest(".cursor-ew-resize") !== null
  );
};

const setCursorPosition = (cursor: HTMLElement, x: number, y: number): void => {
  gsap.set(cursor, {
    x,
    y,
    xPercent: -50,
    yPercent: -50,
  });
};

// ============================================================================
// Component
// ============================================================================

export default function CustomCursor() {
  // Store
  const activeTheory = useTheoryStore((state) => state.activeTheory);
  const getCurrentTheoryColor = useTheoryStore(
    (state) => state.getCurrentTheoryColor
  );

  // DOM refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorInnerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const resizeIconRef = useRef<HTMLDivElement>(null);
  const rotateIconRef = useRef<HTMLDivElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);

  // State refs
  const mousePosition = useRef({ x: 0, y: 0 });
  const cursorPosition = useRef({ x: 0, y: 0 });
  const isVisible = useRef(false);
  const isMouseDown = useRef(false); // left mouse
  const isLoaderActive = useRef(true);
  const isTransitioning = useRef(false);
  const isHoveringButton = useRef(false);
  const isHoveringResize = useRef(false);
  const isRightClickActive = useRef(false);

  // Animation refs
  const rotationTweenRef = useRef<gsap.core.Tween | null>(null);
  const buttonHoverRotationRef = useRef<gsap.core.Tween | null>(null);
  const rotationResetRef = useRef<gsap.core.Tween | null>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // ========================================================================
  // Theory Color Effect
  // ========================================================================
  useEffect(() => {
    const svgPath = svgPathRef.current;
    const dot = dotRef.current;
    const resizeIcon = resizeIconRef.current;
    const rotateIcon = rotateIconRef.current;

    if (!svgPath || !dot) return;

    const theoryColor = getCurrentTheoryColor();
    const defaultColor = "#ffe4be";
    const targetColor = theoryColor || defaultColor;

    gsap.to(svgPath, {
      fill: targetColor,
      duration: COLOR_TRANSITION_CONFIG.duration,
      ease: COLOR_TRANSITION_CONFIG.ease,
    });

    gsap.to(dot, {
      backgroundColor: targetColor,
      duration: COLOR_TRANSITION_CONFIG.duration,
      ease: COLOR_TRANSITION_CONFIG.ease,
    });

    if (resizeIcon) {
      const arrows = resizeIcon.querySelectorAll("path");
      arrows.forEach((arrow) => {
        gsap.to(arrow, {
          stroke: targetColor,
          duration: COLOR_TRANSITION_CONFIG.duration,
          ease: COLOR_TRANSITION_CONFIG.ease,
        });
      });
    }

    if (rotateIcon) {
      gsap.to(rotateIcon, {
        color: targetColor,
        duration: COLOR_TRANSITION_CONFIG.duration,
        ease: COLOR_TRANSITION_CONFIG.ease,
      });
    }
  }, [activeTheory, getCurrentTheoryColor]);

  // ========================================================================
  // Main Logic
  // ========================================================================
  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorInner = cursorInnerRef.current;
    const dot = dotRef.current;

    if (!cursor || !cursorInner || !dot) return;

    const resizeIcon = resizeIconRef.current;
    const rotateIcon = rotateIconRef.current;

    // ---------------------- Init ----------------------
    const initializeCursor = () => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      cursorPosition.current = { x: centerX, y: centerY };
      mousePosition.current = { x: centerX, y: centerY };

      setCursorPosition(cursor, centerX, centerY);
      gsap.set(cursor, { opacity: 1 });

      gsap.set(cursorInner, {
        scale: CURSOR.loaderScale,
        transformOrigin: "center center",
      });

      gsap.set(dot, { scale: 0, opacity: 0 });

      if (resizeIcon) gsap.set(resizeIcon, { scale: 0, opacity: 0 });
      if (rotateIcon) gsap.set(rotateIcon, { scale: 0, opacity: 0 });
    };

    initializeCursor();

    // ---------------------- Rotation helpers (for loader / hover only) ----------------------
    const startLoaderRotation = () => {
      rotationTweenRef.current?.kill();
      rotationTweenRef.current = gsap.to(cursorInner, {
        rotation: 360,
        duration: ANIMATION.loaderRotationSpeed,
        ease: "none",
        repeat: -1,
      });
    };

    const startButtonHoverRotation = () => {
      if (
        isLoaderActive.current ||
        isTransitioning.current ||
        isMouseDown.current ||
        isRightClickActive.current
      )
        return;

      const currentRotation =
        (gsap.getProperty(cursorInner, "rotation") as number) || 0;

      buttonHoverRotationRef.current?.kill();
      buttonHoverRotationRef.current = gsap.to(cursorInner, {
        rotation: currentRotation + 360,
        duration: ANIMATION.buttonHoverRotationSpeed,
        ease: "none",
        repeat: -1,
      });
    };

    const stopButtonHoverRotation = () => {
      buttonHoverRotationRef.current?.kill();
      buttonHoverRotationRef.current = null;

      if (isLoaderActive.current || isTransitioning.current) return;

      rotationResetRef.current?.kill();

      const currentRotation =
        (gsap.getProperty(cursorInner, "rotation") as number) || 0;
      const normalizedRotation = ((currentRotation % 360) + 360) % 360;

      if (normalizedRotation < 1 && normalizedRotation > -1) {
        gsap.set(cursorInner, { rotation: 0 });
        return;
      }

      let targetRotation = 0;
      if (normalizedRotation > 180) {
        targetRotation = currentRotation + (360 - normalizedRotation);
      } else {
        targetRotation = currentRotation - normalizedRotation;
      }

      rotationResetRef.current = gsap.to(cursorInner, {
        rotation: targetRotation,
        duration: ANIMATION.buttonHoverRotationReset,
        ease: EASING.power2Out,
        onComplete: () => {
          gsap.set(cursorInner, { rotation: 0 });
          rotationResetRef.current = null;
        },
      });
    };

    startLoaderRotation();

    // ---------------------- Dot / Icons helpers ----------------------
    const showDot = () => {
      if (
        isLoaderActive.current ||
        isTransitioning.current ||
        isRightClickActive.current
      )
        return;
      if (!dot) return;

      gsap.to(dot, {
        scale: 1,
        opacity: 1,
        duration: ANIMATION.dotShow,
        ease: EASING.power2Out,
        overwrite: "auto",
      });

      // hide others
      if (resizeIcon) {
        gsap.to(resizeIcon, {
          scale: 0,
          opacity: 0,
          duration: ANIMATION.dotHide,
          ease: EASING.power2Out,
          overwrite: "auto",
        });
      }
      if (rotateIcon) {
        gsap.to(rotateIcon, {
          scale: 0,
          opacity: 0,
          duration: ANIMATION.dotHide,
          ease: EASING.power2Out,
          overwrite: "auto",
        });
      }

      startButtonHoverRotation();
    };

    const hideDot = () => {
      if (!dot) return;
      if (isMouseDown.current && !isRightClickActive.current) return;

      gsap.to(dot, {
        scale: 0,
        opacity: 0,
        duration: ANIMATION.dotHide,
        ease: EASING.power2Out,
        overwrite: "auto",
      });
      stopButtonHoverRotation();
    };

    const showResizeIcon = () => {
      if (
        isLoaderActive.current ||
        isTransitioning.current ||
        isRightClickActive.current
      )
        return;
      if (!resizeIcon) return;

      hideDot();
      if (rotateIcon) {
        gsap.to(rotateIcon, {
          scale: 0,
          opacity: 0,
          duration: ANIMATION.dotHide,
          ease: EASING.power2Out,
          overwrite: "auto",
        });
      }

      gsap.to(resizeIcon, {
        scale: 1,
        opacity: 1,
        duration: ANIMATION.dotShow,
        ease: EASING.power2Out,
        overwrite: "auto",
      });
    };

    const hideResizeIcon = () => {
      if (!resizeIcon) return;
      if (isMouseDown.current && !isRightClickActive.current) return;

      gsap.to(resizeIcon, {
        scale: 0,
        opacity: 0,
        duration: ANIMATION.dotHide,
        ease: EASING.power2Out,
        overwrite: "auto",
      });
    };

    // Right click rotation ICON ONLY (no rotation animation)
    const showRotateIcon = () => {
      if (isLoaderActive.current || isTransitioning.current) return;
      if (!rotateIcon) return;

      isRightClickActive.current = true;

      hideDot();
      hideResizeIcon();

      gsap.to(rotateIcon, {
        scale: 1,
        opacity: 1,
        duration: ANIMATION.dotShow,
        ease: EASING.power2Out,
        overwrite: "auto",
      });

      // NOTE: no special cursorInner rotation here
    };

    const hideRotateIcon = () => {
      if (!rotateIcon) return;

      isRightClickActive.current = false;

      gsap.to(rotateIcon, {
        scale: 0,
        opacity: 0,
        duration: ANIMATION.dotHide,
        ease: EASING.power2Out,
        overwrite: "auto",
      });

      // rotation logic is handled only by hover/loader
      stopButtonHoverRotation();
    };

    // ---------------------- Loader → Normal transition ----------------------
    const transitionToNormalMode = () => {
      rotationTweenRef.current?.kill();
      rotationTweenRef.current = null;
      isTransitioning.current = true;

      const timeline = gsap.timeline();
      transitionTimelineRef.current = timeline;

      const currentRotation =
        (gsap.getProperty(cursorInner, "rotation") as number) || 0;
      const targetRotation = Math.ceil(currentRotation / 360) * 360;

      timeline.to(cursorInner, {
        rotation: targetRotation,
        duration: ANIMATION.handoffRotationDuration,
        ease: EASING.power2Out,
      });

      timeline.set(
        cursorInner,
        { rotation: 0 },
        ANIMATION.handoffRotationDuration
      );

      timeline.to(
        cursorInner,
        {
          scale: CURSOR.defaultScale,
          duration: ANIMATION.handoffScaleDuration,
          ease: EASING.power3Out,
        },
        0.1
      );

      const startX = cursorPosition.current.x;
      const startY = cursorPosition.current.y;
      const transitionStartTime = Date.now();

      const updateTransitionPosition = () => {
        if (!isTransitioning.current) return;

        const elapsed = (Date.now() - transitionStartTime) / 1000;
        const progress = Math.min(elapsed / ANIMATION.handoffDuration, 1);
        const eased = gsap.parseEase(EASING.power3Out)(progress);

        const currentX = mousePosition.current.x;
        const currentY = mousePosition.current.y;

        const x = startX + (currentX - startX) * eased;
        const y = startY + (currentY - startY) * eased;

        setCursorPosition(cursor, x, y);

        if (progress < 1) requestAnimationFrame(updateTransitionPosition);
      };

      updateTransitionPosition();

      timeline.call(
        () => {
          cursorPosition.current = { ...mousePosition.current };
          isVisible.current = true;
          isTransitioning.current = false;
          transitionTimelineRef.current = null;
        },
        [],
        ANIMATION.handoffDuration
      );
    };

    const completeTransitionImmediately = () => {
      transitionTimelineRef.current?.kill();
      transitionTimelineRef.current = null;
      isTransitioning.current = false;

      cursorPosition.current = { ...mousePosition.current };
      setCursorPosition(
        cursor,
        cursorPosition.current.x,
        cursorPosition.current.y
      );

      gsap.set(cursorInner, {
        rotation: 0,
        scale: CURSOR.defaultScale,
      });

      isVisible.current = true;
    };

    // ---------------------- Custom app events ----------------------
    const handleCurtainsOpen = () => {
      isLoaderActive.current = false;
      transitionToNormalMode();
    };

    const handleLoaderComplete = () => {
      // reserved
    };

    // ---------------------- Mouse events ----------------------
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      if (isLoaderActive.current) return;

      const hoveringResize = isResizeHandleElement(e.target);
      const hoveringButton = isButtonElement(e.target);

      // Resize hover
      if (hoveringResize && !isHoveringResize.current) {
        isHoveringResize.current = true;
        isHoveringButton.current = false;
        hideDot();
        if (!isRightClickActive.current) showResizeIcon();
      } else if (!hoveringResize && isHoveringResize.current) {
        isHoveringResize.current = false;
        hideResizeIcon();
      }

      // Button hover
      if (!hoveringResize) {
        if (hoveringButton && !isHoveringButton.current) {
          isHoveringButton.current = true;
          if (!isRightClickActive.current) showDot();
        } else if (!hoveringButton && isHoveringButton.current) {
          isHoveringButton.current = false;
          hideDot();
        }
      }

      if (isMouseDown.current) {
        cursorPosition.current = { x: e.clientX, y: e.clientY };
        setCursorPosition(cursor, e.clientX, e.clientY);
        return;
      }

      if (!isVisible.current) {
        isVisible.current = true;
        gsap.to(cursor, {
          opacity: 1,
          duration: ANIMATION.fadeIn,
          ease: EASING.power2Out,
          overwrite: "auto",
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isLoaderActive.current) return;

      // LEFT CLICK → show dot as before
      if (e.button === 0) {
        if (isTransitioning.current) completeTransitionImmediately();

        isMouseDown.current = true;
        stopButtonHoverRotation();
        rotationResetRef.current?.kill();
        rotationResetRef.current = null;
        gsap.killTweensOf(cursorInner);

        cursorPosition.current = { ...mousePosition.current };
        setCursorPosition(
          cursor,
          cursorPosition.current.x,
          cursorPosition.current.y
        );

        if (isHoveringResize.current && !isRightClickActive.current) {
          showResizeIcon();
        } else if (isHoveringButton.current && !isRightClickActive.current) {
          showDot();
        } else if (!isRightClickActive.current) {
          // Show dot on canvas click
          showDot();
        }

        gsap.to(cursorInner, {
          scale: CURSOR.clickedScale,
          duration: ANIMATION.scaleDown,
          ease: EASING.power2Out,
          overwrite: "auto",
        });
      }

      // RIGHT CLICK → just show rotation icon (no rotation animation)
      if (e.button === 2) {
        e.preventDefault();
        if (isLoaderActive.current || isTransitioning.current) return;
        showRotateIcon();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isLoaderActive.current || isTransitioning.current) return;

      // LEFT UP
      if (e.button === 0) {
        isMouseDown.current = false;

        if (!isRightClickActive.current) {
          if (!isHoveringButton.current) hideDot();
          if (!isHoveringResize.current) hideResizeIcon();

          if (!isHoveringButton.current && !isHoveringResize.current) {
            stopButtonHoverRotation();
          } else if (isHoveringButton.current) {
            startButtonHoverRotation();
          }
        }

        gsap.to(cursorInner, {
          scale: CURSOR.defaultScale,
          duration: ANIMATION.bounce,
          ease: EASING.backOut,
          overwrite: "auto",
        });
      }

      // RIGHT UP → hide rotation icon
      if (e.button === 2) {
        hideRotateIcon();

        // restore dot/resize if hovering
        if (isHoveringResize.current) {
          showResizeIcon();
        } else if (isHoveringButton.current) {
          showDot();
        }
      }
    };

    const handleMouseLeave = () => {
      isVisible.current = false;
      isMouseDown.current = false;
      isHoveringButton.current = false;
      isHoveringResize.current = false;
      isRightClickActive.current = false;

      stopButtonHoverRotation();

      gsap.to(cursor, {
        opacity: 0,
        duration: ANIMATION.fadeIn,
        ease: EASING.power2Out,
        overwrite: "auto",
      });

      hideDot();
      hideResizeIcon();
      hideRotateIcon();

      gsap.to(cursorInner, {
        scale: CURSOR.defaultScale,
        duration: ANIMATION.reset,
        ease: EASING.power2Out,
        overwrite: "auto",
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // ---------------------- Trailing loop ----------------------
    const updateCursor = () => {
      if (
        isLoaderActive.current ||
        isMouseDown.current ||
        isTransitioning.current
      )
        return;

      const dx = mousePosition.current.x - cursorPosition.current.x;
      const dy = mousePosition.current.y - cursorPosition.current.y;

      cursorPosition.current.x += dx * CURSOR.trailingEasing;
      cursorPosition.current.y += dy * CURSOR.trailingEasing;

      setCursorPosition(
        cursor,
        cursorPosition.current.x,
        cursorPosition.current.y
      );
    };

    // ---------------------- Listeners ----------------------
    gsap.ticker.add(updateCursor);
    window.addEventListener("curtains-open", handleCurtainsOpen);
    window.addEventListener("loader-complete", handleLoaderComplete);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Cleanup
    return () => {
      gsap.ticker.remove(updateCursor);
      window.removeEventListener("curtains-open", handleCurtainsOpen);
      window.removeEventListener("loader-complete", handleLoaderComplete);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mouseleave", handleMouseLeave);

      rotationTweenRef.current?.kill();
      buttonHoverRotationRef.current?.kill();
      rotationResetRef.current?.kill();
      transitionTimelineRef.current?.kill();
    };
  }, []);

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[99999]"
      style={{
        willChange: "transform",
        left: 0,
        top: 0,
        mixBlendMode: "difference",
      }}
    >
      <div
        ref={cursorInnerRef}
        className="relative"
        style={{
          width: `${CURSOR.size}px`,
          height: `${CURSOR.size}px`,
          willChange: "transform",
        }}
      >
        {/* Outer circular frame */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{ willChange: "fill" }}
        >
          <path
            ref={svgPathRef}
            fill="#ffe4be"
            d="M100,0C44.9,0,0,44.9,0,100s44.9,100,100,100,100-44.9,100-100S155.1,0,100,0ZM109.7,188.3l-9.9-9.9-9.9,9.9c-40.4-4.5-72.5-36.1-78-76.1l12.2-12.2-12.2-12.2C17.3,49.3,47.2,18.6,85.4,12.3l14.6,14.6,14.6-14.6c38.2,6.3,68.1,37,73.4,75.5l-12.2,12.2,12.2,12.2c-5.5,40.1-37.8,71.7-78.3,76.1Z"
            style={{ transition: "fill 0.8s ease" }}
          />
        </svg>

        {/* Center dot (normal click / hover) */}
        <div
          ref={dotRef}
          className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffe4be]"
          style={{
            willChange: "transform, opacity, background-color",
            transition: "background-color 0.8s ease",
          }}
        />

        {/* Resize icon (EW arrows) */}
        <div
          ref={resizeIconRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            willChange: "transform, opacity",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 12L5 8M1 12L5 16M1 12H3"
              stroke="#ffe4be"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 0.8s ease" }}
            />
            <path
              d="M23 12L19 8M23 12L19 16M23 12H21"
              stroke="#ffe4be"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 0.8s ease" }}
            />
          </svg>
        </div>

        {/* Rotation icon (right click, no animation) */}
        <div
          ref={rotateIconRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            willChange: "transform, opacity, color",
            width: 24,
            height: 24,
            color: "#ffe4be",
          }}
        >
          <RotateCw className="w-5 h-5 stroke-[1.8]" />
        </div>
      </div>
    </div>
  );
}
