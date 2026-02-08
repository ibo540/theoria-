"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SidebarAccordion } from "./SidebarAccordion";
import { SidebarSection, SidebarTabId, SectionId } from "./types";
import { EventData } from "@/data/events";
import { SIDEBAR_TYPOGRAPHY } from "./typography";
import {
  FileText,
  Clock,
  Users,
  Lightbulb,
  Globe,
  TrendingUp,
  Map,
  BookOpen,
  BarChart3,
} from "lucide-react";
import UniversalChart, { ChartType } from "./UniversalChart";
import { ChartData } from "@/data/events";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { getChartColors } from "@/lib/chart-color-utils";

interface SidebarTabContentProps {
  tabId: SidebarTabId;
  event: EventData;
  activeSection: SectionId | null;
  onSectionChange: (sectionId: SectionId) => void;
  isVisible: boolean;
}

/**
 * Simplified Tab Content Component
 *
 * Key Improvements:
 * - Only renders visible tab (better performance)
 * - Simplified fade-in animation
 * - Proper animation cleanup with overwrite
 */
export function SidebarTabContent({
  tabId,
  event,
  activeSection,
  onSectionChange,
  isVisible,
}: SidebarTabContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Simplified fade-in animation when tab becomes visible
  useGSAP(() => {
    if (!contentRef.current || !isVisible) return;

    // Simple fade-in with minimal slide
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto", // Prevents animation conflicts
      }
    );
  }, [isVisible]);

  // Generate sections based on tab
  const sections = getSectionsForTab(tabId, event);

  // Don't render invisible tabs for better performance
  if (!isVisible) return null;

  return (
    <div ref={contentRef} className="w-full px-6 pt-4 pb-8">
      <SidebarAccordion
        sections={sections}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />
    </div>
  );
}

// Helper function to generate sections based on tab and event data
function getSectionsForTab(
  tabId: SidebarTabId,
  event: EventData
): SidebarSection[] {
  switch (tabId) {
    case "overview":
      return getOverviewSections(event);
    case "timeline":
      return getTimelineSections(event);
    case "actors":
      return getActorsSections(event);
    case "statistics":
      return getStatisticsSections(event);
    default:
      return [];
  }
}

function getOverviewSections(event: EventData): SidebarSection[] {
  const sections: SidebarSection[] = [];

  // Summary section
  sections.push({
    id: "summary",
    title: "Summary",
    icon: <FileText size={16} />,
    content: (
      <div className="space-y-4">
        <div>
          <h4
            className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-2`}
          >
            Event Title
          </h4>
          <p
            className={`${SIDEBAR_TYPOGRAPHY.content.large} text-primary-gold/95 font-medium`}
          >
            {event.title}
          </p>
        </div>
        <div>
          <h4
            className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-2`}
          >
            Date
          </h4>
          <p
            className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90`}
          >
            {event.date}
          </p>
        </div>
        {event.period &&
          typeof event.period === "object" &&
          event.period.startYear && (
            <div>
              <h4
                className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-2`}
              >
                Period
              </h4>
              <p
                className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90`}
              >
                {event.period.startYear} - {event.period.endYear}
              </p>
            </div>
          )}
        <div>
          <h4
            className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-2`}
          >
            Description
          </h4>
          <div
            className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/85 prose prose-invert max-w-none`}
            dangerouslySetInnerHTML={{
              __html: event.fullDescription
                ? event.fullDescription.replace(/^<p>|<\/p>$/g, '').trim()
                : ''
            }}
          />
        </div>
      </div>
    ),
  });

  // Category section
  if (event.category) {
    sections.push({
      id: "category",
      title: "Category",
      icon: <TrendingUp size={16} />,
      content: (
        <span
          className={`inline-block px-4 py-2 border-2 border-primary-gold/40 ${SIDEBAR_TYPOGRAPHY.content.badge} text-primary-gold/90 bg-black/30 uppercase`}
        >
          {event.category}
        </span>
      ),
    });
  }

  // Countries section
  if (event.highlightedCountries && event.highlightedCountries.length > 0) {
    sections.push({
      id: "countries",
      title: "Countries",
      icon: <Globe size={16} />,
      content: (
        <div className="flex flex-wrap gap-2">
          {event.highlightedCountries.map((country) => (
            <span
              key={country}
              className={`px-3 py-2 border border-primary-gold/25 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/85 bg-black/20`}
            >
              {country}
            </span>
          ))}
        </div>
      ),
    });
  }

  // Unified Areas
  if (event.unifiedAreas && event.unifiedAreas.length > 0) {
    sections.push({
      id: "unified-areas",
      title: "Unified Areas & Blocs",
      icon: <Map size={16} />,
      content: (
        <div className="space-y-4">
          {event.unifiedAreas.map((area) => (
            <div
              key={area.id}
              className="border-l-2 border-primary-gold/30 pl-4 py-2"
            >
              <h4
                className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90 font-medium mb-3`}
              >
                {area.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {area.countries.map((country) => (
                  <span
                    key={country}
                    className={`px-3 py-1.5 border border-primary-gold/20 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/80 bg-black/15`}
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Stats
  if (event.stats) {
    sections.push({
      id: "statistics",
      title: "Statistics",
      icon: <TrendingUp size={16} />,
      content: (
        <div className="space-y-4">
          {event.stats.militaryPower &&
            Object.keys(event.stats.militaryPower).length > 0 && (
              <div>
                <h4
                  className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
                >
                  Military Power
                </h4>
                <div className="space-y-2">
                  {Object.entries(event.stats.militaryPower).map(
                    ([country, power]) => (
                      <div
                        key={country}
                        className={`flex items-center justify-between ${SIDEBAR_TYPOGRAPHY.content.normal}`}
                      >
                        <span className="text-primary-gold/90">{country}</span>
                        <span className="text-primary-gold/80 font-medium">
                          {power}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          {event.stats.economicPower &&
            Object.keys(event.stats.economicPower).length > 0 && (
              <div>
                <h4
                  className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
                >
                  Economic Power
                </h4>
                <div className="space-y-2">
                  {Object.entries(event.stats.economicPower).map(
                    ([country, power]) => (
                      <div
                        key={country}
                        className={`flex items-center justify-between ${SIDEBAR_TYPOGRAPHY.content.normal}`}
                      >
                        <span className="text-primary-gold/90">{country}</span>
                        <span className="text-primary-gold/80 font-medium">
                          {power}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          {event.stats.alliances && event.stats.alliances.length > 0 && (
            <div>
              <h4
                className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
              >
                Alliances
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.stats.alliances.map((alliance) => (
                  <span
                    key={alliance}
                    className={`px-3 py-2 border border-primary-gold/25 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/85 bg-black/20`}
                  >
                    {alliance}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  return sections;
}

function getTimelineSections(event: EventData): SidebarSection[] {
  const sections: SidebarSection[] = [];

  // Overview Timeline
  if (event.overviewTimeline && event.overviewTimeline.length > 0) {
    sections.push({
      id: "overview-timeline",
      title: "Timeline Overview",
      icon: <Clock size={16} />,
      content: (
        <div className="space-y-4">
          {event.overviewTimeline.map((item, index) => (
            <div
              key={index}
              className="border-l-2 border-primary-gold/30 pl-4 py-2"
            >
              <span
                className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 block mb-2`}
              >
                {item.date}
              </span>
              <p
                className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90`}
              >
                {item.event}
              </p>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Detailed Timeline
  if (event.timelinePoints && event.timelinePoints.length > 0) {
    sections.push({
      id: "detailed-timeline",
      title: "Detailed Timeline",
      icon: <Clock size={16} />,
      content: (
        <div className="space-y-4">
          {event.timelinePoints.map((point) => (
            <div
              key={point.id}
              className="border-l-2 border-primary-gold/30 pl-4 py-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80`}
                >
                  {point.date}
                </span>
                {point.year && (
                  <span
                    className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/70`}
                  >
                    {point.year}
                  </span>
                )}
              </div>
              <h4
                className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90 font-medium mb-2`}
              >
                {point.label}
              </h4>
              {point.description && (
                <div
                  className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/80 prose prose-invert max-w-none`}
                  dangerouslySetInnerHTML={{
                    __html: point.description.replace(/^<p>|<\/p>$/g, '').trim()
                  }}
                />
              )}
              {point.eventType && (
                <span
                  className={`inline-block mt-2 px-3 py-1.5 border border-primary-gold/25 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/75 bg-black/15 uppercase`}
                >
                  {point.eventType}
                </span>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  return sections;
}

function getActorsSections(event: EventData): SidebarSection[] {
  const sections: SidebarSection[] = [];

  // Key Actors
  if (event.actors && event.actors.length > 0) {
    sections.push({
      id: "key-actors",
      title: "Key Actors",
      icon: <Users size={16} />,
      content: (
        <div className="flex flex-wrap gap-2">
          {event.actors.map((actor) => {
            const actorName = typeof actor === "string" ? actor : actor.name;
            const actorKey = typeof actor === "string" ? actor : actor.id;
            return (
              <span
                key={actorKey}
                className={`px-4 py-2 border-2 border-primary-gold/30 ${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90 bg-black/30 font-medium`}
              >
                {actorName}
              </span>
            );
          })}
        </div>
      ),
    });
  }

  // Connections
  if (event.connections && event.connections.length > 0) {
    sections.push({
      id: "connections",
      title: "Connections & Relationships",
      icon: <TrendingUp size={16} />,
      content: (
        <div className="space-y-3">
          {event.connections.map((connection, index) => (
            <div
              key={index}
              className="border-l-2 border-primary-gold/30 pl-4 py-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90 font-medium`}
                >
                  {connection.from}
                </span>
                <span
                  className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/60`}
                >
                  →
                </span>
                <span
                  className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90 font-medium`}
                >
                  {connection.to}
                </span>
                {connection.type && (
                  <span
                    className={`px-3 py-1.5 border border-primary-gold/25 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/80 bg-black/15 uppercase`}
                  >
                    {connection.type}
                  </span>
                )}
              </div>
              {connection.label && (
                <p
                  className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/70 mt-2 ml-6`}
                >
                  {connection.label}
                </p>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  // Country Perspectives
  if (
    event.countryPerspectives &&
    Object.keys(event.countryPerspectives).length > 0
  ) {
    sections.push({
      id: "country-perspectives",
      title: "Country Perspectives",
      icon: <Globe size={16} />,
      content: (
        <div className="space-y-4">
          {Object.entries(event.countryPerspectives).map(
            ([country, perspective]) => (
              <div
                key={country}
                className="border-l-2 border-primary-gold/30 pl-4 py-3"
              >
                <h4
                  className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/90 font-medium mb-3`}
                >
                  {country}
                </h4>
                {perspective.role && (
                  <p
                    className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/80 mb-3 italic`}
                  >
                    Role: {perspective.role}
                  </p>
                )}
                {perspective.perspectives &&
                  Object.keys(perspective.perspectives).length > 0 && (
                    <div className="space-y-3 mt-2">
                      {Object.entries(perspective.perspectives).map(
                        ([theory, text]) => (
                          <div
                            key={theory}
                            className="pl-3 border-l border-primary-gold/15"
                          >
                            <span
                              className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/75 block mb-2`}
                            >
                              {theory}
                            </span>
                            <p
                              className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/80`}
                            >
                              {text}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            )
          )}
        </div>
      ),
    });
  }

  return sections;
}

function getTheoriesSections(event: EventData): SidebarSection[] {
  const sections: SidebarSection[] = [];

  // Theory Interpretations
  if (event.interpretations && Object.keys(event.interpretations).length > 0) {
    Object.entries(event.interpretations).forEach(
      ([theory, interpretation]) => {
        sections.push({
          id: `theory-${theory}`,
          title: theory.replace(/([A-Z])/g, " $1").trim(),
          icon: <Lightbulb size={16} />,
          content: (
            <div className="space-y-4">
              <p
                className={`${SIDEBAR_TYPOGRAPHY.content.normal} text-primary-gold/85`}
              >
                {interpretation.interpretation}
              </p>
              {interpretation.keyPoints &&
                interpretation.keyPoints.length > 0 && (
                  <div>
                    <h4
                      className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
                    >
                      Key Points
                    </h4>
                    <div className="space-y-2">
                      {interpretation.keyPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/80`}
                        >
                          <span className="text-primary-gold/60 mt-1">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {interpretation.limitations && (
                <div className="pt-3 border-t border-primary-gold/15">
                  <h4
                    className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/75 mb-3`}
                  >
                    Limitations
                  </h4>
                  {interpretation.limitations.blindSpots &&
                    interpretation.limitations.blindSpots.length > 0 && (
                      <div className="space-y-2">
                        <p
                          className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/70 italic mb-2`}
                        >
                          Blind Spots:
                        </p>
                        {interpretation.limitations.blindSpots.map(
                          (spot, idx) => (
                            <div
                              key={idx}
                              className={`${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/75 pl-3`}
                            >
                              • {spot}
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          ),
        });
      }
    );
  }

  // Related Scholars
  if (event.relatedScholars && event.relatedScholars.length > 0) {
    sections.push({
      id: "related-scholars",
      title: "Related Scholars",
      icon: <BookOpen size={16} />,
      content: (
        <div className="flex flex-wrap gap-2">
          {event.relatedScholars.map((scholar) => (
            <span
              key={scholar}
              className={`px-3 py-2 border border-primary-gold/25 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/85 bg-black/20`}
            >
              {scholar}
            </span>
          ))}
        </div>
      ),
    });
  }

  return sections;
}

function getStatisticsSections(event: EventData): SidebarSection[] {
  const sections: SidebarSection[] = [];
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);

  // Charts section
  if (event.stats?.charts && event.stats.charts.length > 0) {
    sections.push({
      id: "charts",
      title: "Charts & Visualizations",
      icon: <BarChart3 size={16} />,
      content: (
        <div className="space-y-6">
          {event.stats.charts.map((chart) => {
            // Get theory color if chart is associated with a theory
            // Use the exact same color values as country highlighting
            const theoryColor = chart.theory 
              ? getTheoryColor(chart.theory as TheoryType)
              : undefined;
            
            // Determine number of data series (dataKeys or default to 1)
            const seriesCount = chart.dataKeys?.length || 1;
            
            // Generate distinct color variations from theory color
            // This maintains theory identity while ensuring readability
            const colors = theoryColor 
              ? getChartColors(theoryColor, seriesCount)
              : undefined;

            return (
              <UniversalChart
                key={chart.id}
                title={chart.title}
                type={chart.type as ChartType}
                data={chart.data}
                description={chart.description}
                dataKeys={chart.dataKeys}
                colors={colors}
                height={300}
                xAxisLabel={chart.xAxisLabel}
                yAxisLabel={chart.yAxisLabel}
              />
            );
          })}
        </div>
      ),
    });
  }

  // Legacy stats (military power, economic power, alliances)
  if (event.stats) {
    const hasLegacyStats = 
      (event.stats.militaryPower && Object.keys(event.stats.militaryPower).length > 0) ||
      (event.stats.economicPower && Object.keys(event.stats.economicPower).length > 0) ||
      (event.stats.alliances && event.stats.alliances.length > 0);

    if (hasLegacyStats) {
      sections.push({
        id: "statistics",
        title: "Statistics",
        icon: <TrendingUp size={16} />,
        content: (
          <div className="space-y-4">
            {event.stats.militaryPower &&
              Object.keys(event.stats.militaryPower).length > 0 && (
                <div>
                  <h4
                    className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
                  >
                    Military Power
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(event.stats.militaryPower).map(
                      ([country, power]) => (
                        <div
                          key={country}
                          className={`flex items-center justify-between ${SIDEBAR_TYPOGRAPHY.content.normal}`}
                        >
                          <span className="text-primary-gold/90">{country}</span>
                          <span className="text-primary-gold/80 font-medium">
                            {power}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            {event.stats.economicPower &&
              Object.keys(event.stats.economicPower).length > 0 && (
                <div>
                  <h4
                    className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
                  >
                    Economic Power
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(event.stats.economicPower).map(
                      ([country, power]) => (
                        <div
                          key={country}
                          className={`flex items-center justify-between ${SIDEBAR_TYPOGRAPHY.content.normal}`}
                        >
                          <span className="text-primary-gold/90">{country}</span>
                          <span className="text-primary-gold/80 font-medium">
                            {power}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            {event.stats.alliances && event.stats.alliances.length > 0 && (
              <div>
                <h4
                  className={`${SIDEBAR_TYPOGRAPHY.content.label} text-primary-gold/80 mb-3`}
                >
                  Alliances
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.stats.alliances.map((alliance) => (
                    <span
                      key={alliance}
                      className={`px-3 py-2 border border-primary-gold/25 ${SIDEBAR_TYPOGRAPHY.content.small} text-primary-gold/85 bg-black/20`}
                    >
                      {alliance}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
      });
    }
  }

  return sections;
}
