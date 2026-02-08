"use client";

import { useEffect, useState } from "react";
import { useTheoryStore, TheoryType } from "@/stores/useTheoryStore";
import { useEventStore } from "@/stores/useEventStore";
import { EventData, TheoryInterpretation } from "@/data/events";
import { loadEventFromStorage, getBaseEventId, createEventIdWithTheory } from "@/lib/admin-utils";
import { THEORY_LABELS } from "@/lib/theoryTokens";
import { X } from "lucide-react";

interface TheoryComparisonProps {
  onClose?: () => void;
}

export function TheoryComparison({ onClose }: TheoryComparisonProps) {
  const comparisonMode = useTheoryStore((state) => state.comparisonMode);
  const primaryTheory = useTheoryStore((state) => state.primaryTheory);
  const secondaryTheory = useTheoryStore((state) => state.secondaryTheory);
  const disableComparison = useTheoryStore((state) => state.disableComparison);
  const getTheoryColor = useTheoryStore((state) => state.getTheoryColor);
  
  const activeEvent = useEventStore((state) => state.activeEvent);
  const [primaryEvent, setPrimaryEvent] = useState<EventData | null>(null);
  const [secondaryEvent, setSecondaryEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load both theory-specific events
  useEffect(() => {
    if (!comparisonMode || !primaryTheory || !secondaryTheory || !activeEvent) {
      setPrimaryEvent(null);
      setSecondaryEvent(null);
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        const baseId = getBaseEventId(activeEvent.id);
        
        // Load primary theory event
        const primaryId = createEventIdWithTheory(baseId, primaryTheory);
        const primary = await loadEventFromStorage(primaryId);
        setPrimaryEvent(primary || activeEvent);
        
        // Load secondary theory event
        const secondaryId = createEventIdWithTheory(baseId, secondaryTheory);
        const secondary = await loadEventFromStorage(secondaryId);
        setSecondaryEvent(secondary || activeEvent);
      } catch (error) {
        console.error("Error loading comparison events:", error);
        // Fallback to base event
        setPrimaryEvent(activeEvent);
        setSecondaryEvent(activeEvent);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [comparisonMode, primaryTheory, secondaryTheory, activeEvent?.id]);

  if (!comparisonMode || !primaryTheory || !secondaryTheory || !activeEvent) {
    return null;
  }

  const primaryColor = getTheoryColor(primaryTheory);
  const secondaryColor = getTheoryColor(secondaryTheory);
  const primaryLabel = THEORY_LABELS[primaryTheory];
  const secondaryLabel = THEORY_LABELS[secondaryTheory];

  // Get interpretations from events or base event
  const primaryInterpretation = primaryEvent?.interpretations?.[primaryTheory] || 
                                activeEvent?.interpretations?.[primaryTheory];
  const secondaryInterpretation = secondaryEvent?.interpretations?.[secondaryTheory] || 
                                   activeEvent?.interpretations?.[secondaryTheory];

  const handleClose = () => {
    disableComparison();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleClose} />
      
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] bg-[#1a1a1a] rounded-lg shadow-2xl border border-[#ffe4be]/20 pointer-events-auto overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ffe4be]/20">
          <h2 className="text-2xl font-bold text-[#ffe4be]">Theory Comparison</h2>
          <button
            onClick={handleClose}
            className="text-[#ffe4be]/70 hover:text-[#ffe4be] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-[#ffe4be]/70 py-12">Loading comparisons...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Theory */}
              <div 
                className="rounded-lg p-6 border-2"
                style={{ 
                  borderColor: `${primaryColor}80`,
                  backgroundColor: `${primaryColor}10`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                    {primaryLabel}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-[#ffe4be]/10 text-[#ffe4be]/70">
                    Primary
                  </span>
                </div>
                
                {primaryInterpretation ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#ffe4be]/90 mb-2">Interpretation</h4>
                      <p className="text-sm text-[#ffe4be]/80 leading-relaxed">
                        {primaryInterpretation.interpretation}
                      </p>
                    </div>
                    
                    {primaryInterpretation.keyPoints && primaryInterpretation.keyPoints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-[#ffe4be]/90 mb-2">Key Points</h4>
                        <ul className="space-y-2">
                          {primaryInterpretation.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-sm text-[#ffe4be]/80 flex items-start gap-2">
                              <span style={{ color: primaryColor }}>•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#ffe4be]/60 italic">
                    No interpretation available for {primaryLabel}
                  </p>
                )}
              </div>

              {/* Secondary Theory */}
              <div 
                className="rounded-lg p-6 border-2"
                style={{ 
                  borderColor: `${secondaryColor}80`,
                  backgroundColor: `${secondaryColor}10`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <h3 className="text-xl font-semibold" style={{ color: secondaryColor }}>
                    {secondaryLabel}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-[#ffe4be]/10 text-[#ffe4be]/70">
                    Secondary
                  </span>
                </div>
                
                {secondaryInterpretation ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#ffe4be]/90 mb-2">Interpretation</h4>
                      <p className="text-sm text-[#ffe4be]/80 leading-relaxed">
                        {secondaryInterpretation.interpretation}
                      </p>
                    </div>
                    
                    {secondaryInterpretation.keyPoints && secondaryInterpretation.keyPoints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-[#ffe4be]/90 mb-2">Key Points</h4>
                        <ul className="space-y-2">
                          {secondaryInterpretation.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-sm text-[#ffe4be]/80 flex items-start gap-2">
                              <span style={{ color: secondaryColor }}>•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#ffe4be]/60 italic">
                    No interpretation available for {secondaryLabel}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#ffe4be]/20 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-lg bg-[#ffe4be]/10 hover:bg-[#ffe4be]/20 text-[#ffe4be] transition-colors font-medium"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
