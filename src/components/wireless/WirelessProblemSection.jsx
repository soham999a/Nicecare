import React from 'react';

const problems = [
  { icon: '🔧', text: 'Repairs tracked on paper — or not at all' },
  { icon: '📦', text: 'Inventory scattered across disconnected systems' },
  { icon: '💸', text: 'No real profit tracking — just guessing on margins' },
  { icon: '👤', text: 'Staff performance is invisible' },
  { icon: '📊', text: 'Owners flying blind with no operational data' },
];

const WirelessProblemSection = () => {
  return (
    <section id="problem-section" className="py-16 sm:py-20 md:py-24" style={{ background: '#f8fafc' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block py-2 px-4 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
            The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#0d1117' }}>
            Wireless stores run in <span style={{ color: '#dc2626' }}>chaos</span>.
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#64748b' }}>
            Most stores operate reactively instead of strategically — leaking profit every single day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {problems.map((p, i) => (
            <div key={i} className="flex items-start gap-4 p-5 md:p-6 bg-white rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span className="text-2xl shrink-0">{p.icon}</span>
              <p className="font-medium leading-snug" style={{ color: '#374151' }}>{p.text}</p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 p-5 md:p-6 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-2xl shrink-0">📉</span>
            <p className="font-semibold leading-snug" style={{ color: '#374151' }}>
              Result: Most stores operate reactively instead of strategically — and it costs them thousands every month.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WirelessProblemSection;
