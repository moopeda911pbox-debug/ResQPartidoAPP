import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { TopBar } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { getMyIncidents } from "../services/incidents";
import { iconForType } from "../lib/incidentTypes";

// Same three statuses the dispatcher console writes back
// (see resq-dispatcher/src/services/incidents.js STATUS).
const STATUS_META = {
  pending: { label: "Pending", color: "#c98a1a", bg: "#fff2e0" },
  acknowledged: { label: "Verified", color: "#2f7cf6", bg: "#e8f0fe" },
  resolved: { label: "Responded", color: "#20c96b", bg: "#e5f8ee" },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "acknowledged", label: "Verified" },
  { key: "resolved", label: "Responded" },
];

export default function ReportHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyIncidents(user.id);
      setReports(data);
      setError("");
    } catch (err) {
      setError(err.message || "Couldn't load your reports.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="screen">
      <TopBar title="Report History" onBack={() => navigate("/home")} />
      <div style={{ padding: "16px 16px 32px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  border: active ? "1px solid var(--orange)" : "1px solid var(--border)",
                  background: active ? "var(--orange)" : "#fff",
                  color: active ? "#fff" : "var(--navy)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && <p style={{ fontSize: 13, color: "#8a929c" }}>Loading your reports...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a929c", fontSize: 12.5 }}>
            {filter === "all"
              ? "You haven't submitted any reports yet."
              : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} reports.`}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((r) => {
            const Icon = iconForType(r.incident_type);
            const status = STATUS_META[r.status] || STATUS_META.pending;
            const isSos = r.incident_type?.startsWith("SOS:");
            const media = r.incident_media ?? [];
            const hasPhoto = media.some((m) => m.file_type === "photo");
            const hasVideo = media.some((m) => m.file_type === "video");

            return (
              <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={15} color={isSos ? "#ff3b3b" : "#e0530a"} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0f2545" }}>
                      {r.incident_type?.replace(/^SOS:\s*/, "")}
                      {isSos ? " (SOS)" : ""}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
                      padding: "3px 9px", borderRadius: 999, background: status.bg, color: status.color, whiteSpace: "nowrap",
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                <p style={{ fontSize: 12.5, color: "#4a5568", lineHeight: 1.5, margin: "0 0 8px" }}>{r.description}</p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#8a929c" }}>
                  {(r.address || (r.latitude != null && r.longitude != null)) && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={11} /> {r.address || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                    </span>
                  )}
                  {hasPhoto && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <ImageIcon size={11} /> Photo
                    </span>
                  )}
                  {hasVideo && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <VideoIcon size={11} /> Video
                    </span>
                  )}
                  <span>{timeAgo(r.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
