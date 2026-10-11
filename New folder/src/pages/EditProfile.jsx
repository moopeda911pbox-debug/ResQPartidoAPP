import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar, Avatar, Field, SelectField, PrimaryButton, Popup } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setPhone(data.phone || "");
          setGender(data.gender || "");
          setAddress(data.address || "");
          setDob(data.date_of_birth || "");
        }
        setLoading(false);
      });
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          gender,
          address,
          date_of_birth: dob || null,
        })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || "Couldn't update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <TopBar title="Edit Profile" onBack={() => navigate(-1)} />

      {loading ? (
        <p style={{ padding: 20, fontSize: 13, color: "#8a929c" }}>Loading...</p>
      ) : (
        <form onSubmit={handleSave} style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
            <Avatar size={84} />
            <p style={{ fontWeight: 700, fontSize: 16, color: "#0f2545", marginTop: 10, marginBottom: 0 }}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your Name"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="First Name" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Last Name" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <Field label="Phone Number" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <SelectField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </SelectField>

          <Field
            label="Address"
            placeholder="Address (e.g. Zone 1, San Isidro, Goa)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Field label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />

          {error && <p className="error-text">{error}</p>}

          <PrimaryButton type="submit" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        </form>
      )}

      {showSuccess && (
        <Popup>
          <div className="popup-icon" style={{ background: "#e5f8ee" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#20c96b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 4 }}>Profile changed successfully!</p>
          <p style={{ fontSize: 11, color: "#8a929c", marginBottom: 20 }}>
            Your profile has been changed, we will know if there are more problems with your account.
          </p>
          <PrimaryButton onClick={() => navigate("/settings")}>Continue</PrimaryButton>
        </Popup>
      )}
    </div>
  );
}
