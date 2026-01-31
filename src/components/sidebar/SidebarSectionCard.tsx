"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import { SIDEBAR_TYPOGRAPHY } from "./typography";

interface SidebarSectionCardProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Simplified Accordion Section Card
 * 
 * Key Improvements:
 * - Uses CSS Grid for smooth height animation
 * - Single GSAP animation (no complex timelines)
 * - No flex property manipulation
 * - Allows scrolling during animation
 * - Proper cleanup with overwrite:"auto"
 */
export function SidebarSectionCard({
  id,
  title,
  icon,
  isExpanded,
  onClick,
  children,
}: SidebarSectionCardProps) {
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  // Simplified animation with proper cleanup
  useGSAP(() => {
    if (!contentWrapperRef.current || !innerContentRef.current || !chevronRef.current) return;

    const wrapper = contentWrapperRef.current;
    const inner = innerContentRef.current;
    const chevron = chevronRef.current;

    if (isExpanded) {
      // Get the natural height of the content
      const contentHeight = inner.scrollHeight;

      // Animate grid-template-rows for smooth height transition
      gsap.to(wrapper, {
        gridTemplateRows: `1fr`,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });

      // Fade in content
      gsap.to(inner, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      // Rotate chevron
      gsap.to(chevron, {
        rotation: 180,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    } else {
      // Collapse animation
      gsap.to(wrapper, {
        gridTemplateRows: `0fr`,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto",
      });

      // Fade out content
      gsap.to(inner, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "power2.in",
        overwrite: "auto",
      });

      // Rotate chevron back
      gsap.to(chevron, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto",
      });
    }
  }, [isExpanded]);

  return (
    <div
      className="border border-primary-gold/20 bg-black/30 backdrop-blur-sm transition-shadow duration-200"
      style={{
        boxShadow: isExpanded
          ? "0 4px 12px rgba(255, 228, 190, 0.1)"
          : "0 2px 6px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={onClick}
        className={`
          w-full flex items-center justify-between px-5 py-4
          transition-colors duration-200
          ${
            isExpanded
              ? "bg-primary-gold/10"
              : "hover:bg-primary-gold/5"
          }
        `}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-primary-gold/70 w-5 h-5 flex items-center justify-center">
              {icon}
            </span>
          )}
          <h3 className={`${SIDEBAR_TYPOGRAPHY.section.title} text-primary-gold/90`}>
            {title}
          </h3>
        </div>
        
        <ChevronDown
          ref={chevronRef}
          size={20}
          className="text-primary-gold/60 transition-transform"
          style={{ transformOrigin: "center" }}
        />
      </button>

      {/* Content - Using CSS Grid for smooth height animation */}
      <div
        ref={contentWrapperRef}
        className="grid overflow-hidden"
        style={{
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
          transition: isExpanded ? undefined : "grid-template-rows 0.3s ease-in",
        }}
      >
        <div className="overflow-y-auto overflow-x-hidden min-h-0">
          <div ref={innerContentRef} className="px-5 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
