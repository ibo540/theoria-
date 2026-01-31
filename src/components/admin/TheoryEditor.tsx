"use client";

import { useState, useEffect } from "react";
import { EventData, TheoryInterpretation } from "@/data/events";
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { THEORY_COLORS, THEORY_COLORS_DARK } from "@/lib/theoryTokens";

interface TheoryEditorProps {
  event: Partial<EventData>;
  setEvent: (event: Partial<EventData>) => void;
}

// Map TheoryEditor IDs to TheoryType for color mapping
const THEORY_ID_TO_TYPE: Record<string, "realism" | "neorealism" | "liberalism" | "neoliberal" | "englishschool" | "constructivism"> = {
  "classical-realism": "realism",
  "structural-realism": "neorealism",
  "liberalism": "liberalism",
  "neoliberalism": "neoliberal",
  "english-school": "englishschool",
  "constructivism": "constructivism",
};

const THEORIES = [
  { id: "classical-realism", name: "Classical Realism" },
  { id: "structural-realism", name: "Structural Realism" },
  { id: "liberalism", name: "Liberalism" },
  { id: "neoliberalism", name: "Neoliberalism" },
  { id: "english-school", name: "English School" },
  { id: "constructivism", name: "Constructivism" },
];

export function TheoryEditor({ event, setEvent }: TheoryEditorProps) {
  const [expandedTheory, setExpandedTheory] = useState<string | null>(null);
  const [selectedTheory, setSelectedTheory] = useState<string>("");
  const [activeWorkflowTheory, setActiveWorkflowTheory] = useState<string | null>(null);

  const interpretations = event.interpretations || {};
  
  // Calculate completion status
  const completedTheories = THEORIES.filter(t => {
    const interpretation = interpretations[t.id];
    return interpretation && 
           interpretation.interpretation && 
           interpretation.interpretation.trim().length > 0 &&
           interpretation.keyPoints && 
           interpretation.keyPoints.length > 0 &&
           interpretation.keyPoints.some(kp => kp.trim().length > 0);
  });
  
  const completionCount = completedTheories.length;
  const totalTheories = THEORIES.length;
  
  // Get next incomplete theory
  const getNextIncompleteTheory = () => {
    return THEORIES.find(t => !completedTheories.find(ct => ct.id === t.id));
  };
  
  // Get previous theory
  const getPreviousTheory = (currentId: string) => {
    const currentIndex = THEORIES.findIndex(t => t.id === currentId);
    if (currentIndex <= 0) return null;
    return THEORIES[currentIndex - 1];
  };
  
  // Get next theory
  const getNextTheory = (currentId: string) => {
    const currentIndex = THEORIES.findIndex(t => t.id === currentId);
    if (currentIndex >= THEORIES.length - 1) return null;
    return THEORIES[currentIndex + 1];
  };
  
  // Auto-expand active workflow theory
  useEffect(() => {
    if (activeWorkflowTheory) {
      setExpandedTheory(activeWorkflowTheory);
      // If theory doesn't exist yet, create it
      if (!interpretations[activeWorkflowTheory]) {
        const newInterpretation: TheoryInterpretation = {
          interpretation: "",
          keyPoints: [],
          limitations: {
            canExplain: true,
            weaknessLevel: "none",
            blindSpots: [],
            whatItMisses: [],
            betterAlternatives: [],
          },
        };
        setEvent({
          ...event,
          interpretations: {
            ...interpretations,
            [activeWorkflowTheory]: newInterpretation,
          },
        });
      }
    }
  }, [activeWorkflowTheory]);

  const handleAddTheory = () => {
    if (!selectedTheory) {
      alert("Please select a theory");
      return;
    }

    if (interpretations[selectedTheory]) {
      alert("This theory already has an interpretation. Edit the existing one.");
      return;
    }

    const newInterpretation: TheoryInterpretation = {
      interpretation: "",
      keyPoints: [],
      limitations: {
        canExplain: true,
        weaknessLevel: "none",
        blindSpots: [],
        whatItMisses: [],
        betterAlternatives: [],
      },
    };

    setEvent({
      ...event,
      interpretations: {
        ...interpretations,
        [selectedTheory]: newInterpretation,
      },
    });

    setSelectedTheory("");
    setExpandedTheory(selectedTheory);
  };

  const handleUpdateInterpretation = (theoryId: string, field: string, value: any) => {
    const updated = {
      ...interpretations,
      [theoryId]: {
        ...interpretations[theoryId],
        [field]: value,
      },
    };
    setEvent({ ...event, interpretations: updated });
  };

  const handleUpdateKeyPoint = (theoryId: string, index: number, value: string) => {
    const interpretation = interpretations[theoryId];
    if (!interpretation) return;

    const keyPoints = [...(interpretation.keyPoints || [])];
    keyPoints[index] = value;

    handleUpdateInterpretation(theoryId, "keyPoints", keyPoints);
  };

  const handleAddKeyPoint = (theoryId: string) => {
    const interpretation = interpretations[theoryId];
    if (!interpretation) return;

    const keyPoints = [...(interpretation.keyPoints || []), ""];
    handleUpdateInterpretation(theoryId, "keyPoints", keyPoints);
  };

  const handleRemoveKeyPoint = (theoryId: string, index: number) => {
    const interpretation = interpretations[theoryId];
    if (!interpretation) return;

    const keyPoints = (interpretation.keyPoints || []).filter((_, i) => i !== index);
    handleUpdateInterpretation(theoryId, "keyPoints", keyPoints);
  };

  const handleRemoveTheory = (theoryId: string) => {
    if (confirm("Are you sure you want to remove this theory interpretation?")) {
      const updated = { ...interpretations };
      delete updated[theoryId];
      setEvent({ ...event, interpretations: updated });
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg shadow-lg p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Theory Interpretations</h2>
        <p className="text-gray-300">
          Add and manage how different IR theories interpret this event.
        </p>
      </div>

      {/* Theory Workflow Guide */}
      <TheoryWorkflowGuide
        theories={THEORIES}
        interpretations={interpretations}
        activeTheory={activeWorkflowTheory}
        onTheorySelect={setActiveWorkflowTheory}
        onNextTheory={() => {
          if (activeWorkflowTheory) {
            const next = getNextTheory(activeWorkflowTheory);
            if (next) setActiveWorkflowTheory(next.id);
          } else {
            const next = getNextIncompleteTheory();
            if (next) setActiveWorkflowTheory(next.id);
          }
        }}
        onPreviousTheory={() => {
          if (activeWorkflowTheory) {
            const prev = getPreviousTheory(activeWorkflowTheory);
            if (prev) setActiveWorkflowTheory(prev.id);
          }
        }}
        completionCount={completionCount}
        totalTheories={totalTheories}
      />

      {/* Add New Theory */}
      <div className="border-2 border-dashed border-slate-600/50 rounded-lg p-4 bg-slate-700/30">
        <div className="flex gap-2">
          <select
            value={selectedTheory}
            onChange={(e) => setSelectedTheory(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-600/50 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a theory to add...</option>
            {THEORIES.filter((t) => !interpretations[t.id]).map((theory) => (
              <option key={theory.id} value={theory.id}>
                {theory.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddTheory}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add Theory
          </button>
        </div>
      </div>

      {/* Theory Interpretations List */}
      <div className="space-y-4">
        {Object.keys(interpretations).length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">
            No theory interpretations yet. Add one above.
          </p>
        ) : (
          Object.entries(interpretations).map(([theoryId, interpretation]) => {
            const theory = THEORIES.find((t) => t.id === theoryId);
            const isExpanded = expandedTheory === theoryId;

            return (
              <div
                key={theoryId}
                className="border border-slate-600/50 rounded-lg overflow-hidden bg-slate-700/30"
              >
                <div className="bg-slate-700/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setExpandedTheory(isExpanded ? null : theoryId)
                      }
                      className="text-gray-300 hover:text-white"
                      type="button"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <h3 className="font-semibold text-white">
                      {theory?.name || theoryId}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleRemoveTheory(theoryId)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-6 space-y-4">
                    {/* Interpretation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Interpretation
                      </label>
                      <RichTextEditor
                        content={interpretation.interpretation || ""}
                        onChange={(content) =>
                          handleUpdateInterpretation(theoryId, "interpretation", content)
                        }
                        placeholder="How does this theory interpret the event?"
                      />
                    </div>

                    {/* Key Points */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-200">
                          Key Points
                        </label>
                        <button
                          onClick={() => handleAddKeyPoint(theoryId)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/20 transition-all duration-300"
                          type="button"
                        >
                          <Plus className="w-3 h-3" />
                          Add Point
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(interpretation.keyPoints || []).map((point, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={point}
                              onChange={(e) =>
                                handleUpdateKeyPoint(theoryId, index, e.target.value)
                              }
                              className="flex-1 px-3 py-2 border border-slate-600/50 bg-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                              placeholder={`Key point ${index + 1}`}
                            />
                            <button
                              onClick={() => handleRemoveKeyPoint(theoryId, index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Limitations */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-200 mb-3">
                        Theory Limitations
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-1">
                            Can Explain Event?
                          </label>
                          <select
                            value={interpretation.limitations?.canExplain ? "true" : "false"}
                            onChange={(e) =>
                              handleUpdateInterpretation(theoryId, "limitations", {
                                ...interpretation.limitations,
                                canExplain: e.target.value === "true",
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-white rounded-lg text-sm"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-1">
                            Weakness Level
                          </label>
                          <select
                            value={interpretation.limitations?.weaknessLevel || "none"}
                            onChange={(e) =>
                              handleUpdateInterpretation(theoryId, "limitations", {
                                ...interpretation.limitations,
                                weaknessLevel: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-white rounded-lg text-sm"
                          >
                            <option value="none">None</option>
                            <option value="minor">Minor</option>
                            <option value="moderate">Moderate</option>
                            <option value="strong">Strong</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Theory Workflow Guide Component
function TheoryWorkflowGuide({
  theories,
  interpretations,
  activeTheory,
  onTheorySelect,
  onNextTheory,
  onPreviousTheory,
  completionCount,
  totalTheories,
}: {
  theories: Array<{ id: string; name: string }>;
  interpretations: Record<string, TheoryInterpretation>;
  activeTheory: string | null;
  onTheorySelect: (theoryId: string) => void;
  onNextTheory: () => void;
  onPreviousTheory: () => void;
  completionCount: number;
  totalTheories: number;
}) {
  const isTheoryComplete = (theoryId: string) => {
    const interpretation = interpretations[theoryId];
    return interpretation && 
           interpretation.interpretation && 
           interpretation.interpretation.trim().length > 0 &&
           interpretation.keyPoints && 
           interpretation.keyPoints.length > 0 &&
           interpretation.keyPoints.some(kp => kp.trim().length > 0);
  };

  const getTheoryColor = (theoryId: string) => {
    const theoryType = THEORY_ID_TO_TYPE[theoryId];
    return theoryType ? THEORY_COLORS[theoryType] : "#6b7280";
  };

  const getTheoryDarkColor = (theoryId: string) => {
    const theoryType = THEORY_ID_TO_TYPE[theoryId];
    return theoryType ? THEORY_COLORS_DARK[theoryType] : "#374151";
  };

  const currentIndex = activeTheory ? theories.findIndex(t => t.id === activeTheory) : -1;
  const hasNext = currentIndex >= 0 && currentIndex < theories.length - 1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 border border-slate-600/50 rounded-xl p-6 space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Theory Analysis Progress</h3>
          <p className="text-sm text-gray-400">
            Complete interpretations for each theory perspective ({completionCount}/{totalTheories} completed)
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{completionCount}/{totalTheories}</div>
          <div className="text-xs text-gray-400">Theories</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-600/50 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${(completionCount / totalTheories) * 100}%` }}
        />
      </div>

      {/* Theory Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {theories.map((theory) => {
          const isComplete = isTheoryComplete(theory.id);
          const isActive = activeTheory === theory.id;
          const theoryColor = getTheoryColor(theory.id);
          const theoryDarkColor = getTheoryDarkColor(theory.id);

          return (
            <button
              key={theory.id}
              onClick={() => onTheorySelect(theory.id)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 text-left group ${
                isActive
                  ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30 scale-105"
                  : isComplete
                  ? "border-green-500/50 bg-green-500/10 hover:border-green-500/70 hover:scale-102"
                  : "border-slate-600/50 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50"
              }`}
            >
              {/* Theory Color Indicator */}
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                style={{ backgroundColor: theoryColor }}
              />
              
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-semibold truncate ${
                      isActive ? "text-white" : isComplete ? "text-green-300" : "text-gray-300"
                    }`}>
                      {theory.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {isComplete ? "Completed" : "Not started"}
                  </div>
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {activeTheory && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-600/50">
          <button
            onClick={onPreviousTheory}
            disabled={!hasPrevious}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              hasPrevious
                ? "bg-slate-700/80 text-white hover:bg-slate-600 border border-slate-600/50"
                : "bg-slate-800/50 text-gray-500 cursor-not-allowed border border-slate-700/50"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Theory
          </button>

          <div className="text-sm text-gray-400">
            {theories.findIndex(t => t.id === activeTheory) + 1} of {theories.length}
          </div>

          <button
            onClick={onNextTheory}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              hasNext
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/50"
                : "bg-slate-800/50 text-gray-500 cursor-not-allowed border border-slate-700/50"
            }`}
          >
            Next Theory
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Start Button */}
      {!activeTheory && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              const next = theories.find(t => !isTheoryComplete(t.id));
              if (next) {
                onTheorySelect(next.id);
              } else {
                // All complete, start from first
                onTheorySelect(theories[0].id);
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Start Theory Analysis
          </button>
        </div>
      )}
    </div>
  );
}
