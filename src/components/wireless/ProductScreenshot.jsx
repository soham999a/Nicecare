import React from 'react';

const ProductScreenshot = () => {
  return (
    <section className="py-12 md:py-16 bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border shadow-2xl" style={{ background: '#0d1117', borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: '#161b22', borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }}></span>
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }}></span>
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }}></span>
            <div className="flex-1 mx-4 py-1 px-3 rounded-md text-xs text-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              app.wirelesspos.ai/dashboard
            </div>
          </div>
          {/* Dashboard grid */}
          <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_280px] gap-4">
            <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Repairs in Progress</p>
              <p className="text-3xl font-black text-white">24</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#00d4aa' }}>↑ 3 new today</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Today's Sales</p>
              <p className="text-3xl font-black text-white">$3,840</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#00d4aa' }}>↑ 12% vs yesterday</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Inventory Status</p>
              <p className="text-3xl font-black text-white">847</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#f59e0b' }}>⚠ 6 items low stock</p>
            </div>
            {/* WirelessCEO panel */}
            <div className="md:row-span-2 rounded-xl p-4 flex flex-col gap-3 border" style={{ background: 'rgba(0,212,170,0.06)', borderColor: 'rgba(0,212,170,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#00d4aa' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-sm">WirelessCEO</span>
                <span className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: '#00d4aa' }}></span>
              </div>
              <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>📉 Margin dropped <span className="font-semibold" style={{ color: '#ef4444' }}>3.8%</span> this week</div>
              <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>📦 iPhone 14 Pro screens aging <span className="font-semibold" style={{ color: '#f59e0b' }}>45 days</span></div>
              <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>💡 Raise XR screen repair price <span className="font-semibold" style={{ color: '#00d4aa' }}>+$10</span></div>
              <div className="mt-auto pt-2 border-t text-xs text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>AI insights updated in real-time</div>
            </div>
            {/* Mini chart */}
            <div className="md:col-span-3 rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Revenue — Last 7 Days</p>
              <div className="flex items-end gap-2 h-14">
                {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: 'linear-gradient(to top, #00d4aa, #0ea5e9)', opacity: 0.8 }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-4">Real-time visibility into your entire store operations</p>
      </div>
    </section>
  );
};

export default ProductScreenshot;
