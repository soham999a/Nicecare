import { useNavigate } from 'react-router-dom';

export default function GetStartedSection() {
  const navigate = useNavigate();

  const platformOption = {
    title: 'CounterOne',
    subtitle: 'Inventory, POS & CRM',
    description: 'One platform for stores, employees, products, point-of-sale, and customer relationship management. Create your master account and get started.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    features: ['Store Management', 'POS & Sales', 'Customer CRM', 'Employee Roles'],
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    accentColor: '#6366f1',
    signupPath: '/inventory/signup',
  };

  return (
    <section id="get-started" className="platforms-section">
      <div className="section-header two-column">
        <div className="section-left">
          <span className="section-badge">Get Started</span>
          <h2 className="section-title">Ready to Transform Your Business?</h2>
        </div>
        <div className="section-right">
          <p className="section-subtitle">
            Create your master account to manage stores, employees, products, POS, and CRM in one place.
          </p>
        </div>
      </div>
      <div className="platform-cards">
        <div
          className="platform-card"
          onClick={() => navigate(platformOption.signupPath)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(platformOption.signupPath)}
        >
          <div className="card-glow" style={{ background: platformOption.gradient }}></div>
          <div
            className="platform-icon"
            style={{ background: platformOption.gradient }}
          >
            {platformOption.icon}
          </div>
          <h2 className="platform-title">{platformOption.title}</h2>
          <p className="platform-subtitle" style={{ color: platformOption.accentColor }}>{platformOption.subtitle}</p>
          <p className="platform-description">{platformOption.description}</p>
          <ul className="platform-features">
            {platformOption.features.map((feature, idx) => (
              <li key={idx}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={platformOption.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <div className="platform-cta" style={{ background: platformOption.gradient }}>
            Get Started
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
