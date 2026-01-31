import React from "react";
import Image from "next/image";

export type DividerType = "eight" | "four" | "line";

interface DividerProps {
  type?: DividerType;
  className?: string;
  style?: React.CSSProperties;
  maxWidth?: string | number;
  maxHeight?: string | number;
}

export default function Divider({
  type = "line",
  className = "",
  style,
  maxWidth = "100%",
  maxHeight = 12,
}: DividerProps) {
  // Simple line divider (gradient line)
  if (type === "line") {
    return (
      <div
        className={`h-px bg-gradient-to-r from-primary-gold/0 via-primary-gold/30 to-primary-gold/0 ${className}`}
        style={style}
      />
    );
  }

  // Image-based dividers (Divider 8 or Divider 4)
  const imageSrc =
    type === "eight"
      ? "/assets/dividers/Divider_08.png"
      : "/assets/dividers/Divider_04.png";
  const defaultHeight = type === "eight" ? 50 : 50;

  return (
    <div
      className={`flex justify-center ${className}`}
      style={{ width: "100%", ...style }}
    >
      <div
        style={{
          maxWidth,
          width: "100%",
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }}
      >
        <Image
          src={imageSrc}
          alt="Divider"
          width={800}
          height={defaultHeight}
          className="w-full h-auto"
          style={{
            objectFit: "contain",
            display: "block",
            maxHeight:
              typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          }}
          unoptimized
        />
      </div>
    </div>
  );
}
