import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const platformOptions = [
  {
    id: 'crm',
    title: 'CRM',
    subtitle: 'Customer Relationship Management',
    description: 'Manage customer profiles, track repair orders, and streamline your service workflow.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    features: ['Customer Profiles', 'Repair Tracking', 'Service History', 'Analytics'],
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
    accentColor: '#3b82f6',
    path: '/crm/login'
  },
  {
    id: 'inventory',
    title: 'Inventory',
    subtitle: 'Inventory & POS Management',
    description: 'Manage stores, employees, products, and process sales with our point-of-sale system.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    features: ['Store Management', 'Employee Roles', 'Product Catalog', 'POS System'],
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    accentColor: '#6366f1',
    path: '/inventory/login'
  }
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '50K+', label: 'Transactions' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' }
];

const testimonials = [
  {
    quote: "CounterOne transformed how we manage our repair shop. Customer tracking is seamless!",
    author: "Rahul Sharma",
    role: "Owner, TechFix Solutions"
  },
  {
    quote: "The POS system is incredibly fast. Our checkout times dropped by 40%.",
    author: "Priya Patel",
    role: "Manager, RetailMart"
  },
  {
    quote: "Finally, a platform that understands small business needs. Highly recommended!",
    author: "Amit Kumar",
    role: "Founder, ServicePro"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-gradient-3"></div>
        <div className="bg-grid"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="url(#brandGradient)"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="url(#brandGradient)"/>
              <line x1="9" y1="21" x2="9" y2="9" stroke="url(#brandGradient)"/>
            </svg>
          </div>
          <span className="brand-text">CounterOne</span>
        </div>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={navOpen}
          aria-controls="landing-nav"
          onClick={() => setNavOpen(!navOpen)}
          aria-label="Toggle navigation"
        >
          <span className="nav-toggle-bar" aria-hidden="true"></span>
          <span className="nav-toggle-bar" aria-hidden="true"></span>
          <span className="nav-toggle-bar" aria-hidden="true"></span>
        </button>
        <nav
          id="landing-nav"
          className={`landing-nav ${navOpen ? 'open' : ''}`}
          aria-label="Primary"
        >
          <a href="#features" className="nav-link" onClick={closeNav}>Features</a>
          <a href="#platforms" className="nav-link" onClick={closeNav}>Platforms</a>
          <a href="#testimonials" className="nav-link" onClick={closeNav}>Testimonials</a>
        </nav>
        <div className="header-actions">
          <button 
            className="theme-toggle-btn"
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
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-main" id="main-content">
        <section className="hero-section">
          <div className="hero-badge animate-fade-in">
            <span className="badge-dot"></span>
            Smarter Inventory | Stronger Customer Relationships.
          </div>
          <h1 className="hero-title animate-fade-in-up">
            One Unified Platform for
            <span className="hero-title-highlight">
              <span className="gradient-text"> Inventory and Customer Management</span>
              <svg className="title-underline" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 4 150 4 198 10" stroke="url(#underlineGradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up delay-1">
            Streamline your operations with our powerful Inventory Management solutions and CRM. 
            Built for repair shops, retail stores, and service businesses of small to medium sizes.
          </p>
          <div className="hero-cta animate-fade-in-up delay-2">
            <button className="btn-primary" onClick={() => document.getElementById('platforms').scrollIntoView({ behavior: 'smooth' })}>
              Get Started Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Watch Demo
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section animate-fade-in-up delay-3">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">&nbsp;Everything you need to grow</h2>
            <p className="section-subtitle">
              Powerful tools designed to help you manage, track, and scale your business efficiently.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10"/>
                  <path d="M18 20V4"/>
                  <path d="M6 20v-4"/>
                </svg>
              </div>
              <h3>Real-time Analytics</h3>
              <p>Get instant insights into your business performance with live dashboards and reports.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Bank-level Security</h3>
              <p>Your data is protected with enterprise-grade encryption and secure cloud storage.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>Optimized performance ensures your team can work without any delays or interruptions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Team Collaboration</h3>
              <p>Work together seamlessly with role-based access and real-time synchronization.</p>
            </div>
          </div>
        </section>

        {/* Platform Selection Cards */}
        <section id="platforms" className="platforms-section">
          <div className="section-header">
            <span className="section-badge">Platforms</span>
            <h2 className="section-title">&nbsp;Choose your solution</h2>
            <p className="section-subtitle">
              Select the platform that best fits your business needs. You can always add more later.
            </p>
          </div>
          <div className="platform-cards">
            {platformOptions.map((platform, index) => (
              <div
                key={platform.id}
                className={`platform-card animate-fade-in-up delay-${index + 1}`}
                onClick={() => navigate(platform.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(platform.path)}
              >
                <div className="card-glow" style={{ background: platform.gradient }}></div>
                <div 
                  className="platform-icon"
                  style={{ background: platform.gradient }}
                >
                  {platform.icon}
                </div>
                <h2 className="platform-title">{platform.title}</h2>
                <p className="platform-subtitle" style={{ color: platform.accentColor }}>{platform.subtitle}</p>
                <p className="platform-description">{platform.description}</p>
                <ul className="platform-features">
                  {platform.features.map((feature, idx) => (
                    <li key={idx}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={platform.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="platform-cta" style={{ background: platform.gradient }}>
                  Get Started
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="testimonials-section">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">&nbsp;Loved by businesses</h2>
            <p className="section-subtitle">
              See what our customers have to say about their experience with CounterOne.
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{testimonial.author}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to transform your business?</h2>
            <p>Join thousands of businesses already using CounterOne to streamline their operations.</p>
            <div className="cta-buttons">
              <button className="btn-primary btn-lg" onClick={() => navigate('/crm/login')}>
                Start with CRM
              </button>
              <button className="btn-primary btn-lg btn-purple" onClick={() => navigate('/inventory/login')}>
                Start with Inventory
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-brand">
              <div className="brand-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="url(#brandGradient2)"/>
                  <line x1="3" y1="9" x2="21" y2="9" stroke="url(#brandGradient2)"/>
                  <line x1="9" y1="21" x2="9" y2="9" stroke="url(#brandGradient2)"/>
                  <defs>
                    <linearGradient id="brandGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="brand-text">CounterOne</span>
            </div>
            <p className="footer-tagline">Empowering businesses with smart solutions.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#platforms">Platforms</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>If we can’t fix it, nobody can.</p>
          <div className="social-links">
            <a href="#" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
