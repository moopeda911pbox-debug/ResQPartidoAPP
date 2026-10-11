import { Flame, Waves, Car, HeartPulse, ShieldAlert, Mountain, UserSearch, MoreHorizontal } from "lucide-react";

// agency: which responder this type typically routes to — PNP | BFP | MDRRMO
export const INCIDENT_TYPES = [
  { label: "Fire", icon: Flame, agency: "BFP" },
  { label: "Flood", icon: Waves, agency: "MDRRMO" },
  { label: "Vehicular Accident", icon: Car, agency: "PNP" },
  { label: "Medical Emergency", icon: HeartPulse, agency: "MDRRMO" },
  { label: "Crime in Progress", icon: ShieldAlert, agency: "PNP" },
  { label: "Landslide", icon: Mountain, agency: "MDRRMO" },
  { label: "Missing Person", icon: UserSearch, agency: "PNP" },
  { label: "Other", icon: MoreHorizontal, agency: "MDRRMO" },
];

// Looks up the icon for a plain type ("Fire") or an SOS-prefixed one
// ("SOS: Fire", as sent by the Emergency button on Home).
export function iconForType(label) {
  const bare = (label || "").replace(/^SOS:\s*/, "");
  return INCIDENT_TYPES.find((t) => t.label === bare)?.icon || ShieldAlert;
}
