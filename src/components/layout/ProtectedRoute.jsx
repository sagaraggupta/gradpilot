import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user } = useAuth();

  // If there is no user logged in, send them to the login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If they are logged in, render the child routes (the dashboard)
  return <Outlet />;
}