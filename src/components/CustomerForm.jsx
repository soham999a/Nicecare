import { useState, useEffect } from 'react';

// Constants for dropdown options
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

// Initial form state with all fields
const getInitialFormData = () => ({
  // Basic customer info (minimal)
  name: '',
  email: '',
  phone: '',
  address: '',
  submissionDate: new Date().toISOString().slice(0, 10),
  expectedDate: '',
  status: 'Select',
  notes: '',
  // Extended customer info
  alternatePhone: '',
  customerType: '',
  preferredContact: '',
  // Device information
  deviceType: '',
  brand: '',
  model: '',
  imei: '',
  carrier: '',
  // Repair details
  issueCategory: '',
  issueDescription: '',
  repairType: '',
  priority: '',
  // Cost & parts
  estimatedCost: '',
  advancePaid: '',
  partsType: '',
  // Additional dates
  deviceReceivedDate: '',
  repairStartDate: '',
  // Technical staff
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
        // Update submission date to today if it's an old autosave
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

  // Persist form mode preference
  useEffect(() => {
    localStorage.setItem(FORM_MODE_KEY, formMode);
  }, [formMode]);

  // Autosave form data
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
    }, 500); // Debounce autosave by 500ms
    return () => clearTimeout(timeoutId);
  }, [formData]);

  function toggleSection(section) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setWarning(''); // Clear warning on change
  }

  // Validate IMEI format (15 digits)
  function validateIMEI(imei) {
    if (!imei) return true; // Optional field
    return /^\d{15}$/.test(imei);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setWarning('');

    // Validate that either email or phone is provided
    if (!formData.email && !formData.phone) {
      setError('Please provide either an email or phone number');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Validate submission date is not in the future
    if (formData.submissionDate > today) {
      setError('Submission Date cannot be a future date');
      return;
    }

    // Validate expected date is not before submission date
    if (formData.expectedDate && formData.expectedDate < formData.submissionDate) {
      setError('Expected Date cannot be earlier than Submission Date');
      return;
    }

    // Validate status is selected
    if (formData.status === 'Select') {
      setError('Please select a valid status');
      return;
    }

    // IMEI validation: block submission if present but not 15 digits
    if (formData.imei && !validateIMEI(formData.imei)) {
      setError('IMEI must be exactly 15 digits');
      return;
    }

    onSubmit(formData);

    // Reset form and clear autosave
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
    <section className="card">
      {/* Form Mode Toggle */}
      <div className="form-mode-toggle">
        <button
          type="button"
          className={`toggle-btn ${formMode === 'minimal' ? 'active' : ''}`}
          onClick={() => setFormMode('minimal')}
        >
          📱 Minimal
        </button>
        <button
          type="button"
          className={`toggle-btn ${formMode === 'detailed' ? 'active' : ''}`}
          onClick={() => setFormMode('detailed')}
        >
          💻 Detailed
        </button>
      </div>

      <h3>Add a New Customer Detail</h3>

      <form onSubmit={handleSubmit}>
        {/* Basic Info - Always visible */}
        <div className="row two">
          <div>
            <label className="label" htmlFor="name">Name *</label>
            <input
              id="name"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row two">
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label" htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              className="input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Extended Customer Info - Detailed mode only */}
        {formMode === 'detailed' && (
          <div className="collapsible-section">
            <button
              type="button"
              className="section-header"
              onClick={() => toggleSection('customerInfo')}
            >
              <span>👤 Extended Customer Info</span>
              <span className="toggle-icon">{expandedSections.customerInfo ? '▼' : '▶'}</span>
            </button>
            {expandedSections.customerInfo && (
              <div className="section-content">
                <div className="row three">
                  <div>
                    <label className="label" htmlFor="alternatePhone">Alternate Phone</label>
                    <input
                      id="alternatePhone"
                      name="alternatePhone"
                      className="input"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="customerType">Customer Type</label>
                    <select
                      id="customerType"
                      name="customerType"
                      className="select"
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
                    <label className="label" htmlFor="preferredContact">Preferred Contact</label>
                    <select
                      id="preferredContact"
                      name="preferredContact"
                      className="select"
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

        {/* Device Information - Detailed mode only */}
        {formMode === 'detailed' && (
          <div className="collapsible-section">
            <button
              type="button"
              className="section-header"
              onClick={() => toggleSection('deviceInfo')}
            >
              <span>📱 Device Information</span>
              <span className="toggle-icon">{expandedSections.deviceInfo ? '▼' : '▶'}</span>
            </button>
            {expandedSections.deviceInfo && (
              <div className="section-content">
                <div className="row three">
                  <div>
                    <label className="label" htmlFor="deviceType">Device Type</label>
                    <select
                      id="deviceType"
                      name="deviceType"
                      className="select"
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
                    <label className="label" htmlFor="brand">Brand</label>
                    <select
                      id="brand"
                      name="brand"
                      className="select"
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
                    <label className="label" htmlFor="model">Model</label>
                    <input
                      id="model"
                      name="model"
                      className="input"
                      placeholder="e.g., iPhone 13 Pro"
                      value={formData.model}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="row two">
                  <div>
                    <label className="label" htmlFor="imei">IMEI / Serial Number</label>
                    <input
                      id="imei"
                      name="imei"
                      className="input"
                      placeholder="15-digit IMEI"
                      value={formData.imei}
                      onChange={handleChange}
                      maxLength={15}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="carrier">Carrier</label>
                    <select
                      id="carrier"
                      name="carrier"
                      className="select"
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

        {/* Repair Details - Detailed mode only */}
        {formMode === 'detailed' && (
          <div className="collapsible-section">
            <button
              type="button"
              className="section-header"
              onClick={() => toggleSection('repairDetails')}
            >
              <span>🔧 Repair Details</span>
              <span className="toggle-icon">{expandedSections.repairDetails ? '▼' : '▶'}</span>
            </button>
            {expandedSections.repairDetails && (
              <div className="section-content">
                <div className="row three">
                  <div>
                    <label className="label" htmlFor="issueCategory">Issue Category</label>
                    <select
                      id="issueCategory"
                      name="issueCategory"
                      className="select"
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
                    <label className="label" htmlFor="repairType">Repair Type</label>
                    <select
                      id="repairType"
                      name="repairType"
                      className="select"
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
                    <label className="label" htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      className="select"
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
                <div>
                  <label className="label" htmlFor="issueDescription">Issue Description</label>
                  <textarea
                    id="issueDescription"
                    name="issueDescription"
                    className="textarea"
                    value={formData.issueDescription}
                    onChange={handleChange}
                    placeholder="Describe the issue in detail..."
                  />
                </div>
                <div>
                  <label className="label" htmlFor="technicalStaffName">Technical Staff Name</label>
                  <input
                    id="technicalStaffName"
                    name="technicalStaffName"
                    className="input"
                    value={formData.technicalStaffName}
                    onChange={handleChange}
                    placeholder="Name of assigned technician"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cost & Parts - Detailed mode only */}
        {formMode === 'detailed' && (
          <div className="collapsible-section">
            <button
              type="button"
              className="section-header"
              onClick={() => toggleSection('costParts')}
            >
              <span>💰 Cost & Parts</span>
              <span className="toggle-icon">{expandedSections.costParts ? '▼' : '▶'}</span>
            </button>
            {expandedSections.costParts && (
              <div className="section-content">
                <div className="row three">
                  <div>
                    <label className="label" htmlFor="estimatedCost">Estimated Cost ($)</label>
                    <input
                      id="estimatedCost"
                      name="estimatedCost"
                      type="number"
                      className="input"
                      placeholder="0.00"
                      value={formData.estimatedCost}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="advancePaid">Advance Paid ($)</label>
                    <input
                      id="advancePaid"
                      name="advancePaid"
                      type="number"
                      className="input"
                      placeholder="0.00"
                      value={formData.advancePaid}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="partsType">Parts Type</label>
                    <select
                      id="partsType"
                      name="partsType"
                      className="select"
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

        {/* Dates & Status - Always visible */}
        <div className="row three">
          <div>
            <label className="label" htmlFor="submissionDate">Submission Date *</label>
            <input
              id="submissionDate"
              name="submissionDate"
              type="date"
              className="input"
              value={formData.submissionDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              className="select"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="expectedDate">Expected Date</label>
            <input
              id="expectedDate"
              name="expectedDate"
              type="date"
              className="input"
              value={formData.expectedDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Additional Dates - Detailed mode only */}
        {formMode === 'detailed' && (
          <div className="row two">
            <div>
              <label className="label" htmlFor="deviceReceivedDate">Device Received Date by Technical Staff</label>
              <input
                id="deviceReceivedDate"
                name="deviceReceivedDate"
                type="date"
                className="input"
                value={formData.deviceReceivedDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label" htmlFor="repairStartDate">Repair Start Date</label>
              <input
                id="repairStartDate"
                name="repairStartDate"
                type="date"
                className="input"
                value={formData.repairStartDate}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            className="textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes here..."
          />
        </div>

        {warning && <div className="warning-message">⚠️ {warning}</div>}
        {error && <div className="error-message">{error}</div>}

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? '⏳ Adding...' : '➕ Add Customer'}
          </button>
          <button type="button" className="btn-outline" onClick={handleReset}>
            🗑️ Clear
          </button>
        </div>
      </form>
    </section>
  );
}
