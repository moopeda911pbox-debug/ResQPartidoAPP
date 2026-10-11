import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { Logo, Brand, Field, PrimaryButton, GhostButton, SocialRow, Popup } from "../components/UI";
import { signInWithPassword, sendPasswordResetEmail, signInWithOAuth } from "../services/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Surfaces the "your account was archived" message from AuthContext's
  // passive session check (e.g. an admin archived this account while it was
  // still signed in elsewhere) — that check runs before this page ever
  // mounts, so without this the person would just get silently signed out.
  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Unable to sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  function openForgotPassword() {
    setResetEmail(email);
    setResetError("");
    setResetSent(false);
    setShowForgot(true);
  }

  async function handleSendReset(e) {
    e.preventDefault();
    setResetError("");
    setResetSending(true);
    try {
      await sendPasswordResetEmail(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(err.message || "Couldn't send the reset email. Please try again.");
    } finally {
      setResetSending(false);
    }
  }

  async function handleOAuth(provider) {
    setError("");
    setOauthLoading(true);
    try {
      await signInWithOAuth(provider);
      // Browser will redirect away to the provider here; nothing else to do.
    } catch (err) {
      setError(err.message || `Couldn't continue with ${provider === "google" ? "Google" : "Facebook"}.`);
      setOauthLoading(false);
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

        <h2 style={{ color: "#e0530a", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Welcome back!</h2>

        <Field placeholder="Enter your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field placeholder="Enter your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="error-text">{error}</p>}

        <button
          type="button"
          onClick={openForgotPassword}
          style={{ background: "none", border: "none", display: "block", marginLeft: "auto", fontSize: 12, color: "#e0530a", fontWeight: 600, marginBottom: 20 }}
        >
          Forgot your password?
        </button>

        <PrimaryButton type="submit" disabled={loading || oauthLoading}>
          {loading ? "Signing in..." : "Sign in"}
        </PrimaryButton>

        <SocialRow
          disabled={loading || oauthLoading}
          onGoogle={() => handleOAuth("google")}
          onFacebook={() => handleOAuth("facebook")}
        />

        <p style={{ textAlign: "center", fontSize: 12, color: "#8a929c", marginTop: 24 }}>
          Don't have an account?{" "}
          <button type="button" style={{ background: "none", border: "none", fontWeight: 600, color: "#e0530a" }} onClick={() => navigate("/signup")}>
            Sign up
          </button>
        </p>
      </form>

      {showForgot && (
        <Popup>
          {resetSent ? (
            <>
              <div className="popup-icon" style={{ background: "#e5f8ee" }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Check your email</p>
              <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
                If an account exists for {resetEmail}, we've sent a link to reset your password.
              </p>
              <PrimaryButton onClick={() => setShowForgot(false)}>Done</PrimaryButton>
            </>
          ) : (
            <form onSubmit={handleSendReset}>
              <div className="popup-icon" style={{ background: "#fdece0" }}>
                <Mail color="#e0530a" size={24} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Reset your password</p>
              <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 16 }}>
                Enter your account email and we'll send you a link to set a new password.
              </p>
              <Field
                placeholder="Enter your email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              {resetError && <p className="error-text">{resetError}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <PrimaryButton type="submit" disabled={resetSending}>
                  {resetSending ? "Sending…" : "Send Reset Link"}
                </PrimaryButton>
                <GhostButton onClick={() => setShowForgot(false)}>Cancel</GhostButton>
              </div>
            </form>
          )}
        </Popup>
      )}
    </div>
  );
}
