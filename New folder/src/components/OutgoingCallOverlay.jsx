import React, { useEffect, useState } from "react";
import { PhoneOff, Mic, MicOff, Radio } from "lucide-react";
import { useCall } from "../context/CallContext";

function useCallDuration(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function OutgoingCallOverlay() {
  const {
    outgoingCallState,
    outgoingDispatcherName,
    outgoingMuted,
    outgoingErrorMsg,
    hangUpOutgoingCall,
    toggleOutgoingMute,
  } = useCall();
  const duration = useCallDuration(outgoingCallState === "active");

  if (outgoingCallState === "idle") return null;

  const statusLabel = {
    calling: "Calling dispatcher…",
    connecting: "Connecting…",
    active: duration,
    ended: "Call ended",
    "no-answer": "No dispatcher available right now",
    failed: "Call failed",
  }[outgoingCallState];

  const isRinging = outgoingCallState === "calling";
  const isLive = outgoingCallState === "connecting" || outgoingCallState === "active";
  const isTerminal = outgoingCallState === "ended" || outgoingCallState === "no-answer" || outgoingCallState === "failed";

  return (
    <div style={overlayStyle}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={avatarStyle}>
          {isRinging ? <Radio color="#fff" size={34} style={{ animation: "pulse 1.4s ease-in-out infinite" }} /> : "🚓"}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>
          {outgoingDispatcherName || "Emergency Dispatcher"}
        </div>
        <div style={{ marginTop: 10, fontSize: 14, opacity: 0.85 }}>
          📶 {statusLabel}
          {!isTerminal && (
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Calling over internet, not your phone plan</div>
          )}
        </div>
        {outgoingCallState === "no-answer" && (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75, maxWidth: 260 }}>
            Try again in a moment, or use the Emergency button to send an SOS report instead.
          </div>
        )}
        {outgoingErrorMsg && <div style={{ marginTop: 10, color: "#ff8a8a", fontSize: 13 }}>{outgoingErrorMsg}</div>}
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 48, alignItems: "center" }}>
        {isRinging && (
          <button style={{ ...circleBtn, background: "#e5372f" }} onClick={hangUpOutgoingCall} aria-label="Cancel call">
            <PhoneOff color="#fff" size={26} />
          </button>
        )}
        {isLive && (
          <>
            <button
              style={{ ...circleBtn, background: outgoingMuted ? "#fff" : "#3a3f4a" }}
              onClick={toggleOutgoingMute}
              aria-label="Mute"
            >
              {outgoingMuted ? <MicOff color="#111" size={22} /> : <Mic color="#fff" size={22} />}
            </button>
            <button style={{ ...circleBtn, background: "#e5372f" }} onClick={hangUpOutgoingCall} aria-label="Hang up">
              <PhoneOff color="#fff" size={26} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "linear-gradient(180deg,#1b1f27,#0e1015)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const avatarStyle = {
  width: 88,
  height: 88,
  borderRadius: "50%",
  background: "#2f7cf6",
  color: "#fff",
  fontSize: 36,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
};

const circleBtn = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
