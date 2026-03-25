const WirelessHeroSection = ({ onJoinWaitlist, onStartAudit }) => (
  <section className="relative text-white overflow-hidden pt-32 pb-20 sm:pt-36 sm:pb-24"
    style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 50%, #0d1f2d 100%)' }}>
    {/* Grid */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{ backgroundImage: 'linear-gradient(#00d4aa 1px, transparent 1px), linear-gradient(90deg, #00d4aa 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    {/* Glows */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
        style={{ background: 'rgba(0,212,170,0.07)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{ background: 'rgba(14,165,233,0.06)' }} />
    </div>

    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border"
        style={{ background: 'rgba(0,212,170,0.1)', borderColor: 'rgba(0,212,170,0.3)', color: '#00d4aa' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00d4aa' }} />
        Trusted by Wireless &amp; Repair Operators
      </div>

      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-5 tracking-tight">
        Run Your Store Like a{' '}
        <span style={{ background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          System
        </span>
        .{' '}
        <span style={{ color: '#f59e0b' }}>Not Chaos</span>.
      </h2>

      <p className="text-lg sm:text-xl mb-4 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
        WirelessPOS.ai is the operating system built for wireless and repair stores.
      </p>
      <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Powered by <span className="font-semibold" style={{ color: '#00d4aa' }}>WirelessCEO</span> — the first AI store operator for wireless businesses.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
        <button onClick={onStartAudit}
          className="group w-full sm:w-auto px-8 py-4 font-bold rounded-xl text-lg flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', boxShadow: '0 8px 30px rgba(0,212,170,0.25)' }}>
          🎯 Get Your Free Store Profit Audit
        </button>
        <button onClick={onJoinWaitlist}
          className="group w-full sm:w-auto px-8 py-4 font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}>
          Join Early Access
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {['Built by Operators','Built for the Industry','Built for Multi-Store Growth'].map(badge => (
          <span key={badge} className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-sm font-medium border"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {badge}
          </span>
        ))}
      </div>
    </div>

    {/* Bottom wave */}
    <div className="absolute bottom-0 left-0 right-0">
      <svg className="w-full h-12 sm:h-16" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ transform: 'rotate(180deg)' }}>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#f8fafc"/>
      </svg>
    </div>
  </section>
);

export default WirelessHeroSection;
