import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * DevPrep - Login Page (`Login.jsx`)
 * Conforms to Design.md Section 7.1:
 * - Two columns on desktop: Brand narrative on left, form on right
 * - Mobile: Only form displays
 * - ThemeToggle positioned in top-right corner
 * - Show/hide password toggle
 * - Error banner & loading submit states
 */
export default function Login() {
  useDocumentTitle('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to quickly fill demo account for evaluation
  const fillDemoAccount = () => {
    setEmail('demo@devprep.com');
    setPassword('Demo@1234');
    setError(null);
  };

  return (
    <div className="auth-page">
      {/* Top right theme toggle */}
      <div className="auth-theme-wrapper">
        <ThemeToggle />
      </div>

      <div className="auth-container">
        {/* Left Column: Brand Notebook Panel */}
        <aside className="auth-panel-left">
          <div className="auth-brand-block">
            <Logo size={36} showWordmark={true} />
            <p className="auth-tagline" style={{ marginTop: '14px' }}>
              Practice, test, and track your placement prep.
            </p>
          </div>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <span className="feature-number">01</span>
              <div>
                <strong>Topic-wise DSA Practice</strong>
                <p>Structured problem bank with curated hints and solutions.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="feature-number">02</span>
              <div>
                <strong>Timed Mock Assessments</strong>
                <p>Simulate campus online tests with server-evaluated scorecards.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="feature-number">03</span>
              <div>
                <strong>Application Tracking</strong>
                <p>Monitor your company applications and interview rounds in one place.</p>
              </div>
            </div>
          </div>

          <div className="auth-panel-footer">
            <span>A self-contained CSE placement preparation platform.</span>
          </div>
        </aside>

        {/* Right Column: Login Form */}
        <main className="auth-panel-right">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-logo">
                <Logo size={46} showWordmark={true} />
              </div>
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Enter your account credentials to continue</p>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="login-password" className="form-label">Password</label>
                </div>
                <div className="password-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="form-input password-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-block auth-submit-btn"
              >
                {submitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={fillDemoAccount}
                className="btn btn-secondary btn-block demo-fill-btn"
              >
                Fill Demo Credentials (demo@devprep.com)
              </button>
            </form>

            <div className="auth-form-footer">
              <span className="auth-footer-text">Don't have an account yet?</span>{' '}
              <Link to="/signup" className="auth-link">Create an account</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
