import React from 'react';

const WirelessFinalCTA = ({ onBookDemo }) => {
  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Stop running a <span className="text-red-400">store</span>.
            <br />
            Start running a <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">system</span>.
          </h2>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-blue-100 mb-16 max-w-4xl mx-auto leading-relaxed">
            Transform your wireless store with the power of WirelessPOS.ai
          </p>

          {/* Main CTA Button */}
          <div className="mb-16">
            <button
              onClick={onBookDemo}
              className="group relative inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 text-xl"
            >
              <span className="relative z-10">Book a Demo Today</span>
              <svg className="relative z-10 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Urgency Message */}
          <div className="inline-flex items-center gap-3 bg-red-500/20 text-red-200 px-6 py-3 rounded-full border border-red-400/30 backdrop-blur-sm">
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Every day you wait, profit walks out the door</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WirelessFinalCTA;