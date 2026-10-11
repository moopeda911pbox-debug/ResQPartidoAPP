import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo, PrimaryButton } from "../components/UI";

export default function Splash() {
  const navigate = useNavigate();
  return (
    <div className="screen" style={{ alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <Logo size={90} />
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <h1 className="brand-title" style={{ fontSize: 26 }}>
          ResQ<span>Partido</span>
        </h1>
        <p className="brand-sub" style={{ marginTop: 4 }}>
          Incident Reporting &amp;
          <br />
          Emergency Alert System
        </p>
      </div>
      <div style={{ width: "100%", marginTop: 56 }}>
        <PrimaryButton onClick={() => navigate("/login")}>Get Started</PrimaryButton>
      </div>
    </div>
  );
}
