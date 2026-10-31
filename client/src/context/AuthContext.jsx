/**
 * DevPrep - Authentication Context & Session Manager (`AuthContext.jsx`)
 * 
 * Concepts explained:
 * 1. Global Authentication State: Maintains the currently logged-in user and token.
 * 2. Session Hydration: When the app mounts or the user refreshes the page, we inspect
 *    localStorage for a token and verify it with `GET /api/auth/me` to restore the session.
 * 3. Automatic Expiry Handling: Listens to the `devprep-unauthorized` event to log the
 *    user out if a backend request returns HTTP 401.
 * 4. Derived Privileges: Exposes `isAuthenticated` and `isAdmin` flags for simple route protection.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, TOKEN_KEY } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Helper to load user's profile avatar
  const fetchUserAvatar = async () => {
    try {
      setAvatarLoading(true);
      const res = await api.getAvatar();
      setAvatar(res?.avatar || null);
    } catch (_) {
      setAvatar(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Restore authenticated session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (isMounted) {
          setUser(data.user);
          setToken(storedToken);
          // Hydrate profile avatar
          try {
            setAvatarLoading(true);
            const avatarRes = await api.getAvatar();
            if (isMounted) setAvatar(avatarRes?.avatar || null);
          } catch (_) {
            if (isMounted) setAvatar(null);
          } finally {
            if (isMounted) setAvatarLoading(false);
          }
        }
      } catch (err) {
        // Token is invalid or expired: clear it
        console.warn('[auth] Session restore failed, clearing token:', err.message);
        localStorage.removeItem(TOKEN_KEY);
        if (isMounted) {
          setUser(null);
          setToken(null);
          setAvatar(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    // Listen for unauthorized events emitted by api.js
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setAvatar(null);
    };

    window.addEventListener('devprep-unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('devprep-unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * Log in user with credentials
   */
  const login = async (credentials) => {
    const data = await api.login(credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    // Fetch user's avatar immediately
    fetchUserAvatar();
    return data;
  };

  /**
   * Register a new user
   */
  const signup = async (userData) => {
    const data = await api.signup(userData);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setAvatar(null);
    return data;
  };

  /**
   * Log out and clean session
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setAvatar(null);
  };

  const value = {
    user,
    token,
    loading,
    avatar,
    avatarLoading,
    setAvatar,
    fetchUserAvatar,
    login,
    signup,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
