"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { TheoryType } from "@/stores/useTheoryStore";
import { THEORY_COLORS, THEORY_LABELS } from "@/lib/theoryTokens";

interface TheoryButtonProps {
  theory: TheoryType;
  onClick?: () => void;
  isActive?: boolean;
  isPrimary?: boolean; // In comparison mode, this is the primary theory
  isSecondary?: boolean; // In comparison mode, this is the secondary theory
  hasActiveTheory?: boolean;
  containerRefCallback?: (el: HTMLElement | null) => void;
}

// Animation constants - synchronized with TheorySidebar
const ANIMATION_DURATION = 0.7;
const ANIMATION_EASE = "expo.out";
const COLOR_ANIMATION_DURATION = 0.5;
const GOLD_COLOR = "var(--primary-gold)";
const MUTED_GOLD = "#a6947c"; // Muted gold for unselected buttons (darker, same hue/saturation)
const DARK_BLACK = "#181818"; // Consistent dark background for all buttons

// Scale constants
const SCALE_NONE_SELECTED = 1.0;
const SCALE_ACTIVE = 1.1;
const SCALE_INACTIVE = 0.95;

export default function TheoryButton({
  theory,
  onClick,
  isActive = false,
  isPrimary = false,
  isSecondary = false,
  hasActiveTheory = false,
  containerRefCallback,
}: TheoryButtonProps) {
  const theoryColor = THEORY_COLORS[theory];

  // Construct SVG path based on theory type
  const svgPath = `/assets/custom/theory-icons/${theory}.svg`;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  // Load SVG content for inline rendering
  useEffect(() => {
    fetch(svgPath)
      .then((res) => res.text())
      .then((svg) => {
        // Inject CSS to override fill colors for all possible classes
        const styledSvg = svg.replace(
          "<defs>",
          `<defs><style>
            .cls-1 { fill: var(--theory-dark-color) !important; }
            .cls-2 { fill: var(--theory-color) !important; }
            .cls-3 { fill: var(--theory-color) !important; }
          </style>`
        );
        setSvgContent(styledSvg);
      })
      .catch((err) => console.error("Failed to load SVG:", err));
  }, [svgPath]);

  // Compute visual state
  const visualState = useMemo(() => {
    // Determine icon color
    let iconColor: string;
    if (isPrimary || isActive) {
      // Primary or active: use theory color
      iconColor = theoryColor;
    } else if (isSecondary) {
      // Secondary in comparison: use theory color
      iconColor = theoryColor;
    } else if (isHovered) {
      // Hovered but not active: use theory color
      iconColor = theoryColor;
    } else if (hasActiveTheory) {
      // Another theory is active: use muted gold
      iconColor = MUTED_GOLD;
    } else {
      // No theory selected: use bright gold
      iconColor = GOLD_COLOR;
    }

    // Scale: larger when active/primary/secondary, smaller when another is active, normal otherwise
    let scale = SCALE_NONE_SELECTED;
    if (hasActiveTheory) {
      scale = (isActive || isPrimary || isSecondary) ? SCALE_ACTIVE : SCALE_INACTIVE;
    }

    return {
      color: iconColor,
      scale: scale,
      isPrimary,
      isSecondary,
    };
  }, [hasActiveTheory, isActive, isPrimary, isSecondary, isHovered, theoryColor]);

  // Animate state changes - synchronized timeline
  useEffect(() => {
    if (!buttonRef.current || !svgWrapperRef.current) return;

    const { color, scale } = visualState;

    const tl = gsap.timeline({
      defaults: { ease: ANIMATION_EASE },
    });

    // Animate scale and color together for smooth transition
    tl.to(
      buttonRef.current,
      {
        scale,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        force3D: true,
        transformOrigin: "center center",
        overwrite: "auto",
      },
      0
    );

    // Color animation slightly faster for snappier feel
    tl.to(
      svgWrapperRef.current,
      {
        "--theory-color": color,
        duration: COLOR_ANIMATION_DURATION,
        ease: "power2.out",
        overwrite: "auto",
      },
      0
    );

    return () => {
      tl.kill();
    };
  }, [visualState]);

  // Hover handlers - show theory color on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const { color: initialColor } = visualState;

  const theoryLabel = THEORY_LABELS[theory];

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (containerRefCallback) containerRefCallback(el);
      }}
      className="flex flex-col items-center"
    >
      <button
        ref={buttonRef}
        onClick={onClick}
        aria-label={theory}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
        style={{ width: "104px", height: "104px" }}
      >
        <div
          ref={svgWrapperRef}
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          style={
            {
              "--theory-color": initialColor,
              "--theory-dark-color": DARK_BLACK,
              transform: "translateY(20px)", // Move icon down significantly to avoid overlap with name
            } as React.CSSProperties & {
              "--theory-color": string;
              "--theory-dark-color": string;
            }
          }
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        {/* Theory name label inside icon at the top */}
        <span
          className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-center whitespace-nowrap transition-colors duration-300 pointer-events-none z-10"
          style={{
            color: (isActive || isPrimary || isSecondary) ? initialColor : isHovered ? theoryColor : MUTED_GOLD,
            opacity: (isActive || isPrimary || isSecondary) ? 1 : hasActiveTheory ? 0.8 : 0.9,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.5)",
          }}
        >
          {theoryLabel}
          {isPrimary && " (1)"}
          {isSecondary && " (2)"}
        </span>
      </button>
    </div>
  );
}
