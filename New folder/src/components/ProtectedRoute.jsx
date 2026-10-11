import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) return null; // could render a splash/spinner here
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
