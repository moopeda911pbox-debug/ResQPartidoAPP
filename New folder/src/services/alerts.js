import { supabase } from "../lib/supabase";

// Reads every alert a dispatcher has posted, newest first. `is_active` is
// left to the caller to filter on so a citizen can still see recently
// expired alerts if desired.
export async function getAlerts() {
  const { data, error } = await supabase
    .from("emergency_alerts")
    .select("*, emergency_alert_media(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveAlerts() {
  const { data, error } = await supabase
    .from("emergency_alerts")
    .select("*, emergency_alert_media(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Fires `callback` whenever a dispatcher posts, updates, or expires an
// alert so the app can refresh live without the citizen pulling to reload.
export function subscribeToAlerts(callback) {
  const channel = supabase
    .channel("citizen-emergency-alerts")
    .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
