import {
  Flame, Waves, Car, HeartPulse, ShieldAlert, Mountain, UserSearch,
  Wind, Megaphone, Users, MoreHorizontal,
} from "lucide-react";

// Icon for each alert_type a dispatcher can post (see the dispatcher app's
// src/lib/alertTypes.js — keep these lists in sync).
export const ALERT_TYPE_ICONS = {
  Fire: Flame,
  Flood: Waves,
  Typhoon: Wind,
  Earthquake: Mountain,
  Landslide: Mountain,
  "Vehicular Accident": Car,
  "Medical Emergency": HeartPulse,
  "Crime in Progress": ShieldAlert,
  "Evacuation Notice": Users,
  "General Advisory": Megaphone,
  "Missing Person": UserSearch,
  Other: MoreHorizontal,
};

export function alertTypeIcon(type) {
  return ALERT_TYPE_ICONS[type] || ShieldAlert;
}

export const THREAT_LEVELS = {
  low: { label: "Low", color: "#20c96b", bg: "#e5f8ee" },
  moderate: { label: "Moderate", color: "#c98a1a", bg: "#fff2e0" },
  high: { label: "High", color: "#e0530a", bg: "#fdece0" },
  critical: { label: "Critical", color: "#ff3b3b", bg: "#fdeaea" },
};

export function threatLevelMeta(value) {
  return THREAT_LEVELS[value] || THREAT_LEVELS.low;
}
