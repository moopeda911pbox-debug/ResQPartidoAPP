import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, Bell, FileWarning, Phone, PhoneCall, ChevronRight, ShieldAlert,
  User, Settings, LogOut, ChevronLeft, History,
} from "lucide-react";
import { Logo, Popup, PrimaryButton, GhostButton } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext";
import { signOut } from "../services/auth";
import { submitIncidentReport } from "../services/incidents";
import { INCIDENT_TYPES } from "../lib/incidentTypes";
import { getCurrentPosition } from "../lib/geolocation";

const ACTIONS = [
  { key: "alerts", label: "Emergency Alerts", sub: "View warnings and active alerts", icon: Bell, bg: "#e0530a", to: "/alerts" },
  { key: "report", label: "Report Incidents", sub: "Report an ongoing emergency", icon: FileWarning, bg: "#0f2545", to: "/report-incident" },
  { key: "history", label: "Report History", sub: "Track the status of what you've reported", icon: History, bg: "#2f7cf6", to: "/report-history" },
  { key: "hotlines", label: "Emergency Hotlines", sub: "Quick access to emergency hotlines", icon: Phone, bg: "#c9a24b", to: "/hotlines" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callDispatcher, outgoingCallState, callState } = useCall();
  const [menuOpen, setMenuOpen] = useState(false);
  const [popup, setPopup] = useState(null); // "sosType" | "emergencyConfirm" | "emergencySent" | "logoutConfirm"
  const [sosType, setSosType] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [locationMissing, setLocationMissing] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  function getLocationOnce(options) {
    return getCurrentPosition(options);
  }

  // Try a quick high-accuracy fix first (GPS chip); if that fails or the
  // device hasn't warmed up the GPS yet, fall back to a longer, lower-
  // accuracy attempt (wifi/cell positioning) before giving up. A single
  // 8s high-accuracy attempt was silently failing indoors/on cold GPS and
  // sending the alert with no coordinates at all.
  async function getLocation() {
    const fast = await getLocationOnce({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
    if (fast) return fast;
    return getLocationOnce({ enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 });
  }

  async function sendEmergencyAlert() {
    setSending(true);
    setSendError("");
    try {
      const coords = await getLocation();
      const typeLabel = sosType?.label || "Unspecified";
      await submitIncidentReport(user.id, {
        incidentType: `SOS: ${typeLabel}`,
        description: `Emergency SOS — immediate assistance requested via the Emergency button. Reported type: ${typeLabel}.`,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      setLocationMissing(!coords);
      setPopup("emergencySent");
    } catch (err) {
      setSendError(err.message || "Couldn't send the alert. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="screen" style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={30} />
          <span className="brand-title" style={{ fontSize: 14 }}>
            ResQ<span>Partido</span>
          </span>
        </div>
        <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none" }}>
          <Menu size={22} color="#0f2545" />
        </button>
      </div>

      <div style={{ padding: "0 20px 24px", overflowY: "auto" }}>
        <p style={{ fontSize: 14, color: "#8a929c", marginBottom: 12 }}>Hello, {firstName}</p>

        <button
          onClick={() => { setSosType(null); setSendError(""); setPopup("sosType"); }}
          style={{
            width: "100%", borderRadius: 16, padding: 16, display: "flex", alignItems: "center",
            justifyContent: "space-between", color: "#fff", border: "none", marginBottom: 20,
            background: "linear-gradient(135deg, #e0530a 0%, #bf4508 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShieldAlert size={26} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Emergency</p>
              <p style={{ fontSize: 11, opacity: 0.9, margin: 0 }}>Tap here for immediate help</p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.7)", borderRadius: 999, padding: "4px 12px" }}>
            CALL NOW
          </span>
        </button>

        <button
          onClick={callDispatcher}
          disabled={outgoingCallState !== "idle" || callState !== "idle"}
          style={{
            width: "100%", borderRadius: 16, padding: 16, display: "flex", alignItems: "center",
            justifyContent: "space-between", color: "#fff", border: "none", marginBottom: 20,
            background: "linear-gradient(135deg, #20c96b 0%, #189654 100%)",
            opacity: outgoingCallState !== "idle" || callState !== "idle" ? 0.7 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PhoneCall size={26} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Call Dispatcher</p>
              <p style={{ fontSize: 11, opacity: 0.9, margin: 0 }}>
                {outgoingCallState === "idle" ? "Speak live with a dispatcher now" : "Calling…"}
              </p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.7)", borderRadius: 999, padding: "4px 12px" }}>
            LIVE CALL
          </span>
        </button>

        <p style={{ fontSize: 12, fontWeight: 600, color: "#0f2545", opacity: 0.7, marginBottom: 8 }}>QUICK ACTIONS</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => navigate(a.to)}
              style={{
                width: "100%", borderRadius: 16, padding: 16, display: "flex", alignItems: "center",
                justifyContent: "space-between", color: "#fff", border: "none", background: a.bg,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <a.icon size={22} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{a.label}</p>
                  <p style={{ fontSize: 11, opacity: 0.85, margin: 0 }}>{a.sub}</p>
                </div>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: "absolute", top: 0, right: 0, width: "65%", height: "100%", background: "#fff", boxShadow: "-4px 0 16px rgba(0,0,0,0.15)", padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <span className="brand-title" style={{ fontSize: 14 }}>
                ResQ<span>Partido</span>
              </span>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none" }}>
                <X size={18} color="#0f2545" />
              </button>
            </div>
            <button onClick={() => navigate("/profile")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "none", border: "none", fontSize: 14, fontWeight: 500, color: "#0f2545" }}>
              <User size={17} /> Profile
            </button>
            <button onClick={() => navigate("/report-history")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "none", border: "none", fontSize: 14, fontWeight: 500, color: "#0f2545" }}>
              <History size={17} /> Report History
            </button>
            <button onClick={() => navigate("/settings")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "none", border: "none", fontSize: 14, fontWeight: 500, color: "#0f2545" }}>
              <Settings size={17} /> Settings
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => { setMenuOpen(false); setPopup("logoutConfirm"); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "#ff3b3b" }}
            >
              <LogOut size={17} /> Logout
            </button>
          </div>
        </div>
      )}

      {popup === "sosType" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#fdeaea" }}>
            <ShieldAlert color="#ff3b3b" size={26} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>What kind of emergency?</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 16 }}>
            Select the type that best matches what's happening so we can route it to the right responder.
          </p>
          <div className="sos-type-grid">
            {INCIDENT_TYPES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => { setSosType(t); setPopup("emergencyConfirm"); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "12px 6px", borderRadius: 12, border: "1px solid var(--border)",
                  background: "#fff", color: "var(--navy)", fontSize: 11, fontWeight: 600,
                }}
              >
                <t.icon size={20} color="#e0530a" />
                {t.label}
              </button>
            ))}
          </div>
          <GhostButton onClick={() => setPopup(null)}>Cancel</GhostButton>
        </Popup>
      )}

      {popup === "emergencyConfirm" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#fdeaea" }}>
            {sosType ? <sosType.icon color="#ff3b3b" size={26} /> : <ShieldAlert color="#ff3b3b" size={26} />}
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>
            Send {sosType?.label || "emergency"} alert?
          </p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            This will immediately notify the nearest responders with your location and the type of emergency.
          </p>
          {sendError && <p className="error-text" style={{ marginBottom: 12 }}>{sendError}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton onClick={sendEmergencyAlert} disabled={sending}>
              {sending ? "Sending your location…" : "Yes, Send Alert"}
            </PrimaryButton>
            <GhostButton onClick={() => setPopup("sosType")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <ChevronLeft size={14} /> Change Type
            </GhostButton>
            <GhostButton onClick={() => setPopup(null)}>Cancel</GhostButton>
          </div>
        </Popup>
      )}

      {popup === "emergencySent" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Alert Sent!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            {locationMissing
              ? "Dispatchers have been notified, but we couldn't get your location — turn on Location for this browser/app and try resending if you're able to, or tell the dispatcher your location when they reach you."
              : "Dispatchers have been notified with your live location. Stay where you are if it's safe to do so."}
          </p>
          <PrimaryButton onClick={() => setPopup(null)}>Continue</PrimaryButton>
        </Popup>
      )}

      {popup === "logoutConfirm" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#fdece0" }}>
            <LogOut color="#e0530a" size={22} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Logging out?</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            Are you sure you want to log out of your account? You can always log back in anytime.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton onClick={handleLogout}>Log out</PrimaryButton>
            <GhostButton onClick={() => setPopup(null)}>Cancel</GhostButton>
          </div>
        </Popup>
      )}
    </div>
  );
}
