import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { TopBar, PasswordField, PrimaryButton, Popup } from "../components/UI";
import { supabase } from "../lib/supabase";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || "Couldn't change your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <TopBar title="Change Password" onBack={() => navigate(-1)} />

      <form onSubmit={handleSave} style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(180deg, var(--orange) 0%, var(--orange-deep) 100%)",
            }}
          >
            <Lock color="#fff" size={26} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: "#0f2545", marginTop: 12, marginBottom: 2 }}>Create new password</p>
          <p style={{ fontSize: 11, color: "#8a929c", textAlign: "center", margin: 0 }}>
            Your new password must be different from previous used passwords.
          </p>
        </div>

        <PasswordField label="New Password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <PasswordField label="Confirm Password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

        {error && <p className="error-text">{error}</p>}

        <PrimaryButton type="submit" disabled={saving} style={{ marginTop: 8 }}>
          {saving ? "Saving..." : "Save"}
        </PrimaryButton>
      </form>

      {showSuccess && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Password changed successfully!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            Your password has been changed, we will know if there are more problems with your account.
          </p>
          <PrimaryButton onClick={() => navigate("/settings")}>Continue</PrimaryButton>
        </Popup>
      )}
    </div>
  );
}
