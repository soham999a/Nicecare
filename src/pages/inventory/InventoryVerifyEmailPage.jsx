import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function InventoryVerifyEmailPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { currentUser, resendVerificationEmail, logout } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/inventory/login');
    } else if (currentUser.emailVerified) {
      navigate('/inventory/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleResend() {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resendVerificationEmail();
      setMessage('Verification email sent! Check your inbox.');
      setCountdown(60);
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/inventory/login');
    } catch {
      setError('Failed to log out.');
    }
  }

  function handleRefresh() {
    window.location.reload();
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="auth-page inventory-auth">
      {/* Left Panel - Branding */}
      <div className="auth-brand-panel inventory-brand">
        <div className="auth-brand-content">
          <Link to="/" className="back-to-home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Home
          </Link>
          
          <div className="brand-logo inventory-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1 className="brand-title">Inventory Management</h1>
          <p className="brand-tagline">Verify Your Email</p>
        </div>
      </div>

      {/* Right Panel - Verification */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <div className="verify-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          <div className="form-header">
            <h2>Check Your Email</h2>
            <p>We've sent a verification link to:</p>
            <p className="email-display">{currentUser.email}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {message}
            </div>
          )}

          <div className="verify-actions">
            <button 
              onClick={handleRefresh}
              className="btn btn-full btn-inventory"
            >
              I've Verified My Email
            </button>

            <button 
              onClick={handleResend}
              className="btn btn-outline btn-full"
              disabled={loading || countdown > 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend Verification Email'
              )}
            </button>
          </div>

          <div className="verify-footer">
            <button onClick={handleLogout} className="btn-text">
              Sign out and use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
