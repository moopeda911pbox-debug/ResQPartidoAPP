import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { capacitorStorageAdapter } from "./capacitorStorage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.local.example to .env.local and fill in your Supabase project values."
  );
}

// In the Android app, use native Preferences storage so a signed-in session
// survives the WebView clearing localStorage — that's what was causing
// surprise logouts. In a plain browser tab, stick with the client's normal
// (localStorage-based) default; Capacitor's Preferences plugin isn't needed
// there and this keeps web behavior unchanged.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // needed for the Google/Facebook sign-in redirect flow
    ...(Capacitor.isNativePlatform() ? { storage: capacitorStorageAdapter } : {}),
  },
});
