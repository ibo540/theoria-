import { ReactNode } from "react";

/**
 * Tab IDs for the sidebar
 */
export type SidebarTabId = "overview" | "timeline" | "actors" | "theories" | "statistics";

/**
 * Tab configuration object
 */
export interface SidebarTab {
  id: SidebarTabId;
  label: string;
}

/**
 * Section IDs for accordion sections
 * This is a union of all possible section IDs across all tabs
 */
export type SectionId =
  | "summary"
  | "category"
  | "countries"
  | "unified-areas"
  | "statistics"
  | "overview-timeline"
  | "detailed-timeline"
  | "key-actors"
  | "connections"
  | "country-perspectives"
  | "related-scholars"
  | string; // Allow dynamic theory sections like "theory-realism"

/**
 * Section configuration for accordion items
 */
export interface SidebarSection {
  id: SectionId;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}
