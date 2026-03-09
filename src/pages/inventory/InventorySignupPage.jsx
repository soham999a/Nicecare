import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Employee form state
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeConfirmPassword, setEmployeeConfirmPassword] = useState('');
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [showEmployeeConfirmPassword, setShowEmployeeConfirmPassword] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signupMaster, signupEmployee, checkInvitation } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { strength: 'weak', score: 0 };
    
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*]/.test(pwd);
    
    const checks = {
      minLength: hasMinLength,
      uppercase: hasUpperCase,
      number: hasNumber,
      special: hasSpecial
    };
    
    if (pwd.length < 6) {
      return { strength: 'weak', score: 1, checks };
    }
    
    if (hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial) {
      return { strength: 'strong', score: 3, checks };
    }
    
    if (pwd.length >= 6 && ((hasLowerCase || hasUpperCase) && hasNumber)) {
      return { strength: 'medium', score: 2, checks };
    }
    
    return { strength: 'weak', score: 1, checks };
  };

  const masterPasswordStrength = calculatePasswordStrength(password);
  const employeePasswordStrength = calculatePasswordStrength(employeePassword);

  const handleCheckInvitation = useCallback(async (code) => {
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
    } catch (_err) {
      setError('Failed to verify invitation code');
      setInvitationDetails(null);
    } finally {
      setCheckingInvite(false);
    }
  }, [checkInvitation]);

  useEffect(() => {
    if (initialInviteCode && activeTab === 'employee') {
      handleCheckInvitation(initialInviteCode);
    }
  }, [initialInviteCode, activeTab, handleCheckInvitation]);

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
        setTimeout(() => navigate('/inventory/pos'), 2000);
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

  const strengthColor = (strength) => {
    if (strength === 'weak') return '#ef4444';
    if (strength === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const barColor = (score, threshold, strength) => {
    if (score >= threshold) {
      if (threshold === 1) return strengthColor(strength);
      if (threshold === 2) return strength === 'medium' ? '#f59e0b' : '#22c55e';
      return '#22c55e';
    }
    return '#e5e7eb';
  };

  const inputClasses = "w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[0.9375rem] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20";

  const eyeButtonStyles = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    color: '#9ca3af'
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 md:grid-cols-[55%_45%] dark:bg-[#0a0f1a]">
      {/* Left Panel - Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#0ea5e9] px-12 py-8 text-white md:flex md:flex-col">
        <div className="relative z-10 flex h-full flex-col">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 no-underline transition-colors hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Home
          </Link>
          
          <div className="mt-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Inventory Management</h1>
          <p className="mb-12 text-lg text-white/80">
            {activeTab === 'master' ? 'Create Your Master Account' : 'Join with an Invitation'}
          </p>

          <div className="mt-auto rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            {activeTab === 'master' ? (
              <>
                <h3 className="mb-4 text-sm uppercase tracking-wide opacity-90">What you'll get:</h3>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Unlimited store locations
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Employee management with role-based access
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Complete product catalog
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Point of Sale system
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Sales reports & analytics
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="mb-4 text-sm uppercase tracking-wide opacity-90">How it works:</h3>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Get an invitation code from your employer
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Enter the code to verify your invitation
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Create or link your account
                  </li>
                  <li className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="relative flex items-center justify-center bg-white p-6 md:p-8 dark:bg-gray-900">
        <div className="w-full max-w-[400px]">
          <button 
            className="absolute top-6 right-6 flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-[#0a0f1a] dark:text-gray-400 dark:hover:border-blue-400 dark:hover:bg-gray-700"
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
          <div className="mb-6 flex gap-2 rounded-xl border border-slate-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            <button 
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 py-3 text-sm font-medium transition-all ${activeTab === 'master' ? 'bg-slate-50 text-blue-600 shadow-sm dark:bg-[#0a0f1a] dark:text-blue-400' : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-500 dark:hover:bg-[#0a0f1a] dark:hover:text-gray-50'}`}
              onClick={() => { setActiveTab('master'); setError(''); setSuccess(''); }}
            >
              <svg className={activeTab === 'master' ? 'opacity-100' : 'opacity-70'} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Business Owner
            </button>
            <button 
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 py-3 text-sm font-medium transition-all ${activeTab === 'employee' ? 'bg-slate-50 text-blue-600 shadow-sm dark:bg-[#0a0f1a] dark:text-blue-400' : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-500 dark:hover:bg-[#0a0f1a] dark:hover:text-gray-50'}`}
              onClick={() => { setActiveTab('employee'); setError(''); setSuccess(''); }}
            >
              <svg className={activeTab === 'employee' ? 'opacity-100' : 'opacity-70'} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Staff (Invite)
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-600 bg-red-100 px-4 py-3 text-sm text-red-600 dark:border-red-400 dark:bg-red-900/30 dark:text-red-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-100 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400">
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
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-[1.75rem] font-bold text-slate-900 dark:text-gray-50">Create Master Account</h2>
                <p className="m-0 text-[0.9375rem] text-slate-600 dark:text-gray-400">Set up your business on our platform</p>
              </div>

              <form onSubmit={handleMasterSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Business Name</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Email Address</label>
                  <input
                    type="email"
                    className={inputClasses}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClasses}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={eyeButtonStyles}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password && (
                    <>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: barColor(masterPasswordStrength.score, 1, masterPasswordStrength.strength) }}></div>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: barColor(masterPasswordStrength.score, 2, masterPasswordStrength.strength) }}></div>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: masterPasswordStrength.score >= 3 ? '#22c55e' : '#e5e7eb' }}></div>
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: strengthColor(masterPasswordStrength.strength), fontWeight: '600' }}>
                        {masterPasswordStrength.strength.charAt(0).toUpperCase() + masterPasswordStrength.strength.slice(1)}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ color: masterPasswordStrength.checks.minLength ? '#22c55e' : '#9ca3af' }}>
                          {masterPasswordStrength.checks.minLength ? '✓' : '○'} At least 8 characters
                        </div>
                        <div style={{ color: masterPasswordStrength.checks.uppercase ? '#22c55e' : '#9ca3af' }}>
                          {masterPasswordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                        </div>
                        <div style={{ color: masterPasswordStrength.checks.number ? '#22c55e' : '#9ca3af' }}>
                          {masterPasswordStrength.checks.number ? '✓' : '○'} One number
                        </div>
                        <div style={{ color: masterPasswordStrength.checks.special ? '#22c55e' : '#9ca3af' }}>
                          {masterPasswordStrength.checks.special ? '✓' : '○'} One special character (!@#$)
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={inputClasses}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      autoComplete="new-password"
                      style={{
                        paddingRight: '40px',
                        borderColor: confirmPassword && password && confirmPassword === password ? '#22c55e' : confirmPassword && password && confirmPassword !== password ? '#ef4444' : ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={eyeButtonStyles}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword && password && confirmPassword === password && (
                    <small style={{ color: '#22c55e', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Passwords match ✓
                    </small>
                  )}
                  {confirmPassword && password && confirmPassword !== password && (
                    <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Passwords don't match
                    </small>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:not-disabled:-translate-y-px hover:not-disabled:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
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
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-[1.75rem] font-bold text-slate-900 dark:text-gray-50">
                  {invitationDetails?.role === 'manager' ? 'Join as Store Manager' : 'Join as Staff'}
                </h2>
                <p className="m-0 text-[0.9375rem] text-slate-600 dark:text-gray-400">Enter your invitation code to get started</p>
              </div>

              <form onSubmit={handleEmployeeSubmit} className="space-y-5">
                {/* Invitation Code Field */}
                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Invitation Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={`flex-1 ${inputClasses}`}
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
                      className="cursor-pointer whitespace-nowrap rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      onClick={() => handleCheckInvitation(inviteCode)}
                      disabled={checkingInvite || inviteCode.length < 8}
                    >
                      {checkingInvite ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Invitation Details */}
                {invitationDetails && (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Invitation Verified!
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="m-0 text-sm text-slate-600 dark:text-gray-400"><strong className="text-slate-900 dark:text-gray-50">Business:</strong> {invitationDetails.businessName}</p>
                      <p className="m-0 text-sm text-slate-600 dark:text-gray-400"><strong className="text-slate-900 dark:text-gray-50">Store:</strong> {invitationDetails.storeName}</p>
                      <p className="m-0 text-sm text-slate-600 dark:text-gray-400"><strong className="text-slate-900 dark:text-gray-50">Role:</strong> {invitationDetails.role === 'manager' ? 'Store Manager' : 'Member'}</p>
                      <p className="m-0 text-sm text-slate-600 dark:text-gray-400"><strong className="text-slate-900 dark:text-gray-50">Your Name:</strong> {invitationDetails.name}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Email Address</label>
                  <input
                    type="email"
                    className={inputClasses}
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    disabled={invitationDetails !== null}
                    autoComplete="email"
                  />
                  {invitationDetails && (
                    <small className="mt-1.5 block text-[0.8125rem] text-slate-400 dark:text-gray-500">This is the email your employer used for the invitation</small>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEmployeePassword ? "text" : "password"}
                      className={inputClasses}
                      value={employeePassword}
                      onChange={(e) => setEmployeePassword(e.target.value)}
                      placeholder="Create a password"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                      style={eyeButtonStyles}
                      aria-label={showEmployeePassword ? "Hide password" : "Show password"}
                    >
                      {showEmployeePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {employeePassword && (
                    <>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: barColor(employeePasswordStrength.score, 1, employeePasswordStrength.strength) }}></div>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: barColor(employeePasswordStrength.score, 2, employeePasswordStrength.strength) }}></div>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: employeePasswordStrength.score >= 3 ? '#22c55e' : '#e5e7eb' }}></div>
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: strengthColor(employeePasswordStrength.strength), fontWeight: '600' }}>
                        {employeePasswordStrength.strength.charAt(0).toUpperCase() + employeePasswordStrength.strength.slice(1)}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ color: employeePasswordStrength.checks.minLength ? '#22c55e' : '#9ca3af' }}>
                          {employeePasswordStrength.checks.minLength ? '✓' : '○'} At least 8 characters
                        </div>
                        <div style={{ color: employeePasswordStrength.checks.uppercase ? '#22c55e' : '#9ca3af' }}>
                          {employeePasswordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                        </div>
                        <div style={{ color: employeePasswordStrength.checks.number ? '#22c55e' : '#9ca3af' }}>
                          {employeePasswordStrength.checks.number ? '✓' : '○'} One number
                        </div>
                        <div style={{ color: employeePasswordStrength.checks.special ? '#22c55e' : '#9ca3af' }}>
                          {employeePasswordStrength.checks.special ? '✓' : '○'} One special character (!@#$)
                        </div>
                      </div>
                    </>
                  )}
                  <small className="mt-1.5 block text-[0.8125rem] text-slate-400 dark:text-gray-500">
                    If you already have an account (e.g., CRM), use your existing password
                  </small>
                </div>

                <div>
                  <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEmployeeConfirmPassword ? "text" : "password"}
                      className={inputClasses}
                      value={employeeConfirmPassword}
                      onChange={(e) => setEmployeeConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      autoComplete="new-password"
                      style={{
                        paddingRight: '40px',
                        borderColor: employeeConfirmPassword && employeePassword && employeeConfirmPassword === employeePassword ? '#22c55e' : employeeConfirmPassword && employeePassword && employeeConfirmPassword !== employeePassword ? '#ef4444' : ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmployeeConfirmPassword(!showEmployeeConfirmPassword)}
                      style={eyeButtonStyles}
                      aria-label={showEmployeeConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showEmployeeConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {employeeConfirmPassword && employeePassword && employeeConfirmPassword === employeePassword && (
                    <small style={{ color: '#22c55e', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Passwords match ✓
                    </small>
                  )}
                  {employeeConfirmPassword && employeePassword && employeeConfirmPassword !== employeePassword && (
                    <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Passwords don't match
                    </small>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:not-disabled:-translate-y-px hover:not-disabled:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading || !invitationDetails}
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Setting Up Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="m-0 text-[0.9375rem] text-slate-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/inventory/login" className="font-medium text-blue-600 no-underline hover:underline dark:text-blue-400">Sign in</Link>
            </p>
          </div>

          <p className="mt-4 text-center text-[0.8125rem] text-slate-400 dark:text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
