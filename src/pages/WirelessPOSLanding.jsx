import React, { useState } from 'react';
import WirelessHeroSection from '../components/wireless/WirelessHeroSection';
import WirelessProblemSection from '../components/wireless/WirelessProblemSection';
import WirelessSolutionSection from '../components/wireless/WirelessSolutionSection';
import WirelessBenefitsSection from '../components/wireless/WirelessBenefitsSection';
import WirelessFinalCTA from '../components/wireless/WirelessFinalCTA';
import DemoBookingModal from '../components/wireless/DemoBookingModal';

const WirelessPOSLanding = () => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleBookDemo = () => {
    setShowDemoModal(true);
  };

  const handleCloseDemoModal = () => {
    setShowDemoModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <WirelessHeroSection onBookDemo={handleBookDemo} />
      
      {/* Problem Section */}
      <WirelessProblemSection />
      
      {/* Solution Section */}
      <WirelessSolutionSection />
      
      {/* Benefits Cards Section */}
      <WirelessBenefitsSection />
      
      {/* Final CTA Section */}
      <WirelessFinalCTA onBookDemo={handleBookDemo} />
      
      {/* Demo Booking Modal */}
      <DemoBookingModal 
        isOpen={showDemoModal} 
        onClose={handleCloseDemoModal} 
      />
    </div>
  );
};

export default WirelessPOSLanding;