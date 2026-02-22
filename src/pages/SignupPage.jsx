import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Password strength calculation
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

  const passwordStrength = calculatePasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      await signup(email, password, displayName);
      navigate('/verify-email');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      default:
        return 'Failed to create account. Please try again';
    }
  }

  return (
    <div className="auth-container">
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        style={{ position: 'fixed', top: '20px', right: '20px' }}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <div className="auth-card">
        <h1 className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-icon">🛠️</span>
          NiceCare CRM
        </h1>
        <h2>Create your account</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="businessName">Shop / Business Name</label>
            <input
              id="businessName"
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., ABC Electronics"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
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
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password && (
              <>
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: passwordStrength.score >= 1 ? (passwordStrength.strength === 'weak' ? '#ef4444' : passwordStrength.strength === 'medium' ? '#f59e0b' : '#22c55e') : '#e5e7eb' }}></div>
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: passwordStrength.score >= 2 ? (passwordStrength.strength === 'medium' ? '#f59e0b' : '#22c55e') : '#e5e7eb' }}></div>
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: passwordStrength.score >= 3 ? '#22c55e' : '#e5e7eb' }}></div>
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: passwordStrength.strength === 'weak' ? '#ef4444' : passwordStrength.strength === 'medium' ? '#f59e0b' : '#22c55e', fontWeight: '600' }}>
                  {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                </div>
                <div style={{ fontSize: '11px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ color: passwordStrength.checks.minLength ? '#22c55e' : '#9ca3af' }}>
                    {passwordStrength.checks.minLength ? '✓' : '○'} At least 8 characters
                  </div>
                  <div style={{ color: passwordStrength.checks.uppercase ? '#22c55e' : '#9ca3af' }}>
                    {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                  </div>
                  <div style={{ color: passwordStrength.checks.number ? '#22c55e' : '#9ca3af' }}>
                    {passwordStrength.checks.number ? '✓' : '○'} One number
                  </div>
                  <div style={{ color: passwordStrength.checks.special ? '#22c55e' : '#9ca3af' }}>
                    {passwordStrength.checks.special ? '✓' : '○'} One special character (!@#$)
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  paddingRight: '40px',
                  borderColor: confirmPassword && password && confirmPassword === password ? '#22c55e' : confirmPassword && password && confirmPassword !== password ? '#ef4444' : ''
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
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
                }}
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

          <button type="submit" className="btn btn-full" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🚀 Sign Up'}
          </button>
        </form>

        <div className="auth-links">
          <span>
            Already have an account? <Link to="/login">Sign In</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
