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
      setTimeout(() => {
        navigate('/inventory/dashboard');
      }, 3000);
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
    } catch (_err) {
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

  if (currentUser.emailVerified) {
    return (
      <div className="modern-auth-shell grid min-h-screen grid-cols-1 md:grid-cols-[55%_45%]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#0ea5e9] px-12 py-8 text-white md:flex md:flex-col">
          <div className="relative z-10 flex h-full flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-bold">Success!</h1>
            <p className="text-lg text-white/80">Your account is ready</p>
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-white p-6 md:p-8 dark:bg-gray-900">
          <div className="w-full max-w-[400px]">
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center text-emerald-500">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="mb-4 text-[2rem] font-bold text-slate-900 dark:text-gray-50">Your email has been verified</h2>
              <p className="text-lg text-slate-600 dark:text-gray-400">
                You can now sign in with your new account
              </p>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => navigate('/inventory/dashboard')}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 px-8 py-4 text-lg font-semibold text-white transition-all hover:-translate-y-px"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                Continue to Dashboard
              </button>
            </div>

            <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <p className="m-0 text-sm text-slate-600 dark:text-gray-400">
                Redirecting you to the dashboard in a moment...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-auth-shell grid min-h-screen grid-cols-1 md:grid-cols-[55%_45%]">
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
          <p className="text-lg text-white/80">Verify Your Email</p>
        </div>
      </div>

      {/* Right Panel - Verification */}
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

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          <div className="mb-8 text-center">
            <h2 className="mb-2 text-[1.75rem] font-bold text-slate-900 dark:text-gray-50">Check Your Email</h2>
            <p className="m-0 text-[0.9375rem] text-slate-600 dark:text-gray-400">We've sent a verification link to:</p>
            <p className="mt-2 font-semibold text-blue-600 dark:text-blue-400">{currentUser.email}</p>
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

          {message && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-100 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4">
            <button 
              onClick={handleRefresh}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-px hover:shadow-md"
            >
              I've Verified My Email
            </button>

            <button 
              onClick={handleResend}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-transparent px-6 py-3.5 text-base font-medium text-slate-600 transition-colors hover:bg-gray-100 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:border-gray-600"
              disabled={loading || countdown > 0}
            >
              {loading ? (
                <>
                  <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-600 dark:border-gray-500/30 dark:border-t-gray-400"></span>
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend Verification Email'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button onClick={handleLogout} className="cursor-pointer border-0 bg-transparent text-[13px] font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
              Sign out and use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
