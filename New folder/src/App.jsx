import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { CallProvider } from "./context/CallContext";
import IncomingCallOverlay from "./components/IncomingCallOverlay";
import OutgoingCallOverlay from "./components/OutgoingCallOverlay";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";
import CreateAccount from "./pages/CreateAccount";
import Home from "./pages/Home";
import Alerts from "./pages/Alerts";
import ReportIncident from "./pages/ReportIncident";
import ReportHistory from "./pages/ReportHistory";
import EmergencyHotlines from "./pages/EmergencyHotlines";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import DeleteAccount from "./pages/DeleteAccount";
import InfoPage from "./pages/InfoPage";

export default function App() {
  return (
    <CallProvider>
      <div className="app-shell">
        <div className="phone-frame">
          <IncomingCallOverlay />
          <OutgoingCallOverlay />
          <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-account" element={<CreateAccount />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/report-incident" element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />
          <Route path="/report-history" element={<ProtectedRoute><ReportHistory /></ProtectedRoute>} />
          <Route path="/hotlines" element={<ProtectedRoute><EmergencyHotlines /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/settings/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/settings/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
          <Route path="/settings/:slug" element={<ProtectedRoute><InfoPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </CallProvider>
  );
}
