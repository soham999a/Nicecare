import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function CompleteRegistrationPage() {
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, userProfile, registerExistingAccountAsMaster, logout } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/inventory/login', { replace: true });
      return;
    }
    if (userProfile?.accountType === 'inventory') {
      navigate('/inventory/dashboard', { replace: true });
    }
  }, [currentUser, userProfile, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerExistingAccountAsMaster(businessName.trim());
      navigate('/inventory/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) {
    return null;
  }
  if (userProfile?.accountType === 'inventory') {
    return null;
  }

  return (
    <div className="auth-page inventory-auth">
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
          <h1 className="brand-title">Complete your account</h1>
          <p className="brand-tagline">
            Your email is already registered. Add your business name to start using Inventory, POS & CRM in one place.
          </p>
        </div>
      </div>

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

          <h2 className="auth-form-title">Finish setup</h2>
          <p className="auth-form-subtitle">
            Signed in as <strong>{currentUser.email}</strong>
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="form-group">
              <label htmlFor="businessName">Business name</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. My Store"
                autoFocus
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Setting up…' : 'Continue'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <button
                type="button"
                className="btn-link"
                onClick={async () => { await logout(); navigate('/inventory/login'); }}
              >
                Sign out and use a different account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
