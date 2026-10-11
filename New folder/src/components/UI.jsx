import React, { useState } from "react";
import { Facebook, Chrome, ChevronLeft, ChevronRight, User, Eye, EyeOff } from "lucide-react";
import resqpartidoLogo from "../assets/resqpartido-logo.png";

export function Logo({ size = 64 }) {
  return (
    <img
      src={resqpartidoLogo}
      alt="ResQPartido"
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  );
}

export function Brand() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 className="brand-title" style={{ fontSize: 24 }}>
        ResQ<span>Partido</span>
      </h1>
      <p className="brand-sub">Incident Reporting &amp; Emergency Alert System</p>
    </div>
  );
}

export function PrimaryButton({ children, onClick, type = "button", disabled, style }) {
  return (
    <button type={type} className="btn-primary" onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style }) {
  return (
    <button type="button" className="btn-ghost" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <input className="field-input" {...props} />
    </label>
  );
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <select className="field-select" {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextareaField({ label, ...props }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <textarea className="field-textarea" rows={4} {...props} />
    </label>
  );
}

export function SocialRow({ onGoogle, onFacebook, disabled }) {
  return (
    <>
      <div className="divider-row">
        <div className="line" />
        <span>or continue with</span>
        <div className="line" />
      </div>
      <div className="social-row">
        <button type="button" className="social-btn" onClick={onFacebook} disabled={disabled}>
          <Facebook size={16} /> Facebook
        </button>
        <button type="button" className="social-btn" onClick={onGoogle} disabled={disabled}>
          <Chrome size={16} /> Google
        </button>
      </div>
    </>
  );
}

export function TopBar({ title, onBack }) {
  return (
    <div className="topbar">
      <button onClick={onBack} aria-label="Back">
        <ChevronLeft size={22} />
      </button>
      <span>{title}</span>
    </div>
  );
}

export function Popup({ children }) {
  return (
    <div className="popup-overlay">
      <div className="popup-card">{children}</div>
    </div>
  );
}

export function Avatar({ size = 64, iconSize }) {
  return (
    <div className="avatar-circle" style={{ width: size, height: size }}>
      <User size={iconSize || size * 0.5} strokeWidth={1.5} />
    </div>
  );
}

export function SettingsSectionTitle({ children }) {
  return <p className="settings-section-title">{children}</p>;
}

export function SettingsRow({ icon, label, onClick, right, danger }) {
  return (
    <button type="button" className={`settings-row${danger ? " danger" : ""}`} onClick={onClick}>
      <span className="settings-row-left">
        <span className="settings-row-icon">{icon}</span>
        {label}
      </span>
      {right !== undefined ? right : <ChevronRight size={18} className="chevron" />}
    </button>
  );
}

export function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle-switch${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export function PasswordField({ label, value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="input-eye-wrap">
        <input
          className="field-input"
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        <button type="button" className="input-eye-btn" onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility">
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
