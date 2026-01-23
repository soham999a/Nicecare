import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function InventorySignupPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('type') === 'employee' ? 'employee' : 'master';
  const initialInviteCode = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Master form state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Employee form state
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeConfirmPassword, setEmployeeConfirmPassword] = useState('');
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signupMaster, signupEmployee, checkInvitation } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Auto-check invitation code if provided in URL
  useEffect(() => {
    if (initialInviteCode && activeTab === 'employee') {
      handleCheckInvitation(initialInviteCode);
    }
  }, []);

  async function handleCheckInvitation(code) {
    if (!code || code.length < 8) return;
    
    setCheckingInvite(true);
    setError('');
    
    try {
      const result = await checkInvitation(code.toUpperCase());
      if (result.valid) {
        setInvitationDetails(result.invitation);
        setEmployeeEmail(result.invitation.email);
      } else {
        setError(result.error);
        setInvitationDetails(null);
      }
    } catch (err) {
      setError('Failed to verify invitation code');
      setInvitationDetails(null);
    } finally {
      setCheckingInvite(false);
    }
  }

  async function handleMasterSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (businessName.trim().length < 2) {
      return setError('Please enter a valid business name');
    }

    setLoading(true);

    try {
      await signupMaster(email, password, businessName.trim());
      navigate('/inventory/verify-email');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmployeeSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!invitationDetails) {
      return setError('Please enter and verify your invitation code first');
    }

    if (employeePassword !== employeeConfirmPassword) {
      return setError('Passwords do not match');
    }

    if (employeePassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const result = await signupEmployee(employeeEmail, employeePassword, inviteCode.toUpperCase());
      
      if (result.needsVerification) {
        navigate('/inventory/verify-email');
      } else if (result.isExistingUser) {
        setSuccess('Your account has been linked to the inventory system! Redirecting...');
        setTimeout(() => navigate('/inventory/member/pos'), 2000);
      } else {
        navigate('/inventory/verify-email');
      }
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      default:
        return 'Failed to create account. Please try again.';
    }
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
          <p className="brand-tagline">
            {activeTab === 'master' ? 'Create Your Master Account' : 'Join as an Employee'}
          </p>

          <div className="signup-benefits">
            {activeTab === 'master' ? (
              <>
                <h3>What you'll get:</h3>
                <ul>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Unlimited store locations
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Employee management with role-based access
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Complete product catalog
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Point of Sale system
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Sales reports & analytics
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h3>How it works:</h3>
                <ul>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Get an invitation code from your employer
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Enter the code to verify your invitation
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Create or link your account
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Start using the POS system
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
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

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${activeTab === 'master' ? 'active' : ''}`}
              onClick={() => { setActiveTab('master'); setError(''); setSuccess(''); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Business Owner
            </button>
            <button 
              className={`auth-tab ${activeTab === 'employee' ? 'active' : ''}`}
              onClick={() => { setActiveTab('employee'); setError(''); setSuccess(''); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Employee (Invite)
            </button>
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

          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {/* Master Signup Form */}
          {activeTab === 'master' && (
            <>
              <div className="form-header">
                <h2>Create Master Account</h2>
                <p>Set up your business on our platform</p>
              </div>

              <form onSubmit={handleMasterSubmit} className="auth-form">
                <div className="form-group">
                  <label className="label">Business Name</label>
                  <input
                    type="text"
                    className="input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-full btn-inventory"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Master Account'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Employee Signup Form */}
          {activeTab === 'employee' && (
            <>
              <div className="form-header">
                <h2>Join as Employee</h2>
                <p>Enter your invitation code to get started</p>
              </div>

              <form onSubmit={handleEmployeeSubmit} className="auth-form">
                {/* Invitation Code Field */}
                <div className="form-group">
                  <label className="label">Invitation Code</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="input"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value.toUpperCase());
                        setInvitationDetails(null);
                      }}
                      placeholder="Enter 8-character code"
                      maxLength={8}
                      style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                    />
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleCheckInvitation(inviteCode)}
                      disabled={checkingInvite || inviteCode.length < 8}
                    >
                      {checkingInvite ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Invitation Details */}
                {invitationDetails && (
                  <div className="invitation-details">
                    <div className="invitation-verified">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Invitation Verified!
                    </div>
                    <div className="invitation-info">
                      <p><strong>Business:</strong> {invitationDetails.businessName}</p>
                      <p><strong>Store:</strong> {invitationDetails.storeName}</p>
                      <p><strong>Your Name:</strong> {invitationDetails.name}</p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    disabled={invitationDetails !== null}
                    autoComplete="email"
                  />
                  {invitationDetails && (
                    <small className="input-hint">This is the email your employer used for the invitation</small>
                  )}
                </div>

                <div className="form-group">
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    autoComplete="new-password"
                  />
                  <small className="input-hint">
                    If you already have an account (e.g., CRM), use your existing password
                  </small>
                </div>

                <div className="form-group">
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    className="input"
                    value={employeeConfirmPassword}
                    onChange={(e) => setEmployeeConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-full btn-inventory"
                  disabled={loading || !invitationDetails}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Setting Up Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/inventory/login">Sign in</Link>
            </p>
          </div>

          <p className="terms-text">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
