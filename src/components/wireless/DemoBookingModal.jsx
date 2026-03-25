import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { wirelessDb } from '../../config/firebaseWireless';

const STEP1_INITIAL = { firstName: '', email: '', phone: '', company: '', storeCount: '' };
const STEP2_INITIAL = { monthlyRevenue: '', posSystem: '', topProblems: '', message: '' };

const inputCls = "w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm transition-colors bg-gray-50 focus:bg-white outline-none";
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

const DemoBookingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(STEP1_INITIAL);
  const [step2Data, setStep2Data] = useState(STEP2_INITIAL);
  const [docId, setDocId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => {
    setStep(1);
    setStep1Data(STEP1_INITIAL);
    setStep2Data(STEP2_INITIAL);
    setDocId(null);
    setSubmitStatus(null);
    onClose();
  };

  const handleStep1Change = (e) => {
    const { name, value } = e.target;
    setStep1Data(prev => ({ ...prev, [name]: value }));
  };

  const handleStep2Change = (e) => {
    const { name, value } = e.target;
    setStep2Data(prev => ({ ...prev, [name]: value }));
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ref = await addDoc(collection(wirelessDb, 'demoRequests'), {
        ...step1Data,
        source: 'WirelessPOS Landing Page',
        status: 'step1_complete',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setDocId(ref.id);
      setStep(2);
    } catch (err) {
      console.error('Step 1 error:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (docId) {
        await updateDoc(doc(wirelessDb, 'demoRequests', docId), {
          ...step2Data,
          status: 'complete',
          updatedAt: serverTimestamp(),
        });
      }
      setSubmitStatus('success');
    } catch (err) {
      console.error('Step 2 error:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Modal sheet — slides up on mobile, centered on desktop */}
      <div
        className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300"></div>
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-5 rounded-t-2xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0d1117, #1a2332)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Step indicators */}
              <div className="flex items-center gap-1.5 mb-3">
                {[1, 2].map(s => (
                  <React.Fragment key={s}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                      style={{ background: step >= s ? '#00d4aa' : 'rgba(255,255,255,0.15)', color: step >= s ? '#0d1117' : 'rgba(255,255,255,0.4)' }}>
                      {s}
                    </div>
                    {s < 2 && <div className="w-6 h-0.5 rounded flex-shrink-0" style={{ background: step > s ? '#00d4aa' : 'rgba(255,255,255,0.15)' }}></div>}
                  </React.Fragment>
                ))}
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {submitStatus === 'success' ? "You're on the list!" : 'Join the WirelessPOS Waitlist'}
              </h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {submitStatus === 'success' ? "We'll be in touch soon." : 'Get early access + a free store profit audit.'}
              </p>
            </div>
            <button onClick={handleClose} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">

          {/* Success */}
          {submitStatus === 'success' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,212,170,0.1)' }}>
                <svg className="w-7 h-7" fill="none" stroke="#00d4aa" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">You're on the waitlist!</h3>
              <p className="text-gray-500 text-sm mb-6">We'll reach out within 24 hours with your free store profit audit.</p>
              <button onClick={handleClose} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
                Close
              </button>
            </div>
          )}

          {/* Error banner */}
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              Something went wrong. Please try again.
            </div>
          )}

          {/* Step 1 */}
          {!submitStatus && step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className={labelCls}>First Name *</label>
                <input type="text" name="firstName" value={step1Data.firstName} onChange={handleStep1Change}
                  required className={inputCls} placeholder="John" />
              </div>
              <div>
                <label className={labelCls}>Store Name *</label>
                <input type="text" name="company" value={step1Data.company} onChange={handleStep1Change}
                  required className={inputCls} placeholder="ABC Wireless" />
              </div>
              <div>
                <label className={labelCls}>Email Address *</label>
                <input type="email" name="email" value={step1Data.email} onChange={handleStep1Change}
                  required className={inputCls} placeholder="john@wirelessstore.com" />
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input type="tel" name="phone" value={step1Data.phone} onChange={handleStep1Change}
                  required className={inputCls} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className={labelCls}>Number of Locations <span className="text-gray-400 font-normal">(optional)</span></label>
                <select name="storeCount" value={step1Data.storeCount} onChange={handleStep1Change} className={inputCls}>
                  <option value="">Select...</option>
                  <option value="1">1 Store</option>
                  <option value="2-5">2–5 Stores</option>
                  <option value="6-10">6–10 Stores</option>
                  <option value="11-25">11–25 Stores</option>
                  <option value="25+">25+ Stores</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full py-3.5 font-bold rounded-xl text-white text-sm transition-all disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
                {isSubmitting ? 'Saving...' : 'Join the Waitlist →'}
              </button>
              <p className="text-xs text-gray-400 text-center">No spam, ever. We respect your privacy.</p>
            </form>
          )}

          {/* Step 2 */}
          {!submitStatus && step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <p className="text-sm text-gray-500 mb-1">Help us personalize your free store profit audit. Takes 30 seconds.</p>
              <div>
                <label className={labelCls}>Average Monthly Revenue</label>
                <select name="monthlyRevenue" value={step2Data.monthlyRevenue} onChange={handleStep2Change} className={inputCls}>
                  <option value="">Select range...</option>
                  <option value="<50k">Less than $50,000</option>
                  <option value="50k-100k">$50,000 – $100,000</option>
                  <option value="100k-250k">$100,000 – $250,000</option>
                  <option value="250k-500k">$250,000 – $500,000</option>
                  <option value="500k-1m">$500,000 – $1,000,000</option>
                  <option value="1m+">$1,000,000+</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>POS System You Currently Use</label>
                <input type="text" name="posSystem" value={step2Data.posSystem} onChange={handleStep2Change}
                  className={inputCls} placeholder="e.g., Square, Clover, or None" />
              </div>
              <div>
                <label className={labelCls}>Top Problems You're Facing</label>
                <textarea name="topProblems" value={step2Data.topProblems} onChange={handleStep2Change} rows={3}
                  className={inputCls + " resize-none"}
                  placeholder="e.g., can't track margins, staff accountability, inventory chaos..." />
              </div>
              <div>
                <label className={labelCls}>Anything else we should know? <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="message" value={step2Data.message} onChange={handleStep2Change} rows={2}
                  className={inputCls + " resize-none"} placeholder="Optional..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSubmitStatus('success')}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Skip
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="font-bold rounded-xl text-white text-sm transition-all disabled:opacity-50 py-3 px-5"
                  style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', flex: 2 }}>
                  {isSubmitting ? 'Saving...' : 'Complete Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoBookingModal;
