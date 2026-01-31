"use client";

import { create } from "zustand";
import maplibregl from "maplibre-gl";
import { MarkerData } from "@/components/marker";

interface MapStore {
  bearing: number;
  setBearing: (bearing: number) => void;
  resetToNorth: () => void;
  mapInstance: maplibregl.Map | null;
  setMapInstance: (map: maplibregl.Map | null) => void;
  highlightsVisible: boolean;
  setHighlightsVisible: (visible: boolean) => void;
  toggleHighlights: () => void;
  focusedMarker: [number, number] | null;
  setFocusedMarker: (coords: [number, number] | null) => void;
  selectedMarker: MarkerData | null;
  setSelectedMarker: (marker: MarkerData | null) => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  bearing: 0,
  setBearing: (bearing) => set({ bearing }),
  resetToNorth: () => {
    const { mapInstance } = get();
    if (mapInstance) {
      mapInstance.easeTo({
        bearing: 0,
        duration: 500,
      });
    }
    set({ bearing: 0 });
  },
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
  highlightsVisible: false,
  setHighlightsVisible: (visible) => set({ highlightsVisible: visible }),
  toggleHighlights: () =>
    set((state) => ({ highlightsVisible: !state.highlightsVisible })),
  focusedMarker: null,
  setFocusedMarker: (coords) => set({ focusedMarker: coords }),
  selectedMarker: null,
  setSelectedMarker: (marker) => set({ selectedMarker: marker }),
}));



