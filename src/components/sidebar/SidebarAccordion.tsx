"use client";

import React, { useState } from "react";
import { SidebarSectionCard } from "./SidebarSectionCard";
import { SidebarSection, SectionId } from "./types";

interface SidebarAccordionProps {
  sections: SidebarSection[];
  activeSection: SectionId | null;
  onSectionChange: (sectionId: SectionId) => void;
}

export function SidebarAccordion({
  sections,
  activeSection,
  onSectionChange,
}: SidebarAccordionProps) {
  const handleSectionClick = (sectionId: SectionId) => {
    // Toggle: if clicking the active section, collapse it
    if (activeSection === sectionId) {
      onSectionChange("");
    } else {
      onSectionChange(sectionId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <SidebarSectionCard
          key={section.id}
          id={section.id}
          title={section.title}
          icon={section.icon}
          isExpanded={activeSection === section.id}
          onClick={() => handleSectionClick(section.id)}
        >
          {section.content}
        </SidebarSectionCard>
      ))}
    </div>
  );
}

