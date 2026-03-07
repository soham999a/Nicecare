import { useState, useEffect } from 'react';

// --- SVG ICONS ---
const Icons = {
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
  ),
  Laptop: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Wrench: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  Dollar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  ),
  Loader: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
  ),
  // Enhanced Success Icon for Popup
  Success: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )
};

// --- CONSTANTS ---
const STATUS_OPTIONS = [
  'Select',
  'Device Received',
  'Under Diagnosis',
  'Waiting for Parts',
  'Repair in Progress',
  'Quality Check',
  'Ready for Pickup',
  'Delivered',
  'Cancelled',
  'Unrepairable',
];

const DEVICE_TYPES = ['Phone', 'Tablet', 'Laptop', 'Wearable', 'Other'];
const BRANDS = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'LG', 'Other'];
const CARRIERS = ['AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'Unlocked', 'Other'];
const CUSTOMER_TYPES = ['Walk-in', 'Online', 'Corporate', 'Warranty'];
const CONTACT_METHODS = ['Call', 'SMS', 'Email'];
const ISSUE_CATEGORIES = ['Screen', 'Battery', 'Charging Port', 'Camera', 'Software', 'Water Damage', 'Other'];
const REPAIR_TYPES = ['Repair', 'Diagnostic Only', 'Data Recovery'];
const PRIORITY_LEVELS = ['Normal', 'Urgent', 'Same-day'];
const PARTS_TYPES = ['OEM', 'Aftermarket'];

const getInitialFormData = () => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  submissionDate: new Date().toISOString().slice(0, 10),
  expectedDate: '',
  status: 'Select',
  notes: '',
  alternatePhone: '',
  customerType: '',
  preferredContact: '',
  deviceType: '',
  brand: '',
  model: '',
  imei: '',
  carrier: '',
  issueCategory: '',
  issueDescription: '',
  repairType: '',
  priority: '',
  estimatedCost: '',
  advancePaid: '',
  partsType: '',
  deviceReceivedDate: '',
  repairStartDate: '',
  technicalStaffName: '',
});

const AUTOSAVE_KEY = 'customerFormAutosave';
const FORM_MODE_KEY = 'customerFormMode';

export default function CustomerForm({ onSubmit, loading }) {
  const [formMode, setFormMode] = useState(() => {
    return localStorage.getItem(FORM_MODE_KEY) || 'minimal';
  });
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...getInitialFormData(), ...parsed, submissionDate: new Date().toISOString().slice(0, 10) };
      } catch {
        return getInitialFormData();
      }
    }
    return getInitialFormData();
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    customerInfo: true,
    deviceInfo: true,
    repairDetails: true,
    costParts: true,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  // preserve the data that was just submitted so we can show it in the popup
  const [lastData, setLastData] = useState(null);

  useEffect(() => {
    localStorage.setItem(FORM_MODE_KEY, formMode);
  }, [formMode]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  function toggleSection(section) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setWarning('');
  }

  function validateIMEI(imei) {
    if (!imei) return true;
    return /^\d{15}$/.test(imei);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setWarning('');

    if (!formData.email && !formData.phone) {
      setError('Please provide either an email or phone number');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (formData.submissionDate > today) {
      setError('Submission Date cannot be a future date');
      return;
    }

    if (formData.expectedDate && formData.expectedDate < formData.submissionDate) {
      setError('Expected Date cannot be earlier than Submission Date');
      return;
    }

    if (formData.status === 'Select') {
      setError('Please select a valid status');
      return;
    }

    if (formData.imei && !validateIMEI(formData.imei)) {
      setError('IMEI must be exactly 15 digits');
      return;
    }

    onSubmit(formData);

    // set flag to show success modal
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);

    const initialData = getInitialFormData();
    setFormData(initialData);
    localStorage.removeItem(AUTOSAVE_KEY);
  }

  function handleReset() {
    const initialData = getInitialFormData();
    setFormData(initialData);
    localStorage.removeItem(AUTOSAVE_KEY);
    setError('');
    setWarning('');
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm relative overflow-hidden">
      
{/* --- ENHANCED SUCCESS POPUP --- */}
{showSuccess && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm rounded-xl transition-all duration-300 animate-in fade-in">
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 flex flex-col items-center text-center max-w-md w-full mx-4 transform transition-all duration-500 animate-in slide-in-from-bottom-4 zoom-in-105">
      <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-5 ring-4 ring-green-100 dark:ring-green-900/30 shadow-inner animate-in zoom-in-50 duration-500">
        <Icons.Success />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight animate-in slide-in-from-top-2 duration-700">Success!</h3>
      <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed animate-in slide-in-from-bottom-2 duration-700 delay-100">Customer record has been created successfully.</p>
      
      {/* Optional progress bar to show time remaining */}
      <div className="w-full h-1 bg-slate-100 dark:bg-gray-700 rounded-full mt-6 overflow-hidden">
        <div 
          className="h-full bg-green-500 dark:bg-green-400 rounded-full animate-in shrink-0"
        />
      </div>
    </div>
  </div>
)}

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${formMode === 'minimal' ? 'bg-blue-600 text-white border border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'}`}
          onClick={() => setFormMode('minimal')}
        >
          <Icons.Phone /> Minimal
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${formMode === 'detailed' ? 'bg-blue-600 text-white border border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'}`}
          onClick={() => setFormMode('detailed')}
        >
          <Icons.Laptop /> Detailed
        </button>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50 mb-4">Add a New Customer Detail</h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="name">Name *</label>
            <input
              id="name"
              name="name"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {formMode === 'detailed' && (
          <div className="border border-slate-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors"
              onClick={() => toggleSection('customerInfo')}
            >
              <span className="flex items-center gap-2"><Icons.User /> Extended Customer Info</span>
              <span className="text-slate-400 dark:text-gray-500">{expandedSections.customerInfo ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
            </button>
            {expandedSections.customerInfo && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="alternatePhone">Alternate Phone</label>
                    <input
                      id="alternatePhone"
                      name="alternatePhone"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="customerType">Customer Type</label>
                    <select
                      id="customerType"
                      name="customerType"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.customerType}
                      onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      {CUSTOMER_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="preferredContact">Preferred Contact</label>
                    <select
                      id="preferredContact"
                      name="preferredContact"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.preferredContact}
                      onChange={handleChange}
                    >
                      <option value="">Select Method</option>
                      {CONTACT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {formMode === 'detailed' && (
          <div className="border border-slate-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors"
              onClick={() => toggleSection('deviceInfo')}
            >
              <span className="flex items-center gap-2"><Icons.Phone /> Device Information</span>
              <span className="text-slate-400 dark:text-gray-500">{expandedSections.deviceInfo ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
            </button>
            {expandedSections.deviceInfo && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="deviceType">Device Type</label>
                    <select
                      id="deviceType"
                      name="deviceType"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.deviceType}
                      onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      {DEVICE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="brand">Brand</label>
                    <select
                      id="brand"
                      name="brand"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.brand}
                      onChange={handleChange}
                    >
                      <option value="">Select Brand</option>
                      {BRANDS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="model">Model</label>
                    <input
                      id="model"
                      name="model"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="e.g., iPhone 13 Pro"
                      value={formData.model}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="imei">IMEI / Serial Number</label>
                    <input
                      id="imei"
                      name="imei"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="15-digit IMEI"
                      value={formData.imei}
                      onChange={handleChange}
                      maxLength={15}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="carrier">Carrier</label>
                    <select
                      id="carrier"
                      name="carrier"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.carrier}
                      onChange={handleChange}
                    >
                      <option value="">Select Carrier</option>
                      {CARRIERS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {formMode === 'detailed' && (
          <div className="border border-slate-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors"
              onClick={() => toggleSection('repairDetails')}
            >
              <span className="flex items-center gap-2"><Icons.Wrench /> Repair Details</span>
              <span className="text-slate-400 dark:text-gray-500">{expandedSections.repairDetails ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
            </button>
            {expandedSections.repairDetails && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="issueCategory">Issue Category</label>
                    <select
                      id="issueCategory"
                      name="issueCategory"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.issueCategory}
                      onChange={handleChange}
                    >
                      <option value="">Select Issue</option>
                      {ISSUE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="repairType">Repair Type</label>
                    <select
                      id="repairType"
                      name="repairType"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.repairType}
                      onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      {REPAIR_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="">Normal</option>
                      {PRIORITY_LEVELS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="issueDescription">Issue Description</label>
                  <textarea
                    id="issueDescription"
                    name="issueDescription"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[80px] resize-y"
                    value={formData.issueDescription}
                    onChange={handleChange}
                    placeholder="Describe the issue in detail..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="technicalStaffName">Technical Staff Name</label>
                  <input
                    id="technicalStaffName"
                    name="technicalStaffName"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    value={formData.technicalStaffName}
                    onChange={handleChange}
                    placeholder="Name of assigned technician"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {formMode === 'detailed' && (
          <div className="border border-slate-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors"
              onClick={() => toggleSection('costParts')}
            >
              <span className="flex items-center gap-2"><Icons.Dollar /> Cost & Parts</span>
              <span className="text-slate-400 dark:text-gray-500">{expandedSections.costParts ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
            </button>
            {expandedSections.costParts && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="estimatedCost">Estimated Cost ($)</label>
                    <input
                      id="estimatedCost"
                      name="estimatedCost"
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="0.00"
                      value={formData.estimatedCost}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="advancePaid">Advance Paid ($)</label>
                    <input
                      id="advancePaid"
                      name="advancePaid"
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="0.00"
                      value={formData.advancePaid}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="partsType">Parts Type</label>
                    <select
                      id="partsType"
                      name="partsType"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={formData.partsType}
                      onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      {PARTS_TYPES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="submissionDate">Submission Date *</label>
            <input
              id="submissionDate"
              name="submissionDate"
              type="date"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.submissionDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="expectedDate">Expected Date</label>
            <input
              id="expectedDate"
              name="expectedDate"
              type="date"
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={formData.expectedDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {formMode === 'detailed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="deviceReceivedDate">Device Received Date by Technical Staff</label>
              <input
                id="deviceReceivedDate"
                name="deviceReceivedDate"
                type="date"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={formData.deviceReceivedDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="repairStartDate">Repair Start Date</label>
              <input
                id="repairStartDate"
                name="repairStartDate"
                type="date"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={formData.repairStartDate}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[80px] resize-y"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes here..."
          />
        </div>

        {warning && <div className="text-amber-600 dark:text-amber-400 text-sm mt-2 flex items-center gap-2"><Icons.Alert /> {warning}</div>}
        {error && <div className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</div>}

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <><Icons.Loader /> Adding...</> : <><Icons.Plus /> Add Customer</>}
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
            onClick={handleReset}
          >
            <Icons.Trash /> Clear
          </button>
        </div>
      </form>
      
    </section>
  );

  
}