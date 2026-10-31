import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * DevPrep - Protected Route Guard (`ProtectedRoute.jsx`)
 * 
 * Concepts explained:
 * 1. Client-Side Route Protection: Restricts routes to authenticated users.
 * 2. Unauthenticated Redirect: Sends unauthenticated visitors to `/login`.
 * 3. Loading Gate: Waits until session restore finishes before deciding to redirect.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader message="Verifying session..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
