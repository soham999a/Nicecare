const ProductScreenshot = () => (
  <section className="py-20 sm:py-24 bg-white">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#00d4aa' }}>Dashboard</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight" style={{ color: '#0d1117' }}>
          See Your Store Like Never Before
        </h2>
        <p className="text-lg mt-4 max-w-xl mx-auto" style={{ color: '#64748b' }}>
          One dashboard. Every metric that matters. Real-time.
        </p>
      </div>

      <div className="relative">
        {/* Glow behind image */}
        <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }} />
        <div className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid #e2e8f0' }}>
          <img
            src="/images/desktop dashboard .jpeg"
            alt="WirelessCEO Dashboard"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </div>
  </section>
);

export default ProductScreenshot;
