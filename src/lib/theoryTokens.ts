import { TheoryType, IconVersion } from "@/stores/useTheoryStore";

export const THEORY_LABELS: Record<TheoryType, string> = {
  constructivism: "Constructivism",
  englishschool: "English School",
  liberalism: "Liberalism",
  neoliberal: "Neoliberalism",
  neorealism: "Neorealism",
  realism: "Realism",
};

export const THEORY_COLORS: Record<TheoryType, string> = {
  realism: "var(--red)",
  neorealism: "var(--navy)",
  liberalism: "var(--blue)",
  neoliberal: "var(--green)",
  englishschool: "var(--purple)",
  constructivism: "var(--yellow)",
};

export const THEORY_COLORS_DARK: Record<TheoryType, string> = {
  realism: "#330d0c",
  neorealism: "#1a213d",
  liberalism: "#124347",
  neoliberal: "#1c3621",
  englishschool: "#29133a",
  constructivism: "#3e3015",
};

// V-3 icon paths (with spaces and capital letters)
const THEORY_SVG_PATHS_V3: Record<TheoryType, string> = {
  realism: "/assets/custom/theory-icons/v-3/Realism.svg",
  neorealism: "/assets/custom/theory-icons/v-3/Neorealism.svg",
  liberalism: "/assets/custom/theory-icons/v-3/Liberalism.svg",
  neoliberal: "/assets/custom/theory-icons/v-3/Neoliberal.svg",
  englishschool: "/assets/custom/theory-icons/v-3/English School.svg",
  constructivism: "/assets/custom/theory-icons/v-3/Constructivism.svg",
};

// V-4 icon paths
const THEORY_SVG_PATHS_V4: Record<TheoryType, string> = {
  realism: "/assets/custom/theory-icons/v-4/Realism.svg",
  neorealism: "/assets/custom/theory-icons/v-4/Empty.svg",
  liberalism: "/assets/custom/theory-icons/v-4/Empty.svg",
  neoliberal: "/assets/custom/theory-icons/v-4/Empty.svg",
  englishschool: "/assets/custom/theory-icons/v-4/Empty.svg",
  constructivism: "/assets/custom/theory-icons/v-4/Empty.svg",
};

// Get SVG path based on version
export const getTheorySvgPath = (
  theory: TheoryType,
  version: IconVersion
): string => {
  return version === "v-3"
    ? THEORY_SVG_PATHS_V3[theory]
    : THEORY_SVG_PATHS_V4[theory];
};

// Legacy export for backward compatibility (defaults to v-4)
export const THEORY_SVG_PATHS: Record<TheoryType, string> = THEORY_SVG_PATHS_V4;
