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
import Timeline from "@/components/timeline";

export function EventDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");


  // Always call hooks (React rules), but conditionally use them
  const eventData = useEventData();
  const activeEventId = useEventStore((state) => state.activeEventId);
  const isEventOpen = Boolean(activeEventId);

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
          <Sidebar />
          <Timeline timelineContainerRef={timelineContainerRef} />
          <TheorySidebar theoryButtonRefs={theoryButtonRefs} />
        </>
      )}
      {children}
    </>
  );
}
