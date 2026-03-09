import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';
import RolebasedImg from '../../assets/role-based.png';
import MultistoreImg from '../../assets/multi-store.png';
import PosImg from '../../assets/pos-image.png';
import LowStockImg from '../../assets/low-stock.png';

const FEATURES = [
  {
    title: "Multi-Store Management",
    description: "Manage multiple store locations from a single dashboard with real-time syncing.",
    image: MultistoreImg,
  },
  {
    title: "POS System",
    description: "Process sales with automatic inventory updates and integrated payment processing.",
    image: PosImg,
  },
  {
    title: "Employee Roles",
    description: "Role-based access control to keep your data secure while empowering your team.",
    image: RolebasedImg,
  },
  {
    title: "Low Stock Alerts",
    description: "Never miss a sale. Get automated notifications when your inventory runs low.",
    image: LowStockImg,
  }
];

const BENEFITS = [
  "Unlimited store locations",
  "Employee management with role-based access",
  "Complete product catalog",
  "Point of Sale system",
  "Sales reports & analytics"
];

export default function InventorySignupPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('type') === 'employee' ? 'employee' : 'master';
  const initialInviteCode = searchParams.get('code') || '';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeFeature, setActiveFeature] = useState(0);
  
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

  // Auto-slide logic for the left panel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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

  // Reusable input class - Larger sizing
  const inputClasses = "w-full rounded-full border border-slate-300 bg-white px-5 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder:text-slate-400";
  
  const nextFeature = () => setActiveFeature((prev) => (prev + 1) % FEATURES.length);
  const prevFeature = () => setActiveFeature((prev) => (prev === 0 ? FEATURES.length - 1 : prev - 1));

  return (
    <div className="flex h-screen w-full bg-[#fcfcfc] dark:bg-[#0a0f1a] transition-colors duration-300 overflow-hidden">
      
      {/* LEFT SIDE: 50% IMAGE/FEATURES PANEL (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 overflow-hidden md:block">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeFeature === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img 
              src={feature.image} 
              alt={feature.title}
              className="h-full w-full object-cover transition-transform duration-[8000ms] ease-out"
              style={{ transform: activeFeature === index ? 'scale(1)' : 'scale(1.1)' }}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>
        ))}

        <div className="absolute bottom-0 left-0 z-20 w-full p-10 lg:p-14 text-white">
          <div className="max-w-lg">
            {/* Feature Title & Description */}
            <h2 className="mb-3 text-2xl font-semibold leading-relaxed drop-shadow-lg lg:text-3xl">
              "{FEATURES[activeFeature].title}"
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-white/90 drop-shadow lg:text-base">
              {FEATURES[activeFeature].description}
            </p>
            
            {/* Pagination Indicators */}
            <div className="mb-6 flex gap-2">
              {FEATURES.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    activeFeature === index ? 'w-10 bg-indigo-400' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center justify-start border-t border-white/20 pt-5">
              <div className="flex gap-3">
                <button 
                  onClick={prevFeature}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 backdrop-blur-md transition-all hover:bg-white hover:text-slate-900"
                  aria-label="Previous feature"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextFeature}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 backdrop-blur-md transition-all hover:bg-white hover:text-slate-900"
                  aria-label="Next feature"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {/* Benefits List */}
            <div className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/80">What you'll get:</h3>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {BENEFITS.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/95">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: 50% SIGNUP FORM PANEL */}
      <div className="relative flex w-full flex-col md:w-1/2">
        
        {/* TOP NAVIGATION BAR - Fixed Position */}
        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-end gap-3 px-5 py-4 md:px-8 md:py-5">
          {/* Theme Toggle - Right Side */}
          <button 
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-indigo-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {/* Back Button - Right Side */}
          <Link 
            to="/" 
            className="flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-indigo-400"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        {/* Form Content Area - No Scrolling, Fits in Viewport */}
        <div className="flex flex-1 items-center justify-center px-5 pt-20 pb-6 md:px-10 md:pt-24 md:pb-8">
          <div className="w-full max-w-[400px]">
            
            {/* Tab Switcher */}
            <div className="mb-6 flex gap-2 rounded-full border border-slate-300 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <button
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'master'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-50'
                }`}
                onClick={() => { setActiveTab('master'); setError(''); setSuccess(''); }}
              >
                <svg className={activeTab === 'master' ? 'opacity-100' : 'opacity-70'} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Business Owner
              </button>
              <button
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'employee'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-50'
                }`}
                onClick={() => { setActiveTab('employee'); setError(''); setSuccess(''); }}
              >
                <svg className={activeTab === 'employee' ? 'opacity-100' : 'opacity-70'} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Staff (Invite)
              </button>
            </div>

            {/* Header */}
            <header className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl dark:text-white">
                {activeTab === 'master' ? 'Create Master Account' : (invitationDetails?.role === 'manager' ? 'Join as Store Manager' : 'Join as Staff')}
              </h1>
              <p className="mt-2 text-sm text-slate-500 md:text-base dark:text-gray-400">
                {activeTab === 'master' ? 'Set up your business on our platform' : 'Enter your invitation code to get started'}
              </p>
            </header>

            {/* Error Message */}
            {error && (
              <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                {success}
              </div>
            )}

            {/* Master Signup Form */}
            {activeTab === 'master' && (
              <form onSubmit={handleMasterSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    Business Name
                  </label>
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
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    Email Address
                  </label>
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
                
                {/* Password & Confirm Password - Same Row */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`${inputClasses} pr-11`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Confirm
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`${inputClasses} pr-11 ${confirmPassword && password && confirmPassword !== password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''} ${confirmPassword && password && confirmPassword === password ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10' : ''}`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Password Strength */}
                {password && (
                  <div className="-mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: barColor(masterPasswordStrength.score, 1, masterPasswordStrength.strength) }}></div>
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: barColor(masterPasswordStrength.score, 2, masterPasswordStrength.strength) }}></div>
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: masterPasswordStrength.score >= 3 ? '#22c55e' : '#e5e7eb' }}></div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span style={{ color: masterPasswordStrength.checks.minLength ? '#22c55e' : '#9ca3af' }}>
                        {masterPasswordStrength.checks.minLength ? '✓' : '○'} 8+ chars
                      </span>
                      <span style={{ color: masterPasswordStrength.checks.uppercase ? '#22c55e' : '#9ca3af' }}>
                        {masterPasswordStrength.checks.uppercase ? '✓' : '○'} A-Z
                      </span>
                      <span style={{ color: masterPasswordStrength.checks.number ? '#22c55e' : '#9ca3af' }}>
                        {masterPasswordStrength.checks.number ? '✓' : '○'} 0-9
                      </span>
                      <span style={{ color: masterPasswordStrength.checks.special ? '#22c55e' : '#9ca3af' }}>
                        {masterPasswordStrength.checks.special ? '✓' : '○'} !@#$
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Match indicator */}
                {confirmPassword && password && confirmPassword === password && (
                  <p className="-mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Passwords match</p>
                )}
                {confirmPassword && password && confirmPassword !== password && (
                  <p className="-mt-1 text-xs text-red-600 dark:text-red-400">✗ Passwords don't match</p>
                )}
                
                <button
                  type="submit"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 dark:shadow-none"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : 'Create Master Account'}
                </button>
              </form>
            )}

            {/* Employee Signup Form */}
            {activeTab === 'employee' && (
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    Invitation Code
                  </label>
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
                      className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      onClick={() => handleCheckInvitation(inviteCode)}
                      disabled={checkingInvite || inviteCode.length < 8}
                    >
                      {checkingInvite ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>
                
                {invitationDetails && (
                  <div className="mb-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-900/20">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Invitation Verified!
                    </div>
                    <div className="space-y-1 text-slate-600 dark:text-gray-400">
                      <p><strong className="text-slate-900 dark:text-gray-50">Business:</strong> {invitationDetails.businessName}</p>
                      <p><strong className="text-slate-900 dark:text-gray-50">Store:</strong> {invitationDetails.storeName}</p>
                      <p><strong className="text-slate-900 dark:text-gray-50">Role:</strong> {invitationDetails.role === 'manager' ? 'Store Manager' : 'Member'}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={inputClasses}
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    disabled={invitationDetails !== null}
                    autoComplete="email"
                  />
                  {invitationDetails && (
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-gray-500">This is the email your employer used for the invitation</p>
                  )}
                </div>
                
                {/* Password & Confirm Password - Same Row */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showEmployeePassword ? "text" : "password"}
                        className={`${inputClasses} pr-11`}
                        value={employeePassword}
                        onChange={(e) => setEmployeePassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showEmployeePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Confirm
                    </label>
                    <div className="relative">
                      <input
                        type={showEmployeeConfirmPassword ? "text" : "password"}
                        className={`${inputClasses} pr-11 ${employeeConfirmPassword && employeePassword && employeeConfirmPassword !== employeePassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''} ${employeeConfirmPassword && employeePassword && employeeConfirmPassword === employeePassword ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10' : ''}`}
                        value={employeeConfirmPassword}
                        onChange={(e) => setEmployeeConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmployeeConfirmPassword(!showEmployeeConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showEmployeeConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Password Strength */}
                {employeePassword && (
                  <div className="-mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: barColor(employeePasswordStrength.score, 1, employeePasswordStrength.strength) }}></div>
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: barColor(employeePasswordStrength.score, 2, employeePasswordStrength.strength) }}></div>
                      <div className="h-1.5 flex-1 rounded-full" style={{ background: employeePasswordStrength.score >= 3 ? '#22c55e' : '#e5e7eb' }}></div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span style={{ color: employeePasswordStrength.checks.minLength ? '#22c55e' : '#9ca3af' }}>
                        {employeePasswordStrength.checks.minLength ? '✓' : '○'} 8+ chars
                      </span>
                      <span style={{ color: employeePasswordStrength.checks.uppercase ? '#22c55e' : '#9ca3af' }}>
                        {employeePasswordStrength.checks.uppercase ? '✓' : '○'} A-Z
                      </span>
                      <span style={{ color: employeePasswordStrength.checks.number ? '#22c55e' : '#9ca3af' }}>
                        {employeePasswordStrength.checks.number ? '✓' : '○'} 0-9
                      </span>
                      <span style={{ color: employeePasswordStrength.checks.special ? '#22c55e' : '#9ca3af' }}>
                        {employeePasswordStrength.checks.special ? '✓' : '○'} !@#$
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Match indicator */}
                {employeeConfirmPassword && employeePassword && employeeConfirmPassword === employeePassword && (
                  <p className="-mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Passwords match</p>
                )}
                {employeeConfirmPassword && employeePassword && employeeConfirmPassword !== employeePassword && (
                  <p className="-mt-1 text-xs text-red-600 dark:text-red-400">✗ Passwords don't match</p>
                )}
                
                <button
                  type="submit"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 dark:shadow-none"
                  disabled={loading || !invitationDetails}
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : 'Complete Registration'}
                </button>
              </form>
            )}

            {/* Footer Links */}
            <div className="mt-6 border-t border-slate-200 pt-5 text-center dark:border-gray-800">
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/inventory/login" className="font-bold text-indigo-600 hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
              <p className="mt-3 text-xs text-slate-400 dark:text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}