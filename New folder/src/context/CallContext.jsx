import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "../lib/supabase";
import { createPeerConnection, getMicStream } from "../lib/webrtc";
import { getBestEffortLocation } from "../lib/geolocation";
import { useAuth } from "./AuthContext";
import {
  registerCallNotificationActions,
  notifyIncomingCall,
  cancelIncomingCallNotification,
} from "../lib/notifications";

const CallCtx = createContext(null);

// Channel naming must match the dispatcher app exactly: resq-dispatcher/src/context/CallContext.jsx
const channelName = (userId) => `call-${userId}`;

// --- Calling the dispatcher (citizen-initiated) -----------------------------
// There's no single dispatcher userId to dial — any signed-in dispatcher may
// pick up — so this doesn't reuse channelName() above. Instead:
//   1. This device joins a call-specific channel first (citizenCallChannelName)
//      and only THEN announces the call on the shared DISPATCHER_INBOX, so
//      there's no race where a dispatcher answers before we're listening.
//   2. Whichever dispatcher answers joins that same call-specific channel and
//      sends "dispatcher-ready" — only then do we create the SDP offer, since
//      we're the caller and it's still pointless to negotiate before someone
//      is actually on the other end.
//   3. If nobody answers in time, we cancel and let the person know.
// Naming must match resq-dispatcher/src/context/CallContext.jsx exactly.
const DISPATCHER_INBOX = "dispatcher-inbox";
const citizenCallChannelName = (callId) => `citizen-call-${callId}`;
const NO_ANSWER_TIMEOUT_MS = 30000;
// How old a pending_calls row can be before checkForPendingCall() ignores it
// as stale (e.g. the dispatcher gave up and moved on well before this device
// got a chance to check) rather than resurrecting a long-dead ring.
const PENDING_CALL_MAX_AGE_MS = 60000;

function newCallId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `call-${Date.now()}-${Math.random().toString(36).slice(2)}`; // fallback for older WebViews
}

export function CallProvider({ children }) {
  const { user } = useAuth();

  // --- incoming: a dispatcher calls this citizen (unchanged) ---
  const [callState, setCallState] = useState("idle"); // idle | ringing | connecting | active | ended
  const [caller, setCaller] = useState(null); // { name, incidentType }
  const [muted, setMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const channelRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingOfferRef = useRef(null); // sdp we haven't answered yet
  const pendingIceRef = useRef([]); // dispatcher's ICE candidates that arrive before we've tapped Answer (pc doesn't exist yet)
  const actionHandlersRef = useRef({ answerCall: null, rejectCall: null, checkForPendingCall: null }); // lets the notification/deep-link listeners below always call the latest handlers without re-registering themselves

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    pendingIceRef.current = [];
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  // Fills in the gap Realtime broadcast can't cover: if the app was closed
  // or backgrounded when the dispatcher's "offer" broadcast actually went
  // out, this device never received it, and never will — broadcasts aren't
  // queued for late subscribers. This looks up the same offer from
  // pending_calls instead (see pending_calls_schema.sql), which is written
  // by the dispatcher at the same moment as the broadcast. Called whenever
  // the app might have just woken up because of a call: on login/mount,
  // on foreground resume, and when opened via the notification's deep link.
  const checkForPendingCall = useCallback(async () => {
    if (!user?.id || callState !== "idle") return false; // already mid-call some other way
    try {
      const { data } = await supabase
        .from("pending_calls")
        .select("*")
        .eq("citizen_id", user.id)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return false;
      if (Date.now() - new Date(data.created_at).getTime() > PENDING_CALL_MAX_AGE_MS) return false;

      pendingOfferRef.current = data.sdp;
      setCaller({ name: data.dispatcher_name || "Dispatcher", incidentType: data.incident_type || "" });
      setCallState("ringing");
      notifyIncomingCall(data.dispatcher_name); // idempotent (fixed id) if the native banner already showed this
      return true;
    } catch {
      return false; // best-effort — the citizen just won't see this particular missed call
    }
  }, [user?.id, callState]);

  const endCall = useCallback(
    (notifyRemote = true) => {
      if (notifyRemote && channelRef.current) {
        channelRef.current.send({ type: "broadcast", event: "hangup", payload: {} });
      }
      cancelIncomingCallNotification();
      cleanup();
      setCallState("ended");
      setCaller(null);
      setMuted(false);
      setTimeout(() => setCallState((s) => (s === "ended" ? "idle" : s)), 1500);
    },
    [cleanup]
  );

  // Subscribe to our own inbound-call channel for as long as we're logged in,
  // regardless of which screen is open — an incoming call can arrive anytime.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(channelName(user.id));
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "offer" }, ({ payload }) => {
        pendingOfferRef.current = payload.sdp;
        setCaller({ name: payload.dispatcherName || "Dispatcher", incidentType: payload.incidentType || "" });
        setCallState("ringing");
        notifyIncomingCall(payload.dispatcherName);
      })
      .on("broadcast", { event: "ice-dispatcher" }, ({ payload }) => {
        if (!payload.candidate) return;
        // The dispatcher can start sending ICE candidates the instant the
        // offer goes out — often while this phone is still just ringing,
        // well before answerCall() below has created our peer connection.
        // Queue anything that arrives too early instead of dropping it, or
        // the call can end up with only one side's candidates and hang at
        // "Connecting…" forever even on a perfectly good network.
        if (pcRef.current && pcRef.current.remoteDescription) {
          pcRef.current.addIceCandidate(payload.candidate).catch(() => {});
        } else {
          pendingIceRef.current.push(payload.candidate);
        }
      })
      .on("broadcast", { event: "hangup" }, () => {
        endCall(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id, endCall]);

  const answerCall = useCallback(async () => {
    if (!pendingOfferRef.current || !channelRef.current) return;
    cancelIncomingCallNotification();
    if (user?.id) {
      supabase.from("pending_calls").update({ status: "answered" }).eq("citizen_id", user.id).eq("status", "ringing");
    }
    setCallState("connecting");
    setErrorMsg("");
    try {
      const stream = await getMicStream();
      localStreamRef.current = stream;

      const pc = createPeerConnection({
        onIceCandidate: (candidate) => {
          channelRef.current?.send({ type: "broadcast", event: "ice-citizen", payload: { candidate } });
        },
        onTrack: (remoteStream) => {
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
        },
        onConnectionStateChange: (state) => {
          if (state === "connected") setCallState("active");
          if (state === "failed" || state === "disconnected" || state === "closed") {
            if (state === "failed") setErrorMsg("Call connection failed — check your internet connection.");
          }
        },
      });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(pendingOfferRef.current);
      // Flush any of the dispatcher's ICE candidates that arrived while we
      // were still ringing — see the queueing note on "ice-dispatcher" above.
      pendingIceRef.current.splice(0).forEach((candidate) => {
        pc.addIceCandidate(candidate).catch(() => {});
      });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current.send({ type: "broadcast", event: "answer", payload: { sdp: answer } });
    } catch (err) {
      setErrorMsg(err?.message?.includes("Permission") || err?.name === "NotAllowedError"
        ? "Microphone permission is needed to answer the call."
        : "Couldn't start the call. Check your connection and try again.");
      cleanup();
      setCallState("idle");
      setCaller(null);
    }
  }, [cleanup, user?.id]);

  const rejectCall = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "reject", payload: {} });
    cancelIncomingCallNotification();
    if (user?.id) {
      supabase.from("pending_calls").update({ status: "rejected" }).eq("citizen_id", user.id).eq("status", "ringing");
    }
    pendingOfferRef.current = null;
    setCallState("idle");
    setCaller(null);
  }, [user?.id]);

  // Keep the ref current every render so the one-time listeners below never
  // call a stale closure.
  useEffect(() => {
    actionHandlersRef.current = { answerCall, rejectCall, checkForPendingCall };
  }, [answerCall, rejectCall, checkForPendingCall]);

  // Registered once for the life of the app (not per-call): lets someone tap
  // Answer/Decline directly on the system notification instead of having to
  // open the app first. `pendingOfferRef` guards against acting on a stale
  // tap after the call already ended some other way.
  useEffect(() => {
    registerCallNotificationActions();
    const listener = LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      if (!pendingOfferRef.current) return; // call already answered/ended/expired
      if (action.actionId === "answer") actionHandlersRef.current.answerCall?.();
      else if (action.actionId === "decline") actionHandlersRef.current.rejectCall?.();
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  // Covers the fully-closed-app case: CallMessagingService.java (native)
  // shows the actual notification and its Answer/Decline buttons — this
  // just handles what happens once tapping one of them reopens the app via
  // resqpartido://call?action=... (see AndroidManifest.xml). Also fires for
  // a plain notification tap ("ring"), which just needs the pending call
  // loaded so the existing ringing overlay renders.
  useEffect(() => {
    const listener = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      let action;
      try {
        action = new URL(url).searchParams.get("action");
      } catch {
        return; // not our deep link
      }
      if (!action) return;

      const found = await actionHandlersRef.current.checkForPendingCall?.();
      if (!found) return; // nothing to act on — e.g. dispatcher already cancelled it
      if (action === "answer") actionHandlersRef.current.answerCall?.();
      else if (action === "decline") actionHandlersRef.current.rejectCall?.();
      // "ring" needs no further action — checkForPendingCall already set
      // callState to "ringing", which is what the overlay renders from.
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  // Covers everything else: a normal cold start or login while a call is
  // already ringing (app opened independently of the notification), and an
  // app resumed from background that may have missed the Realtime broadcast
  // while it was suspended.
  useEffect(() => {
    checkForPendingCall();
    const listener = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) checkForPendingCall();
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, [checkForPendingCall]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }, [muted]);

  // --- outgoing: this citizen calls the dispatcher pool ---
  const [outgoingCallState, setOutgoingCallState] = useState("idle"); // idle | calling | connecting | active | ended | no-answer | failed
  const [outgoingDispatcherName, setOutgoingDispatcherName] = useState("");
  const [outgoingMuted, setOutgoingMuted] = useState(false);
  const [outgoingErrorMsg, setOutgoingErrorMsg] = useState("");

  const outboundChannelRef = useRef(null); // the per-call signaling channel
  const outboundInboxRef = useRef(null); // shared channel, used just to announce/cancel
  const outboundPcRef = useRef(null);
  const outboundStreamRef = useRef(null);
  const outboundAudioRef = useRef(null);
  const outboundTimeoutRef = useRef(null);
  const outboundClaimedRef = useRef(false); // has a dispatcher answered yet?
  const outboundCallIdRef = useRef(null);
  const outboundPendingIceRef = useRef([]); // dispatcher's ICE candidates arriving before setRemoteDescription completes

  const cleanupOutbound = useCallback(() => {
    if (outboundTimeoutRef.current) {
      clearTimeout(outboundTimeoutRef.current);
      outboundTimeoutRef.current = null;
    }
    outboundPcRef.current?.close();
    outboundPcRef.current = null;
    outboundStreamRef.current?.getTracks().forEach((t) => t.stop());
    outboundStreamRef.current = null;
    if (outboundChannelRef.current) {
      supabase.removeChannel(outboundChannelRef.current);
      outboundChannelRef.current = null;
    }
    if (outboundInboxRef.current) {
      supabase.removeChannel(outboundInboxRef.current);
      outboundInboxRef.current = null;
    }
    if (outboundAudioRef.current) outboundAudioRef.current.srcObject = null;
    outboundCallIdRef.current = null;
    outboundPendingIceRef.current = [];
  }, []);

  const endOutgoingCall = useCallback(
    (state = "ended", notifyRemote = true) => {
      if (notifyRemote) {
        if (outboundClaimedRef.current && outboundChannelRef.current) {
          outboundChannelRef.current.send({ type: "broadcast", event: "hangup", payload: {} });
        } else if (!outboundClaimedRef.current && outboundInboxRef.current) {
          // Nobody's picked up yet — clear this call out of every dispatcher's queue.
          outboundInboxRef.current.send({
            type: "broadcast",
            event: "cancelled",
            payload: { callId: outboundCallIdRef.current },
          });
        }
      }
      cleanupOutbound();
      outboundClaimedRef.current = false;
      setOutgoingCallState(state);
      setOutgoingMuted(false);
      const revertDelay = state === "no-answer" ? 3500 : 1800;
      setTimeout(() => setOutgoingCallState((s) => (s === state ? "idle" : s)), revertDelay);
    },
    [cleanupOutbound]
  );

  const callDispatcher = useCallback(async () => {
    if (callState !== "idle" || outgoingCallState !== "idle") return; // already busy on another call

    setOutgoingErrorMsg("");
    setOutgoingDispatcherName("");
    setOutgoingCallState("calling");
    outboundClaimedRef.current = false;

    const callId = newCallId();
    outboundCallIdRef.current = callId;
    const meta = user?.user_metadata || {};
    const displayName = [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim() || user?.email || "Citizen";

    try {
      const stream = await getMicStream();
      outboundStreamRef.current = stream;

      const channel = supabase.channel(citizenCallChannelName(callId));
      outboundChannelRef.current = channel;

      const pc = createPeerConnection({
        onIceCandidate: (candidate) => {
          channel.send({ type: "broadcast", event: "ice-citizen", payload: { candidate } });
        },
        onTrack: (remoteStream) => {
          if (outboundAudioRef.current) outboundAudioRef.current.srcObject = remoteStream;
        },
        onConnectionStateChange: (state) => {
          if (state === "connected") setOutgoingCallState("active");
          if (state === "failed") {
            setOutgoingErrorMsg("Call connection failed — check your internet connection.");
            endOutgoingCall("failed", false);
          }
        },
      });
      outboundPcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      channel
        .on("broadcast", { event: "dispatcher-ready" }, async ({ payload }) => {
          outboundClaimedRef.current = true;
          if (outboundTimeoutRef.current) {
            clearTimeout(outboundTimeoutRef.current);
            outboundTimeoutRef.current = null;
          }
          setOutgoingDispatcherName(payload.dispatcherName || "Dispatcher");
          setOutgoingCallState("connecting");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (!outboundPcRef.current) return;
          await outboundPcRef.current.setRemoteDescription(payload.sdp);
          // Flush any dispatcher ICE candidates that arrived just ahead of the answer.
          outboundPendingIceRef.current.splice(0).forEach((candidate) => {
            outboundPcRef.current.addIceCandidate(candidate).catch(() => {});
          });
        })
        .on("broadcast", { event: "ice-dispatcher" }, ({ payload }) => {
          if (!payload.candidate) return;
          if (outboundPcRef.current && outboundPcRef.current.remoteDescription) {
            outboundPcRef.current.addIceCandidate(payload.candidate).catch(() => {});
          } else {
            outboundPendingIceRef.current.push(payload.candidate);
          }
        })
        .on("broadcast", { event: "hangup" }, () => endOutgoingCall("ended", false))
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED") return;

          const inbox = supabase.channel(DISPATCHER_INBOX);
          outboundInboxRef.current = inbox;
          inbox.subscribe(async (inboxStatus) => {
            if (inboxStatus !== "SUBSCRIBED") return;
            const location = await getBestEffortLocation(); // best-effort — a missing fix still rings through
            inbox.send({
              type: "broadcast",
              event: "incoming-citizen-call",
              payload: {
                callId,
                citizenId: user?.id,
                name: displayName,
                phone: meta.phone || null,
                municipality: meta.municipality || null,
                incidentType: "Live call from citizen",
                location,
              },
            });
          });
        });

      // Give up if no dispatcher answers in time, rather than ringing forever.
      outboundTimeoutRef.current = setTimeout(() => {
        if (!outboundClaimedRef.current) endOutgoingCall("no-answer", true);
      }, NO_ANSWER_TIMEOUT_MS);
    } catch (err) {
      setOutgoingErrorMsg(
        err?.name === "NotAllowedError" ? "Microphone permission is needed to place the call." : "Couldn't start the call."
      );
      cleanupOutbound();
      setOutgoingCallState("idle");
    }
  }, [user, callState, outgoingCallState, endOutgoingCall, cleanupOutbound]);

  const toggleOutgoingMute = useCallback(() => {
    const stream = outboundStreamRef.current;
    if (!stream) return;
    const next = !outgoingMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setOutgoingMuted(next);
  }, [outgoingMuted]);

  return (
    <CallCtx.Provider
      value={{
        callState,
        caller,
        muted,
        errorMsg,
        answerCall,
        rejectCall,
        hangUp: () => endCall(true),
        toggleMute,

        outgoingCallState,
        outgoingDispatcherName,
        outgoingMuted,
        outgoingErrorMsg,
        callDispatcher,
        hangUpOutgoingCall: () => endOutgoingCall("ended", true),
        toggleOutgoingMute,
      }}
    >
      {children}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <audio ref={outboundAudioRef} autoPlay playsInline />
    </CallCtx.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallCtx);
  if (!ctx) throw new Error("useCall must be used inside CallProvider");
  return ctx;
}
