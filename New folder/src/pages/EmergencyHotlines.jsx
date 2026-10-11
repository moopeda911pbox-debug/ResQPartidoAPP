import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { TopBar } from "../components/UI";
import { getHotlinesByMunicipality } from "../services/hotlines";

export default function EmergencyHotlines() {
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHotlinesByMunicipality().then((g) => {
      setGrouped(g);
      setLoading(false);
    });
  }, []);

  return (
    <div className="screen">
      <TopBar title="Emergency Hotlines" onBack={() => navigate("/home")} />
      <div style={{ padding: 16, overflowY: "auto" }}>
        {loading && <p style={{ fontSize: 13, color: "#8a929c" }}>Loading hotlines...</p>}

        {Object.entries(grouped).map(([municipality, contacts]) => (
          <div key={municipality} style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#0f2545", marginBottom: 8 }}>{municipality}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contacts.map((c) => (
                <div
                  key={`${municipality}-${c.agency}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 12, border: "1px solid #eceff3", padding: "10px 12px" }}
                >
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f2545", margin: 0 }}>{c.agency}</p>
                    <p style={{ fontSize: 11, color: "#8a929c", margin: 0 }}>{c.phone_number}</p>
                  </div>
                  <a
                    href={`tel:${c.phone_number}`}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#fff", borderRadius: 999, padding: "6px 12px", background: "#e0530a" }}
                  >
                    <Phone size={12} /> Call Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
