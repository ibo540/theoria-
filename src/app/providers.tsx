"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useEventData } from "@/hooks/useEventData";
import { useEventStore } from "@/stores/useEventStore";
import { useEventTransitionAnimation } from "@/hooks/useEventTransitionAnimation";
import CustomCursor from "@/components/CustomCursor";
import Loader from "@/components/Loader";
import Navbar from "@/components/Navbar";
import { Sidebar } from "@/components/sidebar";
import { TheorySidebar } from "@/components/theory-sidebar";
import { TheoryComparison } from "@/components/TheoryComparison";
import Timeline from "@/components/timeline";
import { useState, useEffect } from "react";

export function EventDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");


  // Always call hooks (React rules), but conditionally use them
  const eventData = useEventData();
  const activeEventId = useEventStore((state) => state.activeEventId);
  const isEventOpen = Boolean(activeEventId);
  
  // Track if timeline navigation is active (when popup is open)
  const [isTimelineNavigating, setIsTimelineNavigating] = useState(false);
  
  // Expose setter via window for WorldMap to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setIsTimelineNavigating = setIsTimelineNavigating;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).setIsTimelineNavigating;
      }
    };
  }, []);

  // Animation refs
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const theoryButtonRefs = useRef<HTMLElement[]>([]);

  // Setup coordinated animations (only on main site)
  useEventTransitionAnimation(isEventOpen && !isAdminPage, {
    timelineContainerRef,
    theoryButtonRefs,
  });

  return (
    <>
      {!isAdminPage && (
        <>
          <Loader />
          <CustomCursor />
          <Navbar />
          <Sidebar isTimelineNavigating={isTimelineNavigating} />
          <Timeline timelineContainerRef={timelineContainerRef} />
          <TheorySidebar theoryButtonRefs={theoryButtonRefs} isTimelineNavigating={isTimelineNavigating} />
          <TheoryComparison />
        </>
      )}
      {children}
    </>
  );
}
