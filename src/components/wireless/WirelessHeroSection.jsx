import React from 'react';

const WirelessHeroSection = ({ onJoinWaitlist }) => {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="relative text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 50%, #0d1f2d 100%)' }}>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px, transparent 1px), linear-gradient(90deg, #00d4aa 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>
      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(0,212,170,0.08)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'rgba(14,165,233,0.07)' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold mb-8 border"
            style={{ background: 'rgba(0,212,170,0.1)', borderColor: 'rgba(0,212,170,0.3)', color: '#00d4aa' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00d4aa' }}></span>
            Trusted by Wireless &amp; Repair Operators
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 px-2 tracking-tight text-white">
            Run Your Wireless Store
            <br />
            Like a{' '}
            <span style={{ background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              System
            </span>
            .{' '}
            <span style={{ color: '#f59e0b' }}>Not Chaos</span>.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl mb-4 max-w-3xl mx-auto leading-relaxed px-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
            WirelessPOS.ai is the operating system for wireless and repair stores.
          </p>
          <p className="text-base sm:text-lg mb-10 max-w-2xl mx-auto px-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Powered by{' '}
            <span className="font-semibold" style={{ color: '#00d4aa' }}>WirelessCEO</span>
            {' '}— the first AI store operator for wireless businesses.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 px-4">
            <button
              onClick={onJoinWaitlist}
              className="group w-full sm:w-auto px-8 py-4 font-bold rounded-xl shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg flex items-center justify-center gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', boxShadow: '0 8px 30px rgba(0,212,170,0.3)' }}
            >
              Join Waitlist
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button
              onClick={() => scrollTo('wirelessceo-section')}
              className="group w-full sm:w-auto px-8 py-4 font-bold rounded-xl border-2 backdrop-blur-sm transition-all duration-300 text-lg text-white"
              style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >
              See WirelessCEO
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Built by Operators', 'Built for the Industry', 'Built for Multi-Store Growth'].map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-sm font-medium border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-12 sm:h-16 md:h-20" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ transform: 'rotate(180deg)' }}>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#f8fafc"></path>
        </svg>
      </div>
    </section>
  );
};

export default WirelessHeroSection;
