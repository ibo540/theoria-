"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import Button from "@/components/ui/Buttons/p-button/Button";
import ContributorsTable from "./ContributorsTable";

const COLORS = {
  background: "var(--dark)",
  gold: "var(--primary-gold)",
} as const;

const ANIMATION = {
  curtainDuration: 1.2,
  contentFadeInDuration: 0.8,
  contentFadeInDelay: 0.3,
} as const;

interface CreditsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Credits({ isOpen, onOpenChange }: CreditsProps) {
  const topOverlayRef = useRef<HTMLDivElement>(null);
  const bottomOverlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (
      !topOverlayRef.current ||
      !bottomOverlayRef.current ||
      !contentRef.current
    )
      return;

    // Initialize - curtains start from top and bottom (opposite of loader)
    gsap.set(topOverlayRef.current, { yPercent: -100 });
    gsap.set(bottomOverlayRef.current, { yPercent: 100 });
    gsap.set(contentRef.current, { opacity: 0, y: 50 });

    const timeline = gsap.timeline();

    // Curtains close (come together from top and bottom)
    timeline.to(
      topOverlayRef.current,
      {
        yPercent: 0,
        duration: ANIMATION.curtainDuration,
        ease: "power4.inOut",
      },
      0
    );

    timeline.to(
      bottomOverlayRef.current,
      {
        yPercent: 0,
        duration: ANIMATION.curtainDuration,
        ease: "power4.inOut",
      },
      0
    );

    // Content fades in after curtains close
    timeline.to(
      contentRef.current,
      {
        opacity: 1,
        y: 0,
        duration: ANIMATION.contentFadeInDuration,
        ease: "power3.out",
      },
      ANIMATION.curtainDuration + ANIMATION.contentFadeInDelay
    );

    return () => {
      timeline.kill();
    };
  }, [isOpen]);

  const handleClose = () => {
    if (
      !topOverlayRef.current ||
      !bottomOverlayRef.current ||
      !contentRef.current
    )
      return;

    const timeline = gsap.timeline({
      onComplete: () => {
        onOpenChange(false);
      },
    });

    // Content fades out first
    timeline.to(
      contentRef.current,
      {
        opacity: 0,
        y: 50,
        duration: ANIMATION.contentFadeInDuration * 0.6,
        ease: "power2.in",
      },
      0
    );

    // Then curtains open (reverse of closing)
    timeline.to(
      topOverlayRef.current,
      {
        yPercent: -100,
        duration: ANIMATION.curtainDuration,
        ease: "power4.inOut",
      },
      ANIMATION.contentFadeInDuration * 0.4
    );

    timeline.to(
      bottomOverlayRef.current,
      {
        yPercent: 100,
        duration: ANIMATION.curtainDuration,
        ease: "power4.inOut",
      },
      ANIMATION.contentFadeInDuration * 0.4
    );
  };

  return (
    <>
      {/* Credits Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[99998] pointer-events-auto overflow-hidden">
          {/* Top Curtain */}
          <div
            ref={topOverlayRef}
            className="absolute top-0 left-0 right-0"
            style={{
              height: "50vh",
              backgroundColor: COLORS.background,
              willChange: "transform",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
          {/* Bottom Curtain */}
          <div
            ref={bottomOverlayRef}
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "50vh",
              backgroundColor: COLORS.background,
              willChange: "transform",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
          {/* Content - Scrollable */}
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{ zIndex: 2 }}
          >
            <div
              className="flex items-start justify-center min-h-full py-16"
            >
              <div
                ref={contentRef}
                className="w-full max-w-6xl px-16 py-16 relative"
                style={{
                  fontFamily: "var(--font-forum)",
                  color: COLORS.gold,
                  willChange: "transform, opacity",
                }}
              >
              {/* Close Button - Top Right - Fixed */}
              <div className="fixed top-8 right-8 z-50">
                <Button
                  onClick={handleClose}
                  borderStyle="five"
                  variant="icon"
                  type="button"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Founders */}
              <div className="mb-12 flex gap-12 items-start">
                <div className="flex flex-col items-start gap-1">
                  <p
                    className="text-4xl font-light"
                    style={{
                      letterSpacing: "0.02em",
                      opacity: 0.95,
                    }}
                  >
                    Ibrahim Al ksibati
                  </p>
                  <p
                    className="text-lg font-light"
                    style={{
                      letterSpacing: "0.02em",
                      opacity: 0.7,
                    }}
                  >
                    Founder
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p
                    className="text-4xl font-light"
                    style={{
                      letterSpacing: "0.02em",
                      opacity: 0.95,
                    }}
                  >
                    Nur Parildar
                  </p>
                  <p
                    className="text-lg font-light"
                    style={{
                      letterSpacing: "0.02em",
                      opacity: 0.7,
                    }}
                  >
                    Co-Founder
                  </p>
                </div>
              </div>

              {/* Contributors Table */}
              <div className="mb-12">
                <ContributorsTable />
              </div>

              {/* Copyright Notice */}
              <div className="mb-12">
                <h1
                  className="text-3xl font-light mb-8"
                  style={{
                    letterSpacing: "0.05em",
                    lineHeight: "1.2",
                  }}
                >
                  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
                </h1>
              </div>

              <div className="space-y-6 mb-8">
                <p
                  className="text-lg font-light"
                  style={{
                    letterSpacing: "0.02em",
                    opacity: 0.9,
                    lineHeight: "1.8",
                  }}
                >
                  © 2025 Theoria. All Rights Reserved.
                </p>

                <p
                  className="text-base font-light"
                  style={{
                    letterSpacing: "0.02em",
                    opacity: 0.85,
                    lineHeight: "1.8",
                  }}
                >
                  Theoria, this educational platform, including but not limited
                  to its concept, design, methodology, interactive features,
                  database structure, theoretical framework integration, and all
                  associated code and content, is the original intellectual
                  property of Ibrahim Al ksibati.
                </p>

                <p
                  className="text-base font-light"
                  style={{
                    letterSpacing: "0.02em",
                    opacity: 0.85,
                    lineHeight: "1.8",
                  }}
                >
                  <strong>LEGAL WARNING:</strong> Unauthorized reproduction,
                  distribution, modification, or commercial use of Theoria or
                  any of its components without explicit written permission from
                  Ibrahim Al ksibati is strictly prohibited and will result in
                  legal action including but not limited to claims for copyright
                  infringement, intellectual property theft, and damages under
                  applicable international and domestic law.
                </p>

                <p
                  className="text-base font-light"
                  style={{
                    letterSpacing: "0.02em",
                    opacity: 0.85,
                    lineHeight: "1.8",
                  }}
                >
                  For licensing inquiries, permissions, or collaborations,
                  please contact Ibrahim Al ksibati directly.
                </p>
              </div>

              <div
                className="mt-12 pt-8 border-t"
                style={{ borderColor: `${COLORS.gold}40` }}
              >
                <h2
                  className="text-2xl font-light mb-4"
                  style={{
                    letterSpacing: "0.03em",
                    opacity: 0.9,
                  }}
                >
                  Theoria - Understanding International Relations Through Theory
                </h2>
                <p
                  className="text-lg font-light"
                  style={{
                    letterSpacing: "0.02em",
                    opacity: 0.75,
                    lineHeight: "1.6",
                  }}
                >
                  Built for students and professionals in Political Science and
                  International Relations
                </p>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
