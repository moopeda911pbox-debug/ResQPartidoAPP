import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { TopBar, Avatar } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  const rows = [
    ["First name", profile?.first_name],
    ["Last name", profile?.last_name],
    ["Phone", profile?.phone],
    ["Email", user?.email],
    ["Municipality", profile?.municipality],
    ["Address", profile?.address],
    ["Gender", profile?.gender],
    ["Date of birth", profile?.date_of_birth],
  ];

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  return (
    <div className="screen">
      <TopBar title="Profile" onBack={() => navigate("/home")} />
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <Avatar size={84} />
          <p style={{ fontWeight: 700, fontSize: 16, color: "#0f2545", marginTop: 10, marginBottom: 12 }}>
            {fullName || "Your Name"}
          </p>
          <button
            type="button"
            onClick={() => navigate("/settings/edit-profile")}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--border)",
              borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "var(--orange)",
            }}
          >
            <Pencil size={13} /> Edit Profile
          </button>
        </div>
        {rows.map(([label, value]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "#8a929c", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 14, color: "#0f2545", fontWeight: 500, margin: "2px 0 0" }}>{value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
