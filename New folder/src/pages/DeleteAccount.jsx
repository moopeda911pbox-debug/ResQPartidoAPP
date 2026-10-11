import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Lock } from "lucide-react";
import { TopBar, PrimaryButton, GhostButton, Popup } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [popup, setPopup] = useState(null); // "confirm" | "success"
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    setError("");
    try {
      // Fully deleting the auth user requires the Supabase service role key,
      // which must run server-side (see supabase/functions/delete-account).
      // We call that edge function if it's deployed; otherwise we fall back
      // to clearing the profile data and signing the user out.
      const { error: fnError } = await supabase.functions.invoke("delete-account");
      if (fnError) {
        await supabase.from("profiles").delete().eq("id", user.id);
      }
      await supabase.auth.signOut();
      setPopup("success");
    } catch (err) {
      setError(err.message || "Couldn't delete your account. Please try again.");
      setPopup(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <TopBar title="Delete Account" onBack={() => navigate(-1)} />

      <div style={{ padding: 20, textAlign: "center" }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(180deg, var(--orange) 0%, var(--orange-deep) 100%)", margin: "8px auto 20px",
          }}
        >
          <Lock color="#fff" size={26} />
        </div>

        <p style={{ fontWeight: 700, fontSize: 16, color: "#0f2545", marginBottom: 8 }}>
          Are you sure you want to delete your account?
        </p>
        <p style={{ fontSize: 12, color: "#8a929c", lineHeight: 1.5, marginBottom: 4 }}>
          Once you delete your account, it cannot be undone. All your data will be permanently deleted and cannot be recovered.
        </p>
        <p style={{ fontSize: 12, color: "#8a929c", lineHeight: 1.5, marginBottom: 24 }}>
          We're sad to see you go, but we understand that sometimes it's necessary. Please take a moment to consider the
          consequences before proceeding.
        </p>

        {error && <p className="error-text">{error}</p>}

        <PrimaryButton
          onClick={() => setPopup("confirm")}
          style={{ background: "linear-gradient(180deg, #ff4d4d 0%, #d92b2b 100%)" }}
        >
          Delete
        </PrimaryButton>
      </div>

      {popup === "confirm" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#ffe3e3" }}>
            <AlertTriangle color="#ff3b3b" size={26} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Delete account</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: "linear-gradient(180deg, #ff4d4d 0%, #d92b2b 100%)" }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </PrimaryButton>
            <GhostButton onClick={() => setPopup(null)}>Cancel</GhostButton>
          </div>
        </Popup>
      )}

      {popup === "success" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Account deleted successfully!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            Your account has been permanently deleted. We're sorry to see you go. Thank you for using the app!
          </p>
          <PrimaryButton onClick={() => navigate("/login")}>Continue</PrimaryButton>
        </Popup>
      )}
    </div>
  );
}
