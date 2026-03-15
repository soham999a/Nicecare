import React, { useState } from 'react';
import WirelessHeroSection from '../components/wireless/WirelessHeroSection';
import ProductScreenshot from '../components/wireless/ProductScreenshot';
import WirelessProblemSection from '../components/wireless/WirelessProblemSection';
import WirelessSolutionSection from '../components/wireless/WirelessSolutionSection';
import WhyDifferentSection from '../components/wireless/WhyDifferentSection';
import WirelessCEOSection from '../components/wireless/WirelessCEOSection';
import WirelessBenefitsSection from '../components/wireless/WirelessBenefitsSection';
import WirelessFinalCTA from '../components/wireless/WirelessFinalCTA';
import DemoBookingModal from '../components/wireless/DemoBookingModal';

const WirelessPOSLanding = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <WirelessHeroSection onJoinWaitlist={() => setShowModal(true)} />
      <ProductScreenshot />
      <WirelessProblemSection />
      <WirelessSolutionSection />
      <WhyDifferentSection />
      <WirelessCEOSection />
      <WirelessBenefitsSection />
      <WirelessFinalCTA onJoinWaitlist={() => setShowModal(true)} />
      <DemoBookingModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default WirelessPOSLanding;
