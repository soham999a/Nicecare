import React from 'react';

const features = [
  { emoji: '🔧', title: 'Repairs Management', description: 'Track repairs, technicians, parts, and status from intake to pickup.', accent: '#00d4aa' },
  { emoji: '📦', title: 'Inventory Management', description: 'Know exactly what devices and parts you have in stock — serialized and real-time.', accent: '#0ea5e9' },
  { emoji: '🛒', title: 'Sales & POS', description: 'Process device sales, accessories, and services with a fast, intuitive checkout.', accent: '#f59e0b' },
  { emoji: '🔄', title: 'Trade-ins & Device Buyback', description: 'Track trade-ins and resale margins to maximize profit on every device.', accent: '#10b981' },
  { emoji: '👥', title: 'Employee Tracking', description: 'Monitor technician productivity, repair completion time, and performance.', accent: '#ea580c' },
  { emoji: '📊', title: 'Reporting Dashboard', description: 'See revenue, margin, and store performance instantly — no spreadsheets needed.', accent: '#0ea5e9' },
];

const WirelessSolutionSection = () => {
  return (
    <section id="solution-section" className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block py-2 px-4 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
            style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: '#00a88a' }}>
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#0d1117' }}>
            One Platform to Run Your{' '}
            <span style={{ background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Entire Store
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#64748b' }}>
            WirelessPOS gives wireless and repair stores everything needed to run daily operations in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
              style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.accent + '40'; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.08)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
                style={{ background: f.accent }}></div>
              <div className="text-4xl mb-5">{f.emoji}</div>
              <h3 className="text-lg md:text-xl font-extrabold mb-3" style={{ color: '#0d1117' }}>{f.title}</h3>
              <p className="leading-relaxed text-sm md:text-base" style={{ color: '#64748b' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WirelessSolutionSection;
