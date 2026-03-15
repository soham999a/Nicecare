import React from 'react';

const WirelessFinalCTA = ({ onJoinWaitlist }) => {
  return (
    <section className="relative py-16 sm:py-20 md:py-24 text-white overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px, transparent 1px), linear-gradient(90deg, #00d4aa 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: 'rgba(0,212,170,0.08)' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight px-2">
            Stop running a <span style={{ color: '#f59e0b' }}>store</span>.
            <br />
            Start running a{' '}
            <span style={{ background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              system
            </span>.
          </h2>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed px-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Be among the first wireless stores to use WirelessPOS and WirelessCEO.
          </p>
          <div className="mb-10 px-4">
            <button
              onClick={onJoinWaitlist}
              className="group relative inline-flex items-center gap-3 w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 font-bold rounded-2xl shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg sm:text-xl justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', boxShadow: '0 8px 40px rgba(0,212,170,0.3)' }}
            >
              Join the Waitlist
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No credit card required. Be first in line.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WirelessFinalCTA;
