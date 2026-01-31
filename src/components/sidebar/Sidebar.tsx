"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, MoreVertical } from "lucide-react";
import SearchInput from "@/components/ui/inputs/SearchInput";
import EventItem from "@/components/sidebar/EventItem";
import Button from "@/components/ui/Buttons/p-button/Button";
import { EVENTS_DATA, EventData } from "@/data/events";
import { useEventStore } from "@/stores/useEventStore";
import { loadAllEventsFromStorage } from "@/lib/admin-utils";
import { SidebarFrame } from "./SidebarFrame";
import { SidebarTabs } from "./SidebarTabs";
import { SidebarTabContent } from "./SidebarTabContent";
import { SidebarTabId, SidebarTab, SectionId } from "./types";
import { SIDEBAR_TYPOGRAPHY } from "./typography";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * Main Sidebar Component
 *
 * Architecture:
 * - SidebarFrame: Decorative border + resize handle
 * - Fixed Header: Search input OR event title + tabs
 * - Scrollable Content: Event list OR tab content with accordions
 *
 * Key Features:
 * - Single scroll container (no nested scroll areas)
 * - Smooth GSAP transitions between panels
 * - Proper cleanup of animations
 */

const TABS: SidebarTab[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "actors", label: "Actors" },
  { id: "theories", label: "Theories" },
];

export default function Sidebar() {
  const [allEvents, setAllEvents] = useState<EventData[]>(EVENTS_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ left: 0, top: 0 });
  const [activeTab, setActiveTab] = useState<SidebarTabId>("overview");
  const [activeSectionByTab, setActiveSectionByTab] = useState<
    Record<SidebarTabId, SectionId | null>
  >({
    overview: "summary",
    timeline: null,
    actors: null,
    theories: null,
  });

  const sidebarRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const activeEventId = useEventStore((state) => state.activeEventId);
  const activeEvent = useEventStore((state) => state.activeEvent);
  const selectEvent = useEventStore((state) => state.selectEvent);
  const deselectEvent = useEventStore((state) => state.deselectEvent);
  const isEventSelected = useEventStore((state) => state.isEventSelected);

  // Load events from Supabase/localStorage and merge with static events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const storedEvents = await loadAllEventsFromStorage();
        if (storedEvents && storedEvents.length > 0) {
          // Merge stored events with static events (stored events take priority)
          const uniqueStaticEvents = EVENTS_DATA.filter(
            (e) => !storedEvents.some((se) => se.id === e.id)
          );
          setAllEvents([...storedEvents, ...uniqueStaticEvents]);
        } else {
          setAllEvents(EVENTS_DATA);
        }
      } catch (error) {
        console.error("Error loading events:", error);
        setAllEvents(EVENTS_DATA);
      }
    };

    loadEvents();
    
    // Refresh events periodically to catch new saves
    const interval = setInterval(loadEvents, 2000);
    
    // Also listen for storage changes
    const handleStorageChange = () => {
      loadEvents();
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 800;

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX - 16; // Subtract left margin
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Update button position based on sidebar position
  useEffect(() => {
    const updatePosition = () => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        setButtonPosition({
          left: rect.right + 8,
          top: rect.top,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    const observer = new ResizeObserver(updatePosition);
    if (sidebarRef.current) {
      observer.observe(sidebarRef.current);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      observer.disconnect();
    };
  }, [activeEventId, sidebarWidth]);

  // Handle tab change
  const handleTabChange = (tabId: SidebarTabId) => {
    setActiveTab(tabId);
  };

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return allEvents;
    }

    const query = searchQuery.toLowerCase().trim();
    return allEvents.filter((event) => {
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description
        .toLowerCase()
        .includes(query);
      const matchesDate = event.date.toLowerCase().includes(query);
      const matchesActors = event.actors?.some((actor) => {
        const actorName = typeof actor === "string" ? actor : actor.name;
        return actorName.toLowerCase().includes(query);
      });

      return matchesTitle || matchesDescription || matchesDate || matchesActors;
    });
  }, [searchQuery, allEvents]);

  const handleEventClick = (eventId: string) => {
    if (isEventSelected(eventId)) {
      deselectEvent();
      setActiveTab("overview"); // Reset tab when deselecting
    } else {
      selectEvent(eventId).catch(console.error);
      setActiveTab("overview"); // Reset tab when selecting new event
    }
  };

  const handleClose = () => {
    deselectEvent();
    setActiveTab("overview"); // Reset tab when closing
  };

  const handleSectionChange = (sectionId: SectionId) => {
    setActiveSectionByTab((prev) => ({
      ...prev,
      [activeTab]: sectionId,
    }));
  };

  // Animate content transitions with improved cleanup
  useGSAP(() => {
    if (!contentRef.current) return;

    const content = contentRef.current;

    // Fade and slide animation for content changes
    gsap.fromTo(
      content,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto", // Prevents animation conflicts
      }
    );
  }, [activeEventId]);

  return (
    <>
      {activeEvent && (
        <div
          className="fixed flex flex-col gap-2 z-1"
          style={{
            left: `${buttonPosition.left}px`,
            top: `${buttonPosition.top}px`,
          }}
        >
          <Button
            onClick={handleClose}
            borderStyle="five"
            variant="icon"
            type="button"
          >
            <X size={20} />
          </Button>
          <Button
            onClick={() => console.log("Menu clicked")}
            borderStyle="five"
            variant="icon"
            type="button"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      )}

      <SidebarFrame
        ref={sidebarRef}
        width={sidebarWidth}
        onResizeStart={() => setIsResizing(true)}
      >
        {/* Simplified Layout: Fixed Header + Scrollable Content */}
        <div ref={contentRef} className="flex flex-col w-full h-full">
          {!activeEvent ? (
            /* Default View: Event List */
            <>
              {/* Fixed Header: Search */}
              <div className="w-full shrink-0 p-6 pb-0">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  borderStyle="five"
                />
              </div>

              {/* Scrollable Content: Event List */}
              <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="px-6 py-4 pb-6 space-y-3 mr-2">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <EventItem
                        key={event.id}
                        event={event}
                        isActive={isEventSelected(event.id)}
                        onClick={() => handleEventClick(event.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-primary-gold/50">
                      No events found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Event Detail View: Header + Tabs + Content */
            <>
              {/* Fixed Header: Event Title + Tabs */}
              <div className="w-full shrink-0">
                <div className="border-b border-primary-gold/20 px-6 py-6">
                  <h2
                    className={`${SIDEBAR_TYPOGRAPHY.eventHeader.title} text-primary-gold mb-3`}
                  >
                    {activeEvent.title}
                  </h2>
                  {/* Show period if available, otherwise show date */}
                  {activeEvent.period &&
                  typeof activeEvent.period === "object" &&
                  activeEvent.period.startYear ? (
                    <p
                      className={`${SIDEBAR_TYPOGRAPHY.eventHeader.period} text-primary-gold/80 mt-2`}
                    >
                      {activeEvent.period.startYear} -{" "}
                      {activeEvent.period.endYear}
                    </p>
                  ) : activeEvent.date ? (
                    <p
                      className={`${SIDEBAR_TYPOGRAPHY.eventHeader.date} text-primary-gold/90 mt-2`}
                    >
                      {activeEvent.date}
                    </p>
                  ) : null}
                </div>

                <SidebarTabs
                  tabs={TABS}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

              {/* Scrollable Content: Tab Content with Accordions */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mr-2">
                {TABS.map((tab) => (
                  <SidebarTabContent
                    key={tab.id}
                    tabId={tab.id}
                    event={activeEvent}
                    activeSection={activeSectionByTab[tab.id]}
                    onSectionChange={handleSectionChange}
                    isVisible={activeTab === tab.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </SidebarFrame>
    </>
  );
}
