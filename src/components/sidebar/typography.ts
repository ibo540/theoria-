/**
 * Central typography configuration for the sidebar
 * Modify these values to adjust all sidebar text sizes and fonts
 */

// Font families
export const SIDEBAR_FONTS = {
  heading: "var(--font-forum), serif",
  body: "var(--font-forum), serif",
  mono: "ui-monospace, monospace",
} as const;

// Font sizes - Main header (event title and date)
export const SIDEBAR_HEADER_SIZES = {
  eventTitle: "text-5xl", // Way bigger - 3rem / 48px
  eventDate: "text-2xl", // Way bigger - 1.5rem / 24px
  eventPeriod: "text-lg", // 1.125rem / 18px
} as const;

// Font sizes - Tabs
export const SIDEBAR_TAB_SIZES = {
  tabLabel: "text-base", // Bigger - 1rem / 16px
} as const;

// Font sizes - Section headers
export const SIDEBAR_SECTION_SIZES = {
  sectionTitle: "text-base", // Bigger - 1rem / 16px
  sectionSubtitle: "text-sm", // Bigger - 0.875rem / 14px
} as const;

// Font sizes - Content
export const SIDEBAR_CONTENT_SIZES = {
  contentLarge: "text-lg", // 1.125rem / 18px
  contentNormal: "text-base", // Bigger - 1rem / 16px
  contentSmall: "text-sm", // Bigger - 0.875rem / 14px
  contentTiny: "text-xs", // Bigger - 0.75rem / 12px (used sparingly)
  label: "text-sm", // Bigger - 0.875rem / 14px
  badge: "text-sm", // Bigger - 0.875rem / 14px
} as const;

// Font sizes - Event list items
export const SIDEBAR_EVENT_ITEM_SIZES = {
  eventItemTitle: "text-3xl", // Bigger - 1.875rem / 30px
  eventItemDate: "text-base", // Bigger - 1rem / 16px
  eventItemDescription: "text-xl", // Bigger - 1.25rem / 20px
} as const;

// Font weights
export const SIDEBAR_FONT_WEIGHTS = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

// Helper to get all typography classes for a specific element type
export const SIDEBAR_TYPOGRAPHY = {
  // Main event header (in detail view)
  eventHeader: {
    title: `${SIDEBAR_HEADER_SIZES.eventTitle} text-center`,
    date: `${SIDEBAR_HEADER_SIZES.eventDate} text-center`,
    period: `${SIDEBAR_HEADER_SIZES.eventPeriod} text-center`,
  },

  // Event list items
  eventItem: {
    title: `${SIDEBAR_EVENT_ITEM_SIZES.eventItemTitle} ${SIDEBAR_FONT_WEIGHTS.normal}`,
    date: `${SIDEBAR_EVENT_ITEM_SIZES.eventItemDate} ${SIDEBAR_FONT_WEIGHTS.light}`,
    description: `${SIDEBAR_EVENT_ITEM_SIZES.eventItemDescription} leading-relaxed line-clamp-2`,
  },

  // Tabs
  tab: {
    label: `${SIDEBAR_TAB_SIZES.tabLabel} uppercase tracking-wider ${SIDEBAR_FONT_WEIGHTS.medium}`,
  },

  // Section cards
  section: {
    title: `${SIDEBAR_SECTION_SIZES.sectionTitle} uppercase tracking-wider ${SIDEBAR_FONT_WEIGHTS.medium}`,
    subtitle: `${SIDEBAR_SECTION_SIZES.sectionSubtitle} uppercase tracking-wider ${SIDEBAR_FONT_WEIGHTS.normal}`,
  },

  // Content text
  content: {
    large: `${SIDEBAR_CONTENT_SIZES.contentLarge} leading-relaxed`,
    normal: `${SIDEBAR_CONTENT_SIZES.contentNormal} leading-relaxed`,
    small: `${SIDEBAR_CONTENT_SIZES.contentSmall} leading-relaxed`,
    tiny: `${SIDEBAR_CONTENT_SIZES.contentTiny} leading-relaxed`,
    label: `${SIDEBAR_CONTENT_SIZES.label} uppercase tracking-wider`,
    badge: `${SIDEBAR_CONTENT_SIZES.badge} ${SIDEBAR_FONT_WEIGHTS.medium}`,
  },
} as const;
