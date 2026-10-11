import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// Resolves to { lat, lng } or null (on error / permission denied / no support).
// On a device built with Capacitor this goes through the native location
// permission dialog + GPS; in a regular browser (dev server, PWA) it falls
// back to navigator.geolocation so nothing changes for web users.
export async function getCurrentPosition(options = {}) {
  const opts = { enableHighAccuracy: true, timeout: 10000, ...options };

  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
        return null;
      }
      const pos = await Geolocation.getCurrentPosition(opts);
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  }

  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      opts
    );
  });
}

// Try a quick high-accuracy fix first (GPS chip); if that fails or the
// device hasn't warmed up the GPS yet, fall back to a longer, lower-accuracy
// attempt (wifi/cell positioning) before giving up. Mirrors the fallback
// Home.jsx already uses for the SOS button, pulled out here so anything
// else that needs "best effort, right now" location (like placing a live
// call) gets the same behavior instead of a single attempt that can fail
// silently indoors or on a cold GPS.
export async function getBestEffortLocation() {
  const fast = await getCurrentPosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
  if (fast) return fast;
  return getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 });
}
