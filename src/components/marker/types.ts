import { TheoryType } from "@/stores/useTheoryStore";

export interface MarkerData {
  id: string;
  name: string;
  position: [number, number];
  isUnified?: boolean;
  role?: string;
  countries?: string[];
  country?: string;
  supportedTheories?: TheoryType[];
  perspectives?: Record<string, string>;
  // Timeline-specific fields
  coords?: [number, number];
  label?: string;
  kind?: string;
  size?: number;
  actorId?: string;
  timelinePointLabel?: string;
  timelinePointDescription?: string;
}
