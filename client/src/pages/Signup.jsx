import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * DevPrep - Signup Page (`Signup.jsx`)
 * Conforms to Design.md Section 7.2:
 * - Two columns on desktop
 * - Fields: name, email, password, confirm password
 * - Real-time password requirement checklist (8+ chars, letter, number)
 * - ThemeToggle positioned top-right
 */
export default function Signup() {
  useDocumentTitle('Sign Up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Password requirement validation helpers
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('Password must meet all three requirements below');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
              Your personal placement preparation workbench.
            </p>
          </div>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <span className="feature-number">01</span>
              <div>
                <strong>Private Progress & Analytics</strong>
                <p>Your solved problems, mock tests, and streak are isolated to your account.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="feature-number">02</span>
              <div>
                <strong>Job Application Board</strong>
                <p>Track your internship and job applications through each interview round.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="feature-number">03</span>
              <div>
                <strong>Zero External Dependencies</strong>
                <p>Fast, reliable local JSON database storage without database setups.</p>
              </div>
            </div>
          </div>

          <div className="auth-panel-footer">
            <span>Built for B.Tech CSE placements and technical interviews.</span>
          </div>
        </aside>

        {/* Right Column: Signup Form */}
        <main className="auth-panel-right">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-logo">
                <Logo size={46} showWordmark={true} />
              </div>
              <h2 className="auth-title">Create an account</h2>
              <p className="auth-subtitle">Join DevPrep to start your preparation journey</p>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="signup-name" className="form-label">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-email" className="form-label">Email address</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password" className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
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

                {/* Password requirement hints */}
                <div className="password-hints">
                  <span className={`hint-item ${hasMinLength ? 'hint-valid' : ''}`}>
                    {hasMinLength ? <Check size={12} /> : <span className="hint-bullet">•</span>} 8+ characters
                  </span>
                  <span className={`hint-item ${hasLetter ? 'hint-valid' : ''}`}>
                    {hasLetter ? <Check size={12} /> : <span className="hint-bullet">•</span>} At least one letter
                  </span>
                  <span className={`hint-item ${hasNumber ? 'hint-valid' : ''}`}>
                    {hasNumber ? <Check size={12} /> : <span className="hint-bullet">•</span>} At least one number
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`form-input ${confirmPassword && !passwordsMatch ? 'input-error' : ''}`}
                  required
                />
                {confirmPassword && !passwordsMatch && (
                  <span className="field-error-text">Passwords do not match</span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-block auth-submit-btn"
              >
                {submitting ? (
                  <span>Creating account...</span>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-form-footer">
              <span className="auth-footer-text">Already have an account?</span>{' '}
              <Link to="/login" className="auth-link">Sign in instead</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
