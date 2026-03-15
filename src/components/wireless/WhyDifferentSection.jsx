import React from 'react';

const pillars = [
  {
    emoji: '📱',
    title: 'Built for Wireless Stores',
    accent: '#00d4aa',
    points: ['Phone repairs', 'Device sales', 'Trade-ins', 'Unlock services', 'Prepaid activations', 'Accessories'],
  },
  {
    emoji: '🏪',
    title: 'Built by a Store Operator',
    accent: '#0ea5e9',
    description: 'Most POS companies have never run a wireless store. WirelessPOS was built by an operator managing:',
    points: ['Real stores', 'Real inventory', 'Real technicians', 'Real employees'],
    footer: 'Every feature exists because it solves a real store problem.',
  },
  {
    emoji: '🤖',
    title: 'Powered by WirelessCEO',
    accent: '#f59e0b',
    description: 'The AI layer that analyzes your store data and tells you:',
    points: ['What is broken', 'What is costing you money', 'What actions to take next'],
    footer: 'WirelessPOS runs your store. WirelessCEO runs your decisions.',
  },
];

const WhyDifferentSection = () => {
  return (
    <section id="why-different-section" className="py-16 sm:py-20 md:py-24" style={{ background: '#f8fafc' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block py-2 px-4 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', color: '#0284c7' }}>
            Why Different
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#0d1117' }}>
            The First AI Operating System
            <br />
            <span style={{ background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              for Wireless Stores
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#64748b' }}>
            Most POS systems only track transactions. WirelessPOS runs your store operations.
            WirelessCEO analyzes your data and tells you what actions to take next.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-2"
              style={{ border: `1px solid #e2e8f0`, borderTopColor: p.accent, borderTopWidth: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="text-3xl mb-4">{p.emoji}</div>
              <h3 className="text-lg md:text-xl font-extrabold mb-3" style={{ color: '#0d1117' }}>{p.title}</h3>
              {p.description && <p className="text-sm mb-3 leading-relaxed" style={{ color: '#64748b' }}>{p.description}</p>}
              <ul className="flex flex-col gap-2">
                {p.points.map((pt, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {pt}
                  </li>
                ))}
              </ul>
              {p.footer && (
                <p className="text-xs mt-4 pt-4 italic leading-relaxed" style={{ color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>{p.footer}</p>
              )}
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-4">
          {['Built for multi-location wireless operators', 'Used by repair & wireless stores', 'Designed by wireless store owners'].map((t) => (
            <span key={t} className="inline-flex items-center gap-2 py-2 px-4 bg-white rounded-full text-sm font-medium"
              style={{ border: '1px solid #e2e8f0', color: '#64748b' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferentSection;
