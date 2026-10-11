import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

// Local notifications (lib/notifications.js) only fire while this app's JS
// is alive — foreground, or freshly backgrounded with a live Realtime
// connection. They can't reach a citizen once the app is fully closed or
// the OS has killed the process, which matters for an emergency alert
// feature. Push notifications (FCM under the hood) are delivered by the OS
// itself, so they still arrive even then. This module owns registering the
// device with FCM and keeping Supabase's record of "this device belongs to
// this citizen" up to date.

// Remembered so signOut() can delete the right row without re-reading it
// from the native plugin.
let currentToken = null;
let listenersRegistered = false;

function registerListenersOnce(userId) {
  if (listenersRegistered) return;
  listenersRegistered = true;

  PushNotifications.addListener("registration", async (token) => {
    currentToken = token.value;
    try {
      // Upsert on the token itself (not user_id): if this physical device
      // previously belonged to a different citizen who didn't sign out
      // cleanly, this device's next registration should still take over the
      // row rather than fail on a duplicate token. See the RLS policy in
      // supabase/device_tokens_schema.sql for the matching "claim" rule.
      await supabase.from("device_tokens").upsert(
        {
          token: token.value,
          user_id: userId,
          platform: Capacitor.getPlatform(), // "android" (or "ios" if this app ever ships there)
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );
    } catch {
      // Best-effort — a failed sync just means this device won't get pushes
      // until the next app open/registration; nothing else should break.
    }
  });

  PushNotifications.addListener("registrationError", () => {
    // Best-effort feature; nothing for the user to see or recover from here.
  });

  // Payload arrives but Android/iOS already show the system notification
  // for a normal (non-data-only) push, so there's nothing to render here.
  // Kept as a hook in case a future feature needs to react in-app (e.g.
  // refresh the alert list the moment a broadcast push lands).
  PushNotifications.addListener("pushNotificationReceived", () => {});

  // Fires when the citizen taps the system notification. `action.notification.data`
  // is whatever the sender attached (e.g. { alertId } or { incidentId }) —
  // left as a no-op for now; wire this up if/when notifications should deep
  // link to a specific alert or incident screen.
  PushNotifications.addListener("pushNotificationActionPerformed", () => {});
}

// Call once a session exists (see AuthContext). No-ops in a plain browser
// tab — push notifications need the native FCM/APNs registration that only
// exists inside the Capacitor-built app.
export async function initPushNotifications(userId) {
  if (!Capacitor.isNativePlatform() || !userId) return;

  registerListenersOnce(userId);

  try {
    const permStatus = await PushNotifications.checkPermissions();
    let granted = permStatus.receive === "granted";

    if (permStatus.receive === "prompt" || permStatus.receive === "prompt-with-rationale") {
      const requested = await PushNotifications.requestPermissions();
      granted = requested.receive === "granted";
    }

    if (granted) await PushNotifications.register();
  } catch {
    // Best-effort — device just won't receive push alerts.
  }
}

// Call on sign-out so this device stops being associated with the account
// that just logged out (otherwise the next person to use this phone could
// keep receiving the previous citizen's incident-status pushes).
export async function clearPushToken(userId) {
  if (!Capacitor.isNativePlatform() || !currentToken || !userId) return;
  try {
    await supabase.from("device_tokens").delete().eq("token", currentToken).eq("user_id", userId);
  } catch {
    // Best-effort — worst case this device keeps a stale row until it's
    // overwritten by the next citizen's registration on it.
  }
}
