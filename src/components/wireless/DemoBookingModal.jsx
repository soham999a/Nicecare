import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { wirelessDb } from '../../config/firebaseWireless';

const DemoBookingModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    storeCount: '1',
    currentSystem: '',
    timeframe: '',
    message: '',
    location: '',
    monthlyRevenue: '',
    googleProfileLink: '',
    posSystem: '',
    topProblems: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Save to Firestore (wireless project)
      const docRef = await addDoc(collection(wirelessDb, 'demoRequests'), {
        ...formData,
        source: 'WirelessPOS Landing Page',
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Demo request saved successfully with ID:', docRef.id);
      setSubmitStatus('success');
      
      // Reset form and close modal after showing success
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          storeCount: '1',
          currentSystem: '',
          timeframe: '',
          message: '',
          location: '',
          monthlyRevenue: '',
          googleProfileLink: '',
          posSystem: '',
          topProblems: ''
        });
        setSubmitStatus(null);
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error submitting demo request:', error);
      console.error('Error details:', error.message, error.code);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-white p-4 sm:p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #0d1117, #1a2332)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Book Your Demo</h2>
              <p className="text-sm sm:text-base text-blue-100">See WirelessPOS.ai in action - personalized for your store</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 sm:p-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Success/Error Messages */}
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Demo request submitted successfully!</span>
              </div>
              <p className="text-sm mt-1">We'll contact you within 24 hours to schedule your personalized demo.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Error submitting request. Please try again.</span>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="john@wirelessstore.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Business Information */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Company/Store Name *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              placeholder="ABC Wireless"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Number of Store Locations
              </label>
              <select
                name="storeCount"
                value={formData.storeCount}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              >
                <option value="1">1 Store</option>
                <option value="2-5">2-5 Stores</option>
                <option value="6-10">6-10 Stores</option>
                <option value="11-25">11-25 Stores</option>
                <option value="25+">25+ Stores</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Implementation Timeframe
              </label>
              <select
                name="timeframe"
                value={formData.timeframe}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              >
                <option value="">Select timeframe</option>
                <option value="immediate">Immediate (within 30 days)</option>
                <option value="1-3months">1-3 months</option>
                <option value="3-6months">3-6 months</option>
                <option value="6+months">6+ months</option>
                <option value="exploring">Just exploring options</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Current System/Software
            </label>
            <input
              type="text"
              name="currentSystem"
              value={formData.currentSystem}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              placeholder="e.g., Square, Clover, Excel, or 'None'"
            />
          </div>

          {/* New Fields */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Store Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              placeholder="City, State"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Average Monthly Revenue
            </label>
            <select
              name="monthlyRevenue"
              value={formData.monthlyRevenue}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
            >
              <option value="">Select revenue range</option>
              <option value="<50k">Less than $50,000</option>
              <option value="50k-100k">$50,000 - $100,000</option>
              <option value="100k-250k">$100,000 - $250,000</option>
              <option value="250k-500k">$250,000 - $500,000</option>
              <option value="500k-1m">$500,000 - $1,000,000</option>
              <option value="1m+">$1,000,000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Link to Google Business Profile
            </label>
            <input
              type="url"
              name="googleProfileLink"
              value={formData.googleProfileLink}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              placeholder="https://g.page/your-business"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              POS System You Currently Use
            </label>
            <input
              type="text"
              name="posSystem"
              value={formData.posSystem}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              placeholder="e.g., Square, Clover, Toast, or 'None'"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Top 3 Problems You're Facing
            </label>
            <textarea
              name="topProblems"
              value={formData.topProblems}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
              placeholder="1. Problem one&#10;2. Problem two&#10;3. Problem three"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Additional Information
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
              placeholder="Tell us about your specific needs, challenges, or questions..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base text-white"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Book My Demo'
              )}
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="text-xs text-gray-500 text-center pt-2 sm:pt-4 border-t border-gray-200">
            <p>
              By submitting this form, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>.
              We'll only use your information to schedule and conduct your demo.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoBookingModal;