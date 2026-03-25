import { useState } from 'react';

const WirelessNav = ({ onStartAudit, onJoinWaitlist }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: 'rgba(13,17,23,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="font-black text-white text-lg tracking-tight">WirelessPOS</span>
            <span className="hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full ml-1"
              style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)' }}>
              AI
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {[['problem-section','Problem'],['solution-section','Features'],['wirelessceo-section','WirelessCEO']].map(([id,label])=>(
              <button key={id} onClick={()=>scrollTo(id)}
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>
                {label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button onClick={onJoinWaitlist}
              className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,212,170,0.4)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}>
              Join Waitlist
            </button>
            <button onClick={onStartAudit}
              className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
              Free Audit
            </button>
            {/* Mobile menu toggle */}
            <button onClick={()=>setMenuOpen(o=>!o)} className="md:hidden p-1.5 rounded-lg"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 flex flex-col gap-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {[['problem-section','The Problem'],['solution-section','Features'],['wirelessceo-section','WirelessCEO']].map(([id,label])=>(
              <button key={id} onClick={()=>scrollTo(id)}
                className="text-left px-2 py-2 text-sm font-medium rounded-lg"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                {label}
              </button>
            ))}
            <button onClick={()=>{onJoinWaitlist();setMenuOpen(false);}}
              className="mt-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
              Join Waitlist
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default WirelessNav;
