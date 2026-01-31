"use client";

import React, { useMemo } from "react";
import {
  MapPin,
  Users,
  Crown,
  Shield,
  Flag,
  Building2,
  TrendingUp,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { MarkerData } from "./types";

interface MarkerIconProps {
  marker: MarkerData;
  size: number;
}

function getMarkerType(marker: MarkerData): LucideIcon {
  const name = marker.name.toLowerCase();
  const role = marker.role?.toLowerCase() || "";

  // Superpowers
  if (
    name.includes("united states") ||
    name.includes("soviet union") ||
    name.includes("russia") ||
    role.includes("superpower")
  ) {
    return Crown;
  }

  // Alliances/Blocs
  if (
    marker.isUnified ||
    name.includes("nato") ||
    name.includes("warsaw pact") ||
    name.includes("alliance") ||
    role.includes("bloc")
  ) {
    return Users;
  }

  // Frontline states
  if (name.includes("germany") || name.includes("korea") || role.includes("frontline")) {
    return Shield;
  }

  // Communist states
  if (
    name.includes("china") ||
    name.includes("cuba") ||
    name.includes("vietnam") ||
    role.includes("communist")
  ) {
    return Flag;
  }

  // Economic powers
  if (
    name.includes("japan") ||
    name.includes("west germany") ||
    role.includes("economic")
  ) {
    return TrendingUp;
  }

  // Democratic states
  if (
    name.includes("france") ||
    name.includes("united kingdom") ||
    name.includes("uk") ||
    role.includes("democratic")
  ) {
    return Building2;
  }

  // Neutral/Non-aligned
  if (
    name.includes("india") ||
    name.includes("sweden") ||
    name.includes("switzerland") ||
    role.includes("neutral") ||
    role.includes("non-aligned")
  ) {
    return Globe;
  }

  return MapPin;
}

export default function MarkerIcon({ marker, size }: MarkerIconProps) {
  const Icon = useMemo(() => getMarkerType(marker), [marker]);
  return <Icon size={size} color="#0f1114" />;
}
