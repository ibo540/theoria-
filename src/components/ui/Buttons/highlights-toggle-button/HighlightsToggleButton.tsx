"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HighlightsToggleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isVisible: boolean;
  onToggle: () => void;
}

const buttonStyles: React.CSSProperties = {
  border: "5px solid transparent",
  borderImageSource: "url('/assets/buttons/button.png')",
  borderImageSlice: "72 72 72 72",
  borderImageRepeat: "round",
  borderImageWidth: "20px",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export default function HighlightsToggleButton({
  isVisible,
  onToggle,
  className,
  style,
  ...props
}: HighlightsToggleButtonProps) {
  const Icon = isVisible ? Eye : EyeOff;

  return (
    <button
      onClick={onToggle}
      className={cn(
        "px-12 py-4 transition-all text-xl text-primary-gold duration-200 hover:bg-primary-gold/10 flex items-center gap-2 justify-center",
        className
      )}
      style={{ ...buttonStyles, ...style }}
      aria-label={isVisible ? "Hide Connections" : "Show Connections"}
      title={isVisible ? "Hide Connections" : "Show Connections"}
      {...props}
    >
      <Icon
        size={20}
        className="transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0.5 }}
      />
      <span>{isVisible ? "Hide" : "Show"}</span>
    </button>
  );
}
