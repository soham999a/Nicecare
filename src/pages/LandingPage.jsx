import { useEffect } from 'react';
import Header from '../components/landing/Header';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import WhoIsThisFor from '../components/landing/WhoIsThisFor';
import CounterOneSection from '../components/landing/CounterOneSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  // Force scroll to top on mount and enable smooth scroll after load
  useEffect(() => {
    // Immediately scroll to top without smooth behavior
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    
    // Enable smooth scroll after a short delay
    const timer = setTimeout(() => {
      document.documentElement.classList.add('loaded');
    }, 100);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('loaded');
    };
  }, []);

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      
      <Header />
      
      <main className="landing-main" id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <WhoIsThisFor />
        <CounterOneSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
