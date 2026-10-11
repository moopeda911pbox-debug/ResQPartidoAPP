import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "../lib/supabase";
import { getMyIncidents } from "../services/incidents";
import { notifyIncidentStatusChange } from "../lib/notifications";
import { initPushNotifications, clearPushToken } from "../lib/pushNotifications";

const AuthContext = createContext(null);
const NOTIF_PREF_KEY = "resq_pref_notifications";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Covers the account being archived while this device already has an
  // active session (Login's own check in services/auth.js only covers the
  // moment of a fresh sign-in) — a passive re-check on every session load,
  // right alongside the notification/refresh-token effects below.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    let cancelled = false;
    supabase
      .from("profiles")
      .select("is_archived")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data?.is_archived) return;
        setAuthError("This account has been archived. Contact an administrator to have it restored.");
        clearPushToken(userId).then(() => supabase.auth.signOut());
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Supabase's autoRefreshToken relies on a JS timer to renew the access
  // token before it expires — but that timer is paused whenever the app is
  // backgrounded (or the OS suspends it), same as any other JS on the page.
  // So without this, a token can quietly expire while the app is in your
  // pocket, and by the time you reopen it, it's already stale. Explicitly
  // resuming/pausing the refresh loop on app foreground/background (per
  // Supabase's own Capacitor guidance) keeps the session valid the moment
  // you come back, instead of occasionally bouncing you to the login screen.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      listenerPromise.then((handle) => handle.remove());
    };
  }, []);

  // Notify the citizen the moment a dispatcher verifies or resolves one of
  // THEIR OWN reports — e.g. "Verify"/"Mark Responded" in the dispatcher
  // console updates this incident's status, and this fires a local
  // notification here. This only fires while the app process is alive
  // (foreground, or freshly backgrounded) since it rides on a live realtime
  // connection — true push notifications that arrive even when the app is
  // fully closed would need a separate Firebase Cloud Messaging setup.
  const lastKnownStatusRef = useRef({});
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      lastKnownStatusRef.current = {};
      return;
    }

    let cancelled = false;
    getMyIncidents(userId)
      .then((incidents) => {
        if (cancelled) return;
        // Seed with what we already know so the very first realtime event
        // for an incident is compared against its real prior status, not
        // treated as a change from nothing.
        lastKnownStatusRef.current = Object.fromEntries(incidents.map((i) => [i.id, i.status]));
      })
      .catch(() => {});

    const channel = supabase
      .channel(`my-incidents-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "incidents", filter: `user_id=eq.${userId}` },
        ({ new: incident }) => {
          const previousStatus = lastKnownStatusRef.current[incident.id];
          lastKnownStatusRef.current[incident.id] = incident.status;
          if (previousStatus && previousStatus !== incident.status) {
            if (localStorage.getItem(NOTIF_PREF_KEY) === "false") return; // respects the Settings toggle
            notifyIncidentStatusChange(incident);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Registers this device for push notifications the moment a session
  // exists (including a session restored on app relaunch, not just a fresh
  // login). Deregistration on sign-out lives in services/auth.js and the
  // archived-account kick above, since both already know the user id at
  // the moment the session ends.
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) initPushNotifications(userId);
  }, [session?.user?.id]);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    authError,
    // Note: Settings/Home use services/auth.js's signOut() directly, not
    // this one — that's where push-token cleanup actually lives. This is
    // kept as a plain wrapper so anything using the context directly still
    // signs out correctly.
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
