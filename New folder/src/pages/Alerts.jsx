import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Video as VideoIcon, Expand, X } from "lucide-react";
import { TopBar } from "../components/UI";
import { getActiveAlerts, subscribeToAlerts } from "../services/alerts";
import { alertTypeIcon, threatLevelMeta } from "../lib/alertTypes";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Full-screen viewer for a tapped photo/video: { type: "photo" | "video", url }
  const [viewMedia, setViewMedia] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getActiveAlerts();
      setAlerts(data);
      setError("");
    } catch (err) {
      setError(err.message || "Couldn't load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToAlerts(refresh);
    const interval = setInterval(refresh, 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  return (
    <div className="screen">
      <TopBar title="Emergency Alerts" onBack={() => navigate("/home")} />
      <div style={{ padding: 16, overflowY: "auto" }}>
        {loading && <p style={{ fontSize: 13, color: "#8a929c" }}>Loading alerts...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && alerts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a929c", fontSize: 12.5 }}>
            No active alerts right now. We'll notify you here if a dispatcher posts one.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map((a) => {
            const Icon = alertTypeIcon(a.alert_type);
            const threat = threatLevelMeta(a.threat_level);
            const media = a.emergency_alert_media ?? [];
            const photo = media.find((m) => m.file_type === "photo");
            const video = media.find((m) => m.file_type === "video");
            return (
              <div key={a.id} style={{ borderRadius: 14, border: "1px solid #eceff3", overflow: "hidden" }}>
                {photo && (
                  <button
                    type="button"
                    className="alert-media-thumb"
                    onClick={() => setViewMedia({ type: "photo", url: photo.file_url })}
                    aria-label="View photo full screen"
                  >
                    <img src={photo.file_url} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                    <span className="alert-media-thumb-badge"><Expand size={13} /></span>
                  </button>
                )}
                {!photo && video && (
                  <button
                    type="button"
                    className="alert-media-thumb"
                    onClick={() => setViewMedia({ type: "video", url: video.file_url })}
                    aria-label="View video full screen"
                  >
                    <video src={video.file_url} preload="metadata" style={{ width: "100%", height: 150, objectFit: "cover", display: "block", background: "#000" }} />
                    <span className="alert-media-thumb-badge"><Expand size={13} /></span>
                  </button>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 700,
                        padding: "3px 9px", borderRadius: 999, background: threat.bg, color: threat.color,
                      }}
                    >
                      {threat.label} threat
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "#0f2545" }}>
                      <Icon size={12} /> {a.alert_type}
                    </span>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", margin: "0 0 4px" }}>{a.title}</p>
                  <p style={{ fontSize: 12, color: "#4a5568", margin: "0 0 8px", lineHeight: 1.5 }}>{a.description}</p>

                  {(a.municipality || a.address) && (
                    <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#8a929c", margin: "0 0 4px" }}>
                      <MapPin size={12} /> {[a.municipality, a.address].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {photo && video && (
                    <button
                      type="button"
                      className="alert-video-also-btn"
                      onClick={() => setViewMedia({ type: "video", url: video.file_url })}
                    >
                      <VideoIcon size={12} /> Video also attached — tap to view
                    </button>
                  )}

                  <p style={{ fontSize: 10.5, color: "#8a929c", margin: 0 }}>{timeAgo(a.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewMedia && (
        <div className="media-lightbox-overlay" onClick={() => setViewMedia(null)}>
          <button
            type="button"
            className="media-lightbox-close"
            onClick={() => setViewMedia(null)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div className="media-lightbox-content" onClick={(e) => e.stopPropagation()}>
            {viewMedia.type === "photo" ? (
              <img src={viewMedia.url} alt="" className="media-lightbox-media" />
            ) : (
              <video src={viewMedia.url} controls autoPlay className="media-lightbox-media" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
