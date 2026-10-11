import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Lock, MapPin, Bell, Shield, FileText, HelpCircle, Info, Trash2, LogOut,
} from "lucide-react";
import { TopBar, SettingsSectionTitle, SettingsRow, ToggleSwitch, PrimaryButton } from "../components/UI";
import { signOut } from "../services/auth";
import { getCurrentPosition } from "../lib/geolocation";
import { requestNotificationPermission, hasNotificationPermission } from "../lib/notifications";

const LOCATION_KEY = "resq_pref_location";
const NOTIF_KEY = "resq_pref_notifications";

export default function Settings() {
  const navigate = useNavigate();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    const loc = localStorage.getItem(LOCATION_KEY);
    const notif = localStorage.getItem(NOTIF_KEY);
    if (loc !== null) setLocationEnabled(loc === "true");
    if (notif !== null) setNotifEnabled(notif === "true");

    // The stored preference can drift from reality if the person revokes
    // the permission from Android's own Settings app instead of in here —
    // reflect the actual OS grant on load rather than trusting the flag alone.
    hasNotificationPermission().then((granted) => {
      if (!granted) {
        setNotifEnabled(false);
        localStorage.setItem(NOTIF_KEY, "false");
      }
    });
  }, []);

  function toggleLocation(next) {
    setLocationEnabled(next);
    localStorage.setItem(LOCATION_KEY, String(next));
    if (next) getCurrentPosition(); // triggers the native/browser permission prompt right away
  }

  async function toggleNotif(next) {
    if (next) {
      const granted = await requestNotificationPermission(); // triggers the native "Allow notifications?" prompt
      setNotifEnabled(granted);
      localStorage.setItem(NOTIF_KEY, String(granted));
    } else {
      setNotifEnabled(false);
      localStorage.setItem(NOTIF_KEY, "false");
    }
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="screen">
      <TopBar title="Settings" onBack={() => navigate("/home")} />
      <div style={{ padding: "16px 20px 32px" }}>
        <SettingsSectionTitle>My Account</SettingsSectionTitle>
        <SettingsRow icon={<User size={16} />} label="Edit Profile" onClick={() => navigate("/settings/edit-profile")} />
        <SettingsRow icon={<Lock size={16} />} label="Change Password" onClick={() => navigate("/settings/change-password")} />

        <SettingsSectionTitle>Permission</SettingsSectionTitle>
        <SettingsRow
          icon={<MapPin size={16} />}
          label="Allow access to your location"
          right={<ToggleSwitch checked={locationEnabled} onChange={toggleLocation} />}
        />
        <SettingsRow
          icon={<Bell size={16} />}
          label="Notification Updates"
          right={<ToggleSwitch checked={notifEnabled} onChange={toggleNotif} />}
        />

        <SettingsSectionTitle>Privacy &amp; Security</SettingsSectionTitle>
        <SettingsRow icon={<Shield size={16} />} label="Privacy Policy" onClick={() => navigate("/settings/privacy-policy")} />
        <SettingsRow icon={<FileText size={16} />} label="Terms &amp; Conditions" onClick={() => navigate("/settings/terms")} />
        <SettingsRow icon={<HelpCircle size={16} />} label="Help &amp; Support" onClick={() => navigate("/settings/help-support")} />
        <SettingsRow icon={<Info size={16} />} label="About ResQPartido" onClick={() => navigate("/settings/about")} />
        <SettingsRow icon={<Trash2 size={16} />} label="Delete Account" onClick={() => navigate("/settings/delete-account")} danger />

        <PrimaryButton onClick={handleLogout} style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <LogOut size={16} /> Log Out
        </PrimaryButton>
      </div>
    </div>
  );
}
