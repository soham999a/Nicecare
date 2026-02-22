const businesses = [
  {
    title: 'Repair Shops',
    description: 'Perfect for mobile repair, electronics repair, and service businesses.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    color: '#3b82f6'
  },
  {
    title: 'Retail Stores',
    description: 'Ideal for mobile stores, electronics shops, and specialty retail businesses.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    color: '#6366f1'
  },
  {
    title: 'Multi-Location Businesses',
    description: 'Manage multiple stores, franchises, or locations from one central dashboard.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="3"/>
        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
      </svg>
    ),
    color: '#8b5cf6'
  }
];

export default function WhoIsThisFor() {
  return (
    <section className="who-section">
      <div className="section-header two-column">
        <div className="section-left">
          <span className="section-badge">Who Is This For</span>
          <h2 className="section-title">Built for Your Kind of Business</h2>
        </div>
        <div className="section-right">
          <p className="section-subtitle">
            Whether you run a single shop or multiple locations, CounterOne adapts to your needs.
          </p>
        </div>
      </div>
      <div className="who-grid">
        {businesses.map((business, index) => (
          <div key={index} className="who-card">
            <div className="who-icon" style={{ color: business.color }}>
              {business.icon}
            </div>
            <h3>{business.title}</h3>
            <p>{business.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
