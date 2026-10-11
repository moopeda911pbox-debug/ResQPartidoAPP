import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo, Brand, Field, PrimaryButton, SocialRow } from "../components/UI";
import { signInWithOAuth } from "../services/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);

  function handleNext(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    navigate("/create-account", { state: { phone, email, password } });
  }

  async function handleOAuth(provider) {
    setError("");
    setOauthLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err.message || `Couldn't continue with ${provider === "google" ? "Google" : "Facebook"}.`);
      setOauthLoading(false);
    }
  }

  return (
    <form className="screen" style={{ padding: "40px 28px 32px" }} onSubmit={handleNext}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
        <Logo size={56} />
        <div style={{ marginTop: 12 }}>
          <Brand />
        </div>
      </div>

      <h2 style={{ color: "#e0530a", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create your account</h2>

      <Field placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <Field placeholder="Enter your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Field placeholder="Create your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

      {error && <p className="error-text">{error}</p>}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
        <input type="checkbox" /> Remember me
      </label>

      <PrimaryButton type="submit" disabled={oauthLoading}>Next</PrimaryButton>

      <SocialRow
        disabled={oauthLoading}
        onGoogle={() => handleOAuth("google")}
        onFacebook={() => handleOAuth("facebook")}
      />

      <p style={{ textAlign: "center", fontSize: 12, color: "#8a929c", marginTop: 24 }}>
        Already have an account?{" "}
        <button type="button" style={{ background: "none", border: "none", fontWeight: 600, color: "#e0530a" }} onClick={() => navigate("/login")}>
          Sign in
        </button>
      </p>
    </form>
  );
}
