import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Logo, Brand, PasswordField, PrimaryButton, Popup } from "../components/UI";
import { updatePassword } from "../services/auth";

// Supabase's password-recovery email links back to this route. Clicking the
// link signs the browser into a temporary recovery session automatically
// (via the URL fragment Supabase's client reads on load), so by the time
// this page renders, calling updatePassword() below is enough to set it.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
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
      await updatePassword(newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || "That reset link may have expired. Please request a new one from the login screen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <form style={{ padding: "40px 28px 32px" }} onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <Logo size={56} />
          <div style={{ marginTop: 12 }}>
            <Brand />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(180deg, var(--orange) 0%, var(--orange-deep) 100%)",
            }}
          >
            <Lock color="#fff" size={22} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: "#0f2545", marginTop: 12, marginBottom: 2 }}>Set a new password</p>
          <p style={{ fontSize: 11, color: "#8a929c", textAlign: "center", margin: 0 }}>
            Choose a new password for your account.
          </p>
        </div>

        <PasswordField label="New Password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <PasswordField label="Confirm Password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

        {error && <p className="error-text">{error}</p>}

        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save New Password"}
        </PrimaryButton>
      </form>

      {done && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Password updated!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>You can now sign in with your new password.</p>
          <PrimaryButton onClick={() => navigate("/login")}>Go to Login</PrimaryButton>
        </Popup>
      )}
    </div>
  );
}
