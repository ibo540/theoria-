"use client";

import React from "react";
import Image from "next/image";

interface CompassButtonProps {
  bearing: number; // Map bearing in degrees
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function CompassButton({
  bearing,
  onClick,
  className,
  style,
}: CompassButtonProps) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        width: "60px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Short transition to smooth micro-stutters while staying responsive
        // This allows the compass to sync smoothly with map animations via continuous rotate events
        transition: "transform 0.1s linear",
        transform: `rotate(${-bearing}deg)`, // Negative to rotate opposite of map
        ...style,
      }}
      aria-label="Reset to North"
      title="Reset to North"
    >
      <Image
        src="/assets/custom/N-Star.png"
        alt="North Compass"
        width={60}
        height={60}
        unoptimized
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}