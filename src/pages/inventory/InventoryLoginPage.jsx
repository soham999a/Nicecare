import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useTheme } from '../../context/ThemeContext';

// Image Assets
import RolebasedImg from '../../assets/role-based.png';
import MultistoreImg from '../../assets/multi-store.png';
import PosImg from '../../assets/pos-image.png';
import LowStockImg from '../../assets/low-stock.png';

const FEATURES = [
  {
    title: "Streamline your workflow with advanced role-based access control.",
    image: RolebasedImg,
  },
  {
    title: "Manage multiple store locations effortlessly in real-time.",
    image: MultistoreImg,
  },
  {
    title: "High-performance POS system designed for modern retail.",
    image: PosImg,
  },
  {
    title: "Never miss a sale with automated low-stock notifications.",
    image: LowStockImg,
  }
];

export default function InventoryLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const { login } = useInventoryAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      const user = result?.user ?? result;
      if (result?.needsInventoryRegistration) {
        navigate('/inventory/complete-registration');
        return;
      }
      if (!user.emailVerified) {
        navigate('/inventory/verify-email');
      } else {
        navigate('/inventory/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  }

  const nextFeature = () => setActiveFeature((prev) => (prev + 1) % FEATURES.length);
  const prevFeature = () => setActiveFeature((prev) => (prev === 0 ? FEATURES.length - 1 : prev - 1));

  return (
    <div className="modern-auth-shell flex min-h-screen w-full transition-colors duration-300 overflow-x-hidden">
      
      {/* LEFT SIDE: 50% IMAGE PANEL (Now on the left for Desktop) */}
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
              alt="Preview"
              className="h-full w-full object-cover transition-transform duration-[8000ms] ease-out"
              style={{ transform: activeFeature === index ? 'scale(1)' : 'scale(1.1)' }}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>
        ))}

        <div className="absolute bottom-0 left-0 z-20 w-full p-12 lg:p-16 text-white">
          <div className="max-w-md">
            <h2 className="mb-8 text-2xl font-medium leading-relaxed drop-shadow-lg lg:text-3xl">
              "{FEATURES[activeFeature].title}"
            </h2>
            
            <div className="flex items-center justify-start border-t border-white/20 pt-6">
              <div className="flex gap-2">
                <button 
                  onClick={prevFeature}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 backdrop-blur-md transition-all hover:bg-white hover:text-slate-900"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextFeature}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 backdrop-blur-md transition-all hover:bg-white hover:text-slate-900"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: 50% LOGIN PANEL (Now on the right for Desktop) */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 pt-2 pb-12 md:w-1/2 md:px-12 md:pt-8 md:pb-24 lg:px-16 xl:px-24">
        
        {/* TOP NAVIGATION */}
        <div className="absolute inset-x-6 top-6 flex items-center justify-between md:inset-x-8 md:top-8">
          <Link 
            to="/" 
            className="flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-indigo-400"
          >
            
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <button 
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-indigo-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-[360px]">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
              Welcome Back
            </h1>
            <p className="mt-3 text-sm text-slate-500 md:text-base dark:text-gray-400">
              Sign in to your inventory account
            </p>
          </header>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-full border border-slate-300 bg-white px-6 py-3.5 pr-14 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 flex h-full items-center text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-3 text-right">
                <Link to="/inventory/forgot-password" size="sm" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 dark:shadow-none"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center dark:border-gray-800 md:mt-10 md:pt-8">
            <p className="text-xs text-slate-500 md:text-sm dark:text-gray-400">
              New business owner?{' '}
              <Link to="/inventory/signup" className="font-bold text-indigo-600 hover:underline underline-offset-4">
                Create a master account
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}