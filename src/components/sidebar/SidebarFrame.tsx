"use client";

import React, { forwardRef } from "react";

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
}

export const SidebarFrame = forwardRef<HTMLElement, SidebarFrameProps>(
  ({ children, width, onResizeStart }, ref) => {
    return (
      <aside
        ref={ref}
        className="fixed"
        style={{
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: `${width}px`,
          height: "calc(70vh)",
          zIndex: -1,
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
