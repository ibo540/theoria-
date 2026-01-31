# Timeline Component

A responsive, animated timeline component for displaying event milestones in the IR Lenses application.

## Components

### Timeline.tsx
Main timeline component that displays event timeline points with dynamic positioning and responsive width.

**Features:**
- **Dynamic Width**: Automatically adjusts based on screen size
  - Mobile (<640px): 90vw
  - Small Tablet (640-768px): 75vw
  - Tablet (768-1024px): 55vw
  - Small Desktop (1024-1280px): 40vw
  - Medium Desktop (1280-1600px): 30vw
  - Large Desktop (>1600px): 25vw
- **Smooth Transitions**: Width changes animate smoothly
- **Theory Integration**: Highlights points relevant to active theory
- **Tooltip Prevention**: Adequate spacing to prevent tooltip overlap with points

### TimelineTooltip.tsx
Separated tooltip component for displaying detailed information about timeline points.

**Features:**
- **Smart Positioning**: Positioned above points with 28px clearance to prevent overlap
- **Smooth Animations**: Fade-in and slide-in animations
- **Theory-Aware Styling**: Dynamic colors based on active theory
- **Rich Information**: Displays label, date, year, event title, and theory match indicator
- **Responsive Design**: Adjusts to content while maintaining readability

## Usage

```tsx
import Timeline from "@/components/timeline";

<Timeline 
  events={EVENTS_DATA} 
  activeEventId={activeEventId} 
/>
```

## Styling

The component uses:
- Tailwind CSS for utility classes
- Inline styles for dynamic theming
- CSS transitions for smooth interactions
- Backdrop blur for glassmorphism effect

## Improvements Made

1. ✅ **Organized Structure**: Moved from single file to dedicated folder
2. ✅ **Fixed Tooltip Overlap**: Increased spacing and z-index management
3. ✅ **Dynamic Width**: Responsive sizing based on viewport width
4. ✅ **Better Separation**: Tooltip extracted to separate component
5. ✅ **Improved Spacing**: Container height increased to accommodate tooltips
6. ✅ **Smooth Transitions**: Added transition classes for width changes




