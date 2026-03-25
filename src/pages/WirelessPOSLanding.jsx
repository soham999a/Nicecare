import { useState } from 'react';
import WirelessNav from '../components/wireless/WirelessNav';
import WirelessHeroSection from '../components/wireless/WirelessHeroSection';
import WirelessProblemSection from '../components/wireless/WirelessProblemSection';
import WirelessSolutionSection from '../components/wireless/WirelessSolutionSection';
import WirelessCEOSection from '../components/wireless/WirelessCEOSection';
import TwoWaysProfitSection from '../components/wireless/TwoWaysProfitSection';
import WirelessBenefitsSection from '../components/wireless/WirelessBenefitsSection';
import WhyDifferentSection from '../components/wireless/WhyDifferentSection';
import WirelessFinalCTA from '../components/wireless/WirelessFinalCTA';
import WirelessFooter from '../components/wireless/WirelessFooter';
import DemoBookingModal from '../components/wireless/DemoBookingModal';
import AuditFunnel from '../components/wireless/AuditFunnel';

const WirelessPOSLanding = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <WirelessNav onStartAudit={() => setShowAudit(true)} onJoinWaitlist={() => setShowWaitlist(true)} />
      <WirelessHeroSection onJoinWaitlist={() => setShowWaitlist(true)} onStartAudit={() => setShowAudit(true)} />
      <WirelessProblemSection />
      <WirelessSolutionSection />
      <WirelessCEOSection />
      <TwoWaysProfitSection />
      <WirelessBenefitsSection />
      <WhyDifferentSection />
      <WirelessFinalCTA onJoinWaitlist={() => setShowAudit(true)} />
      <WirelessFooter onStartAudit={() => setShowAudit(true)} onJoinWaitlist={() => setShowWaitlist(true)} />

      <DemoBookingModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
      <AuditFunnel isOpen={showAudit} onClose={() => setShowAudit(false)} />
    </div>
  );
};

export default WirelessPOSLanding;
