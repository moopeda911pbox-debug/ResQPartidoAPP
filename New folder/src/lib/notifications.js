import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Mirrors lib/geolocation.js: on a device built with Capacitor this pops the
// real native "Allow notifications?" system dialog; in a regular browser
// there's no equivalent for local notifications, so it's a no-op there
// (the toggle still saves the person's preference either way).
// Returns true if permission is granted, false otherwise.
export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

export async function hasNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

const STATUS_NOTIF = {
  acknowledged: (incidentType) => ({
    title: "Your report was verified",
    body: `A dispatcher confirmed your ${incidentType || "emergency"} report and is on it.`,
  }),
  resolved: (incidentType) => ({
    title: "Your report has been responded to",
    body: `Dispatch marked your ${incidentType || "emergency"} report as resolved.`,
  }),
};// Fires the OS notification for a status change on one of the citizen's own
// incident reports (dispatcher verified it / marked it responded-to).
// Silently does nothing if notifications aren't permitted or the status
// isn't one we have a message for (e.g. it went back to "pending").
export async function notifyIncidentStatusChange(incident) {
  const build = STATUS_NOTIF[incident.status];
  if (!build) return;
  if (!(await hasNotificationPermission())) return;

  const { title, body } = build(incident.incident_type);
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 1_000_000), // Capacitor requires a numeric id; a fresh one per call is fine since we don't need to cancel/replace these
          title,
          body,
        },
      ],
    });
  } catch {
    // Best-effort — a missed notification shouldn't break anything else in the app.
  }
}

// --- Incoming call notification -------------------------------------------
// CallContext already shows an in-app "ringing" overlay the moment the
// offer broadcast arrives, but that only helps if the person is actually
// looking at the screen right then. This mirrors that same event as a real
// system notification — with Answer/Decline buttons on it — so a call
// still surfaces if the phone is locked or the app is just sitting in the
// background. It relies on the app process still being alive to receive
// the Realtime broadcast in the first place; it does NOT wake the app from
// fully closed/killed (that needs an actual push notification instead —
// see lib/pushNotifications.js).

// Fixed (not random like STATUS_NOTIF above) so we can reliably cancel this
// exact notification once the call is answered, declined, or ended.
const INCOMING_CALL_NOTIF_ID = 999001;
const INCOMING_CALL_ACTION_TYPE = "incoming-call";

// Call once at app startup (CallContext does this). Registers the
// Answer/Decline buttons that appear directly on the notification. Safe to
// call more than once.
export async function registerCallNotificationActions() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: INCOMING_CALL_ACTION_TYPE,
          actions: [
            { id: "answer", title: "Answer" },
            { id: "decline", title: "Decline", destructive: true },
          ],
        },
      ],
    });
  } catch {
    // Best-effort — worst case the notification still shows, just without
    // the inline action buttons (a tap still opens the app to the overlay).
  }
}

export async function notifyIncomingCall(dispatcherName) {
  if (!(await hasNotificationPermission())) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: INCOMING_CALL_NOTIF_ID,
          title: "Incoming call",
          body: `${dispatcherName || "A dispatcher"} is calling`,
          actionTypeId: INCOMING_CALL_ACTION_TYPE,
          ongoing: true, // can't be swiped away while it's still ringing
        },
      ],
    });
  } catch {
    // Best-effort — the in-app ringing overlay still works even if this fails.
  }
}

export async function cancelIncomingCallNotification() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: INCOMING_CALL_NOTIF_ID }] });
  } catch {
    // No-op if it was never shown or already cleared — nothing to handle.
  }
}
