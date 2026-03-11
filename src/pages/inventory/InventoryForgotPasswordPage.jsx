import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function InventoryForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage('Check your inbox for password reset instructions.');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      default:
        return 'Failed to send reset email. Please try again.';
    }
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
          <p className="text-lg text-white/80">Reset Your Password</p>
        </div>
      </div>

      {/* Right Panel - Form */}
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

          <div className="mb-8 text-center">
            <h2 className="mb-2 text-[1.75rem] font-bold text-slate-900 dark:text-gray-50">Reset Password</h2>
            <p className="m-0 text-[0.9375rem] text-slate-600 dark:text-gray-400">Enter your email to receive reset instructions</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">Email Address</label>
              <input
                type="email"
                className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[0.9375rem] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
            </div>

            <button 
              type="submit" 
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:not-disabled:-translate-y-px hover:not-disabled:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="m-0 text-[0.9375rem] text-slate-600 dark:text-gray-400">
              Remember your password?{' '}
              <Link to="/inventory/login" className="font-medium text-blue-600 no-underline hover:underline dark:text-blue-400">Back to Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
