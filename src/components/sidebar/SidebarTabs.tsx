"use client";

import React from "react";
import { SidebarTab, SidebarTabId } from "./types";
import { SIDEBAR_TYPOGRAPHY } from "./typography";

interface SidebarTabsProps {
  tabs: SidebarTab[];
  activeTab: SidebarTabId;
  onTabChange: (tabId: SidebarTabId) => void;
}

export function SidebarTabs({
  tabs,
  activeTab,
  onTabChange,
}: SidebarTabsProps) {
  return (
    <div
      className="flex w-full border-b border-primary-gold/20 shrink-0 overflow-x-auto"
      style={{
        padding: "0 16px",
        scrollbarWidth: "none" /* Firefox */,
        msOverflowStyle: "none" /* IE/Edge */,
      }}
    >
      {/* Hide scrollbar for Chrome/Safari/Opera */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-4 ${
                SIDEBAR_TYPOGRAPHY.tab.label
              } whitespace-nowrap flex-shrink-0
              transition-all duration-300 ease-out
              ${
                isActive
                  ? "text-primary-gold"
                  : "text-primary-gold/50 hover:text-primary-gold/80"
              }
            `}
          >
            {tab.label}

            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-gold"
                style={{
                  boxShadow: "0 0 8px rgba(255, 228, 190, 0.6)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
