import React from 'react';

const examplePrompts = [
  'Are my stores actually making money?',
  'What is broken right now?',
  'Who is underperforming this week?',
  'What inventory is costing me money?',
  'What action should I take today?',
  "What's my repair vs accessory attach rate this month?",
];

const alerts = ['Margin dropped 3.8% this week', 'iPhone 14 Pro screens aging 45 days', 'Attach rate down to 12%'];
const actions = ['Raise XR screen repair price $10', 'Run accessory bundle promotion', 'Reorder Samsung A14 screens'];
const checklist = ['Train John on accessory upsell', 'Discount aging 14 Pro repairs', 'Adjust Tuesday staffing'];

const WirelessCEOSection = () => {
  return (
    <section id="wirelessceo-section" className="py-16 sm:py-20 md:py-24 relative overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(#00d4aa 1px, transparent 1px), linear-gradient(90deg, #00d4aa 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: 'rgba(0,212,170,0.07)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[110px]" style={{ background: 'rgba(14,165,233,0.06)' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', color: '#00d4aa' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00d4aa' }}></span>
            AI Intelligence Layer
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Meet WirelessCEO — Your AI Store Operator
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            WirelessCEO turns your store data into daily decisions and recommended actions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Chat UI */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00d4aa' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">WirelessCEO</p>
                <p className="text-xs font-medium" style={{ color: '#00d4aa' }}>● Online</p>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Ask Your Store Anything</p>
              {examplePrompts.map((prompt, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm transition-all duration-200 cursor-default"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {prompt}
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Key Alerts</p>
              <div className="flex flex-col gap-2">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                    <span>⚠</span> {a}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Recommended Actions</p>
              <div className="flex flex-col gap-2">
                {actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm"
                    style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#6ee7d4' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {a}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>What Should I Fix Today?</p>
              <div className="flex flex-col gap-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm"
                    style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
                    <span className="w-4 h-4 border rounded flex items-center justify-center shrink-0" style={{ borderColor: '#0ea5e9' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span className="text-white font-semibold">WirelessPOS</span> runs your store.{' '}
            <span className="font-semibold" style={{ color: '#00d4aa' }}>WirelessCEO</span> runs your decisions.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WirelessCEOSection;
