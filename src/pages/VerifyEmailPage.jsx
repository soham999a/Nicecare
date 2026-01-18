import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function VerifyEmailPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, resendVerificationEmail, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleResend() {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resendVerificationEmail();
      setMessage('Verification email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckVerification() {
    setError('');
    setLoading(true);

    try {
      // Reload user to get latest emailVerified status
      await currentUser.reload();
      
      // Get fresh user data after reload
      const { emailVerified } = currentUser;
      
      if (emailVerified) {
        navigate('/dashboard');
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Verification check error:', err);
      // Handle network errors gracefully
      if (err.code === 'auth/network-request-failed' || err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to check verification status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="auth-container">
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        style={{ position: 'fixed', top: '20px', right: '20px' }}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <div className="auth-card">
        <h1 className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-icon">🛠️</span>
          NiceCare CRM
        </h1>
        <h2>Verify your email</h2>

        <div className="verify-content">
          <div className="verify-icon">📬</div>
          <p>
            We've sent a verification email to:
            <br />
            <strong>{currentUser?.email}</strong>
          </p>
          <p className="muted">
            Click the link in the email to verify your account.
            Check your spam folder if you don't see it.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <div className="verify-actions">
          <button
            className="btn btn-full"
            onClick={handleCheckVerification}
            disabled={loading}
          >
            {loading ? '⏳ Checking...' : "✓ I've Verified My Email"}
          </button>

          <button
            className="btn-outline btn-full"
            onClick={handleResend}
            disabled={loading}
          >
            📧 Resend Verification Email
          </button>

          <button
            className="btn-text"
            onClick={handleLogout}
          >
            ← Sign out and use a different email
          </button>
        </div>
      </div>
    </div>
  );
}
