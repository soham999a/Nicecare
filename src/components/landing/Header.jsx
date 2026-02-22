import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

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

  const scrollToSection = (sectionClass) => {
    closeNav();
    const section = document.querySelector(`.${sectionClass}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header 
      className="landing-header"
      style={{ 
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
      }}
    >
      <div className="landing-brand">
        <div className="brand-icon-square">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <rect x="10" y="10" width="80" height="80" rx="12" stroke="#3b82f6" strokeWidth="8" fill="none"/>
          </svg>
        </div>
        <span className="brand-text-teal">CounterOne</span>
      </div>
      <nav
        id="landing-nav"
        className={`landing-nav ${navOpen ? 'open' : ''}`}
        aria-label="Primary"
      >
        <button className="nav-link" onClick={() => scrollToSection('features-section')}>
          Features
        </button>
        <button className="nav-link" onClick={() => scrollToSection('how-it-works-section')}>
          How It Works
        </button>
        <button className="nav-link" onClick={() => navigate('/inventory/login')}>
          Sign In
        </button>
      </nav>
      <div className="header-actions">
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
  );
}
