import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, Mail } from "lucide-react";
import { TopBar, Logo } from "../components/UI";

const CONTENT = {
  "privacy-policy": {
    title: "Privacy Policy",
    body: [
      "ResQPartido collects only the information needed to respond to your emergency reports and alerts: your name, contact details, address, and, when you send an SOS or file a report, your device's location.",
      "Your location is shared with the dispatcher (PNP, BFP, or MDRRMO) handling your report and is only used to coordinate a response. We do not sell or share your personal information with third parties for advertising.",
      "You can review or update your profile information at any time from Settings, and you can request deletion of your account and associated data from the Delete Account screen.",
      "For questions about how your data is handled, contact your municipality's local government unit through the Help & Support screen.",
    ],
  },
  "terms": {
    title: "Terms & Conditions",
    body: [
      "By using ResQPartido, you agree to provide accurate information when creating an account and when submitting incident reports or SOS alerts.",
      "ResQPartido is a tool to help route reports to the responding agency faster. It does not replace calling emergency hotlines directly in situations where connectivity is unreliable.",
      "Filing false or malicious reports is prohibited and may be referred to the appropriate authorities.",
      "The system is provided as-is as part of a municipal pilot program covering Goa, San Jose, Lagonoy, Tigaon, and Sangay. Availability may depend on network connectivity and dispatcher capacity.",
    ],
  },
  "help-support": {
    title: "Help & Support",
    body: [
      "Need help using the app? Start with the Report Incidents or Emergency Hotlines screens from the home menu for the fastest way to reach responders.",
      "If something in the app isn't working as expected, please describe the issue (what you were doing, and what happened) and send it to your capstone team's support contact below.",
    ],
    contacts: true,
  },
  "about": {
    title: "About ResQPartido",
    body: [
      "ResQPartido is an Incident Reporting and Emergency Alert System built for the Partido area, covering the municipalities of Goa, San Jose, Lagonoy, Tigaon, and Sangay.",
      "It connects citizens directly to PNP, BFP, and MDRRMO dispatchers, with live SOS mapping so responders can see where help is needed in real time.",
      "This app is a capstone research project developed to make emergency reporting faster and more reliable across the five municipalities it serves.",
    ],
  },
};

export default function InfoPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const page = CONTENT[slug] || CONTENT["about"];

  return (
    <div className="screen">
      <TopBar title={page.title} onBack={() => navigate(-1)} />
      <div style={{ padding: 20 }}>
        {slug === "about" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
            <Logo size={56} />
          </div>
        )}
        {page.body.map((para, i) => (
          <p key={i} style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.6, marginBottom: 14 }}>
            {para}
          </p>
        ))}

        {page.contacts && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Phone size={16} color="#e0530a" />
              <span style={{ fontSize: 13, color: "#0f2545", fontWeight: 500 }}>Emergency Hotlines screen (in-app)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Mail size={16} color="#e0530a" />
              <span style={{ fontSize: 13, color: "#0f2545", fontWeight: 500 }}>resqpartido.support@partido.edu.ph</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
