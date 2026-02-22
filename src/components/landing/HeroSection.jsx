import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-badge">
        <span className="badge-dot"></span>
        Smarter Inventory | Stronger Customer Relationships.
      </div>
      <h1 className="hero-title">
        One Unified Platform for
        <span className="gradient-text"> Inventory and Customer Management</span>
      </h1>
      <p className="hero-subtitle">
        Streamline your operations with our powerful Inventory Management solutions and CRM. 
        Built for repair shops, retail stores, and service businesses of small to medium sizes.
      </p>
      <div className="hero-features-list">
        <div className="hero-feature-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Multi-Store Management</span>
        </div>
        <div className="hero-feature-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Fast POS Checkout</span>
        </div>
        <div className="hero-feature-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Real-Time Inventory</span>
        </div>
        <div className="hero-feature-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>24/7 Support</span>
        </div>
      </div>
      <div className="hero-cta">
        <button className="btn-primary" onClick={() => navigate('/inventory/signup')}>
          Get Started Free
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <button className="btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Watch Demo
        </button>
      </div>
      <p className="hero-trust">No credit card required • Free forever • Cancel anytime</p>
      
      {/* Product Mockup - Desktop with Mobile on Hover */}
      <div className="hero-mockup">
        <img 
          src="/images/desktop dashboard .jpeg" 
          alt="CounterOne Dashboard - Desktop View" 
          className="mockup-image mockup-desktop"
        />
        <img 
          src="/images/Mockup ai dashboard .jpeg" 
          alt="CounterOne Dashboard - Mobile View" 
          className="mockup-image mockup-mobile"
        />
      </div>
    </section>
  );
}
