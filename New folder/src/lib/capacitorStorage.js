import { Preferences } from "@capacitor/preferences";

// Supabase persists the session (access + refresh token) to whatever
// storage object you give it. In the browser, the default (localStorage)
// is fine. But inside the Capacitor Android WebView, localStorage lives in
// app-private WebView storage that Android is allowed to clear under low
// storage pressure, or that can get wiped across some WebView updates —
// neither of which touches native app storage. Routing through Preferences
// (SharedPreferences on Android, UserDefaults on iOS) keeps the session
// somewhere far more durable, so "stay logged in" actually means it.
export const capacitorStorageAdapter = {
  async getItem(key) {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key, value) {
    await Preferences.set({ key, value });
  },
  async removeItem(key) {
    await Preferences.remove({ key });
  },
};
