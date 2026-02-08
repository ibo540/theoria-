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
  setActiveTheory: (theory: TheoryType | null) => void;
  toggleTheory: (theory: TheoryType) => void;
  setIconVersion: (version: IconVersion) => void;
  toggleIconVersion: () => void;
  getTheoryColor: (theory: TheoryType) => string;
  getTheoryDarkColor: (theory: TheoryType) => string;
  getCurrentTheoryColor: () => string | null;
  getCurrentTheoryDarkColor: () => string | null;
}

export const useTheoryStore = create<TheoryStore>((set, get) => ({
  activeTheory: null,
  iconVersion: "v-4" as IconVersion,
  setActiveTheory: (theory) => set({ activeTheory: theory }),
  toggleTheory: (theory) =>
    set((state) => ({
      activeTheory: state.activeTheory === theory ? null : theory,
    })),
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
}));
