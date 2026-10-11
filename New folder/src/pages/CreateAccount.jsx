import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Logo, Brand, Field, SelectField, PrimaryButton, GhostButton, SocialRow, Popup } from "../components/UI";
import { signUpWithProfile, signInWithOAuth } from "../services/auth";
import { getCurrentPosition } from "../lib/geolocation";

const MUNICIPALITIES = ["Goa", "San Jose", "Lagonoy", "Tigaon", "Sangay"];

export default function CreateAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const step1 = location.state; // { phone, email, password }

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [gender, setGender] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [popup, setPopup] = useState(null); // "accountCreated" | "locationPermission"

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

  if (!step1) {
    // Guard: user landed here directly without completing step 1.
    navigate("/signup", { replace: true });
    return null;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!agree) {
      setError("Please agree to the Terms & Privacy Policy to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUpWithProfile({
        email: step1.email,
        password: step1.password,
        profile: {
          first_name: firstName,
          last_name: lastName,
          phone: step1.phone,
          date_of_birth: dob || null,
          address,
          municipality,
          gender,
        },
      });
      setPopup("accountCreated");
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <form style={{ padding: "40px 28px 32px" }} onSubmit={handleCreate}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <Logo size={56} />
          <div style={{ marginTop: 12 }}>
            <Brand />
          </div>
        </div>

        <h2 style={{ color: "#e0530a", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create your account</h2>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div style={{ flex: 1 }}>
            <Field placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <Field label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        <Field placeholder="Address (e.g. Zone 1, San Isidro, Goa)" value={address} onChange={(e) => setAddress(e.target.value)} />

        <SelectField label="Municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)} required>
          <option value="">Select municipality</option>
          {MUNICIPALITIES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </SelectField>

        <SelectField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select gender</option>
          <option>Female</option>
          <option>Male</option>
          <option>Prefer not to say</option>
        </SelectField>

        <label style={{ display: "flex", gap: 8, fontSize: 11, color: "#8a929c", marginBottom: 20, alignItems: "flex-start" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
          By using ResQPartido, you agree to our Terms &amp; Privacy Policy
        </label>

        {error && <p className="error-text">{error}</p>}

        <PrimaryButton type="submit" disabled={loading || oauthLoading}>
          {loading ? "Creating account..." : "Create Account"}
        </PrimaryButton>

        <SocialRow
          disabled={loading || oauthLoading}
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

      {popup === "accountCreated" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Account created successfully!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>Welcome to ResQPartido</p>
          <PrimaryButton onClick={() => setPopup("locationPermission")}>Continue</PrimaryButton>
        </Popup>
      )}

      {popup === "locationPermission" && (
        <Popup>
          <div className="popup-icon" style={{ background: "#fdece0" }}>
            <MapPin color="#e0530a" size={26} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Allow ResQPartido to access your location?</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            Your current location will be used to ensure accurate distress calls.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton
              onClick={() => {
                getCurrentPosition().finally(() => navigate("/home"));
              }}
            >
              Continue
            </PrimaryButton>
            <GhostButton onClick={() => navigate("/home")}>Don't Allow</GhostButton>
          </div>
        </Popup>
      )}
    </div>
  );
}
