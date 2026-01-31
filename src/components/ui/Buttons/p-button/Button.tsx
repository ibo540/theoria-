import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  borderStyle?: "three" | "four" | "five";
  variant?: "icon" | "text";
  blurred?: boolean;
}

interface BorderConfig {
  borderImageSource: string;
  borderImageSlice: string;
  borderImageWidth: string;
  border: string;
  inset: string;
  background: string;
  hoverBackground?: string;
}

type BorderConfigs = {
  [key in "three" | "four" | "five"]: BorderConfig;
};

// Unified border style configurations
const borderConfigs: Record<"text" | "icon", BorderConfigs> = {
  text: {
    three: {
      borderImageSource: "url('/assets/buttons/buttone-3.png')",
      borderImageSlice: "300 300 300 300",
      borderImageWidth: "25px",
      border: "10px solid transparent",
      inset: "0px",
      background:
        "radial-gradient(circle at center, rgba(255, 228, 190, 0.15) 0%, rgba(255, 228, 190, 0.05) 50%, transparent 100%)",
    },
    four: {
      borderImageSource: "url('/assets/buttons/button-4.png')",
      borderImageSlice: "300 300 300 300",
      borderImageWidth: "25px",
      border: "25px solid transparent",
      inset: "10px",
      background:
        "radial-gradient(circle at center, rgba(255, 228, 190, 0.15) 0%, rgba(255, 228, 190, 0.05) 50%, transparent 100%)",
    },
    five: {
      borderImageSource: "url('/assets/buttons/button-5.png')",
      borderImageSlice: "300 300 300 300",
      borderImageWidth: "25px",
      border: "0px solid transparent",
      inset: "10px",
      background:
        "radial-gradient(circle at center, rgba(255, 228, 190, 0.15) 0%, rgba(255, 228, 190, 0.05) 50%, transparent 100%)",
    },
  },
  icon: {
    three: {
      borderImageSource: "url('/assets/buttons/buttone-3.png')",
      borderImageSlice: "300 300 300 300",
      borderImageWidth: "25px",
      border: "5px solid transparent",
      inset: "5px",
      background: "transparent",
      hoverBackground: "rgba(255, 228, 190, 0.1)",
    },
    four: {
      borderImageSource: "url('/assets/buttons/button-4.png')",
      borderImageSlice: "300 300 300 300",
      borderImageWidth: "25px",
      border: "5px solid transparent",
      inset: "5px",
      background: "transparent",
      hoverBackground: "rgba(255, 228, 190, 0.1)",
    },
    five: {
      borderImageSource: "url('/assets/buttons/button-5.png')",
      borderImageSlice: "300 300 300 300",
      borderImageWidth: "25px",
      border: "5px solid transparent",
      inset: "5px",
      background: "transparent",
      hoverBackground: "rgba(255, 228, 190, 0.1)",
    },
  },
};

export default function Button({
  children,
  className,
  style,
  borderStyle = "three",
  variant = "text",
  blurred = false,
  ...props
}: ButtonProps) {
  const isIcon = variant === "icon";
  const isFive = borderStyle === "five";
  const config = borderConfigs[variant][borderStyle];

  const buttonStyles: CSSProperties = {
    border: config.border,
    borderImageSource: config.borderImageSource,
    borderImageSlice: config.borderImageSlice,
    borderImageRepeat: "round",
    borderImageWidth: config.borderImageWidth,
    backgroundClip: "padding-box",
    boxSizing: "border-box",
  };

  const insetStyle: CSSProperties = {
    top: config.inset,
    left: config.inset,
    right: config.inset,
    bottom: config.inset,
  };

  return (
    <button
      className={cn(
        "group relative text-2xl",
        isIcon ? "h-16 w-16" : "px-12 py-4",
        className
      )}
      style={{ ...buttonStyles, ...style }}
      {...props}
    >
      {/* Base background layer */}
      <div
        className={cn(
          "absolute transition-opacity ease-in-out backdrop-blur-xl",
          isFive ? "duration-700" : "duration-200",
          isIcon && "group-hover:opacity-0"
        )}
        style={{
          ...insetStyle,
          backgroundColor: isIcon ? "rgba(0, 0, 0, 0.3)" : undefined,
        }}
      />

      {/* Hover gradient layer (icon variant only) */}
      {isIcon && config.hoverBackground && !blurred && (
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity ease-in-out duration-300"
          style={{ ...insetStyle, background: config.hoverBackground }}
        />
      )}

      {/* Blurred hover effect */}
      {blurred && (
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity ease-in-out duration-300 backdrop-blur-xl"
          style={insetStyle}
        />
      )}

      {/* Gold fill hover effect (borderStyle "five" only) */}
      {isFive && (
        <div
          className={cn(
            "absolute opacity-0 group-hover:opacity-100 transition-opacity ease-in-out duration-700",
            !isIcon && "backdrop-blur-md"
          )}
          style={{ ...insetStyle, background: "#ffe4be" }}
        />
      )}

      {/* Content */}
      <div
        className={cn(
          "relative z-10 transition-colors ease-in-out text-primary-gold",
          isFive ? "duration-700 group-hover:text-[#0f1114]" : "duration-200",
          isIcon && "flex items-center justify-center h-full"
        )}
      >
        {children}
      </div>
    </button>
  );
}
