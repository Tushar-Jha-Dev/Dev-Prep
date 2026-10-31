import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Guards & Layout
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import ProblemDetails from './pages/ProblemDetails';
import MockTest from './pages/MockTest';
import TestResult from './pages/TestResult';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import AdminQuestions from './pages/AdminQuestions';
import QuestionForm from './pages/QuestionForm';
import AdminMcq from './pages/AdminMcq';
import NotFound from './pages/NotFound';

/**
 * DevPrep - Root Application Component (`App.jsx`)
 * 
 * Concepts explained:
 * 1. Context Hierarchy: ThemeProvider and AuthProvider wrap the routing hierarchy
 *    to guarantee themes and auth credentials are accessible anywhere.
 * 2. Nested Route Guards:
 *    - Unauthenticated users trying to reach `/` or `/problems` hit `ProtectedRoute`
 *      and are redirected to `/login`.
 *    - Authenticated standard users trying to reach `/admin/*` hit `AdminRoute`
 *      and are redirected to `/`.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/problems" element={<Problems />} />
                  <Route path="/problems/:id" element={<ProblemDetails />} />
                  <Route path="/mock-tests" element={<MockTest />} />
                  <Route path="/mock-tests/result" element={<TestResult />} />
                  <Route path="/mock-tests/attempts/:id" element={<TestResult />} />
                  <Route path="/applications" element={<Applications />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Protected Admin Routes */}
                  <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<Navigate to="/admin/questions" replace />} />
                      <Route path="/admin/questions" element={<AdminQuestions />} />
                      <Route path="/admin/questions/new" element={<QuestionForm />} />
                      <Route path="/admin/questions/:id/edit" element={<QuestionForm />} />
                      <Route path="/admin/mcq" element={<AdminMcq />} />
                    </Route>
                  </Route>

                  {/* Authenticated 404 Catch-All */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>

              {/* Top-Level Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
