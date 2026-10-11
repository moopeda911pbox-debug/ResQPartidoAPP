import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Video, MapPin, Navigation } from "lucide-react";
import { TopBar, SelectField, TextareaField, PrimaryButton, Popup } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { submitIncidentReport } from "../services/incidents";
import { INCIDENT_TYPES } from "../lib/incidentTypes";
import { getCurrentPosition } from "../lib/geolocation";

export default function ReportIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function locate() {
    setLocating(true);
    getCurrentPosition().then((coords) => {
      setCoords(coords);
      setLocating(false);
    });
  }

  React.useEffect(() => { locate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = incidentType && description.trim().length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      await submitIncidentReport(user.id, {
        incidentType,
        description,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        photoFile,
        videoFile,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <TopBar title="Report Incidents" onBack={() => navigate("/home")} />

      <form style={{ padding: 20, overflowY: "auto" }} onSubmit={handleSubmit}>
        <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 16 }}>Incident Details</p>

        <SelectField label="Incident Type *" value={incidentType} onChange={(e) => setIncidentType(e.target.value)} required>
          <option value="">Select incident type</option>
          {INCIDENT_TYPES.map((t) => (
            <option key={t.label}>{t.label}</option>
          ))}
        </SelectField>

        <TextareaField
          label="Description *"
          placeholder="Describe the incident in detail, include what happened, when it started, and any immediate danger."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <p style={{ fontSize: 12, fontWeight: 600, color: "#0f2545", marginBottom: 2 }}>Photo &amp; Videos</p>
        <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 12 }}>Add media to help authorities assess the situation</p>

        <label
          style={{
            width: "100%", height: 48, borderRadius: 12, border: `2px dashed ${photoFile ? "#e0530a" : "#e2e5ea"}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12,
            fontSize: 14, fontWeight: 500, color: photoFile ? "#e0530a" : "#0f2545", cursor: "pointer",
          }}
        >
          <Camera size={16} /> {photoFile ? photoFile.name : "Add Photo"}
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        </label>

        <label
          style={{
            width: "100%", height: 48, borderRadius: 12, border: `2px dashed ${videoFile ? "#e0530a" : "#e2e5ea"}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16,
            fontSize: 14, fontWeight: 500, color: videoFile ? "#e0530a" : "#0f2545", cursor: "pointer",
          }}
        >
          <Video size={16} /> {videoFile ? videoFile.name : "Add Videos"}
          <input type="file" accept="video/*" capture="environment" hidden onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
        </label>

        <div style={{ width: "100%", borderRadius: 12, border: "1px solid #e2e5ea", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={16} color="#e0530a" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#0f2545", margin: 0 }}>Current Location</p>
              <p style={{ fontSize: 10, color: "#8a929c", margin: 0 }}>
                {locating ? "Locating..." : coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Unavailable"}
              </p>
            </div>
          </div>
          <button type="button" onClick={locate} style={{ background: "none", border: "none" }}>
            <Navigation size={15} color="#8a929c" />
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <PrimaryButton type="submit" disabled={!canSubmit}>
          {submitting ? "Submitting..." : "Submit Report"}
        </PrimaryButton>
      </form>

      {submitted && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Report Submitted!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>Your report has been submitted to the dispatcher.</p>
          <PrimaryButton onClick={() => navigate("/home")}>Continue</PrimaryButton>
        </Popup>
      )}
    </div>
  );
}
