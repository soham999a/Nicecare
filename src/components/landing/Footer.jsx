export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="landing-brand">
            <div className="brand-icon-square">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
                <rect x="10" y="10" width="80" height="80" rx="12" stroke="#3b82f6" strokeWidth="8" fill="none"/>
              </svg>
            </div>
            <span className="brand-text-teal">CounterOne</span>
          </div>
          <p className="footer-tagline">
            Smarter Inventory. Stronger Relationships.
          </p>
        </div>
        
        <div className="footer-middle">
          <a href="#features" className="footer-link">Features</a>
          <a href="#how-it-works" className="footer-link">How It Works</a>
          <a href="/inventory/login" className="footer-link">Sign In</a>
          <a href="/inventory/signup" className="footer-link">Create Account</a>
        </div>
        
        <div className="footer-right">
          <p className="footer-copyright">© 2025 CounterOne. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
