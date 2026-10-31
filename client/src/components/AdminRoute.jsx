import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * DevPrep - Admin Route Guard (`AdminRoute.jsx`)
 * 
 * Concepts explained:
 * 1. Role-Based Navigation: Only users with `role: "admin"` can view admin routes.
 * 2. Non-Admin Redirection: Standard users are redirected to the home dashboard `/`.
 */
export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loader message="Verifying admin credentials..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
