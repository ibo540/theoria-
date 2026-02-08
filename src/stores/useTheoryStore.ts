"use client";

import { create } from "zustand";

export type TheoryType =
  | "constructivism"
  | "englishschool"
  | "liberalism"
  | "neoliberal"
  | "neorealism"
  | "realism";

// Theory color mappings (light versions)
const theoryColors: Record<TheoryType, string> = {
  realism: "#f9464c",
  neorealism: "#91beef",
  liberalism: "#7edef9",
  neoliberal: "#bbe581",
  englishschool: "#f5d6f9",
  constructivism: "#f3db66",
};

// Theory dark color mappings (for backgrounds and highlights)
const theoryDarkColors: Record<TheoryType, string> = {
  realism: "#330d0c",
  neorealism: "#1a213d",
  liberalism: "#124347",
  neoliberal: "#1c3621",
  englishschool: "#29133a",
  constructivism: "#3e3015",
};

export type IconVersion = "v-3" | "v-4";

interface TheoryStore {
  activeTheory: TheoryType | null;
  iconVersion: IconVersion;
  // Comparison mode
  comparisonMode: boolean;
  primaryTheory: TheoryType | null;
  secondaryTheory: TheoryType | null;
  
  setActiveTheory: (theory: TheoryType | null) => void;
  toggleTheory: (theory: TheoryType) => void;
  setIconVersion: (version: IconVersion) => void;
  toggleIconVersion: () => void;
  getTheoryColor: (theory: TheoryType) => string;
  getTheoryDarkColor: (theory: TheoryType) => string;
  getCurrentTheoryColor: () => string | null;
  getCurrentTheoryDarkColor: () => string | null;
  
  // Comparison mode actions
  enableComparison: (theory1: TheoryType, theory2: TheoryType) => void;
  disableComparison: () => void;
  setPrimaryTheory: (theory: TheoryType | null) => void;
  setSecondaryTheory: (theory: TheoryType | null) => void;
}

export const useTheoryStore = create<TheoryStore>((set, get) => ({
  activeTheory: null,
  iconVersion: "v-4" as IconVersion,
  comparisonMode: false,
  primaryTheory: null,
  secondaryTheory: null,
  
  setActiveTheory: (theory) => {
    // If setting a theory, disable comparison mode
    set({ 
      activeTheory: theory,
      comparisonMode: false,
      primaryTheory: null,
      secondaryTheory: null,
    });
  },
  toggleTheory: (theory) => {
    const state = get();
    // If in comparison mode, handle differently
    if (state.comparisonMode) {
      // If clicking primary theory, switch to single mode
      if (state.primaryTheory === theory) {
        set({
          activeTheory: state.secondaryTheory,
          comparisonMode: false,
          primaryTheory: null,
          secondaryTheory: null,
        });
      } else if (state.secondaryTheory === theory) {
        // If clicking secondary, switch to single mode with primary
        set({
          activeTheory: state.primaryTheory,
          comparisonMode: false,
          primaryTheory: null,
          secondaryTheory: null,
        });
      } else {
        // Replace secondary theory
        set({ secondaryTheory: theory });
      }
    } else {
      // Normal toggle behavior
      set({
        activeTheory: state.activeTheory === theory ? null : theory,
      });
    }
  },
  setIconVersion: (version) => set({ iconVersion: version }),
  toggleIconVersion: () =>
    set((state) => ({
      iconVersion: state.iconVersion === "v-3" ? "v-4" : "v-3",
    })),
  getTheoryColor: (theory) => theoryColors[theory],
  getTheoryDarkColor: (theory) => theoryDarkColors[theory],
  getCurrentTheoryColor: () => {
    const { activeTheory } = get();
    return activeTheory ? theoryColors[activeTheory] : null;
  },
  getCurrentTheoryDarkColor: () => {
    const { activeTheory } = get();
    return activeTheory ? theoryDarkColors[activeTheory] : null;
  },
  
  // Comparison mode actions
  enableComparison: (theory1, theory2) => {
    set({
      comparisonMode: true,
      primaryTheory: theory1,
      secondaryTheory: theory2,
      activeTheory: theory1, // Keep activeTheory for backward compatibility
    });
  },
  disableComparison: () => {
    const state = get();
    set({
      comparisonMode: false,
      primaryTheory: null,
      secondaryTheory: null,
      activeTheory: state.primaryTheory, // Keep primary as active
    });
  },
  setPrimaryTheory: (theory) => {
    set({ primaryTheory: theory });
    if (theory) {
      set({ activeTheory: theory }); // Update activeTheory for backward compatibility
    }
  },
  setSecondaryTheory: (theory) => {
    set({ secondaryTheory: theory });
    if (theory && !get().primaryTheory) {
      // If no primary, make this primary
      set({ primaryTheory: theory, activeTheory: theory });
    } else if (theory && get().primaryTheory) {
      // Enable comparison if both are set
      set({ comparisonMode: true });
    }
  },
}));
