import React, { useEffect, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
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

export default function IncomingCallOverlay() {
  const { callState, caller, muted, errorMsg, answerCall, rejectCall, hangUp, toggleMute } = useCall();
  const duration = useCallDuration(callState === "active");

  if (callState === "idle") return null;

  const statusLabel = {
    ringing: "Incoming call",
    connecting: "Connecting…",
    active: duration,
    ended: "Call ended",
  }[callState];

  return (
    <div style={overlayStyle}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={avatarStyle}>{(caller?.name || "D")[0].toUpperCase()}</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>{caller?.name || "Dispatcher"}</div>
        {caller?.incidentType && <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>{caller.incidentType}</div>}
        <div style={{ marginTop: 10, fontSize: 14, opacity: 0.85 }}>
          📶 {statusLabel}
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Calling over internet, not your phone plan</div>
        </div>
        {errorMsg && <div style={{ marginTop: 10, color: "#ff8a8a", fontSize: 13 }}>{errorMsg}</div>}
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 48, alignItems: "center" }}>
        {callState === "ringing" && (
          <>
            <button style={{ ...circleBtn, background: "#e5372f" }} onClick={rejectCall} aria-label="Decline">
              <PhoneOff color="#fff" size={26} />
            </button>
            <button style={{ ...circleBtn, background: "#20c96b" }} onClick={answerCall} aria-label="Answer">
              <Phone color="#fff" size={26} />
            </button>
          </>
        )}
        {(callState === "connecting" || callState === "active") && (
          <>
            <button style={{ ...circleBtn, background: muted ? "#fff" : "#3a3f4a" }} onClick={toggleMute} aria-label="Mute">
              {muted ? <MicOff color="#111" size={22} /> : <Mic color="#fff" size={22} />}
            </button>
            <button style={{ ...circleBtn, background: "#e5372f" }} onClick={hangUp} aria-label="Hang up">
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
