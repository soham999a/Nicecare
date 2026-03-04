import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Constants for dropdown options (same as CustomerForm)
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

const FORM_MODE_KEY = 'customerFormMode';

export default function EditCustomerModal({ customer, onSave, onClose, loading, inline = false }) {
  const [formMode, setFormMode] = useState(() => {
    return localStorage.getItem(FORM_MODE_KEY) || 'minimal';
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    submissionDate: '',
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
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    customerInfo: true,
    deviceInfo: true,
    repairDetails: true,
    costParts: true,
  });

  // Initialize form data from customer
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        submissionDate: customer.submissionDate || '',
        expectedDate: customer.expectedDate || '',
        status: customer.status || 'Select',
        notes: customer.notes || '',
        alternatePhone: customer.alternatePhone || '',
        customerType: customer.customerType || '',
        preferredContact: customer.preferredContact || '',
        deviceType: customer.deviceType || '',
        brand: customer.brand || '',
        model: customer.model || '',
        imei: customer.imei || '',
        carrier: customer.carrier || '',
        issueCategory: customer.issueCategory || '',
        issueDescription: customer.issueDescription || '',
        repairType: customer.repairType || '',
        priority: customer.priority || '',
        estimatedCost: customer.estimatedCost || '',
        advancePaid: customer.advancePaid || '',
        partsType: customer.partsType || '',
        deviceReceivedDate: customer.deviceReceivedDate || '',
        repairStartDate: customer.repairStartDate || '',
        technicalStaffName: customer.technicalStaffName || '',
      });
    }
  }, [customer]);

  // Persist form mode preference
  useEffect(() => {
    localStorage.setItem(FORM_MODE_KEY, formMode);
  }, [formMode]);

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

    onSave(formData);
  }

  // Close modal on Escape key (only for modal mode)
  useEffect(() => {
    if (inline) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, inline]);

  // Prevent body scroll when modal is open (only for modal mode or fullscreen inline)
  useEffect(() => {
    if (inline && !isFullscreen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [inline, isFullscreen]);

  // Handle Escape key for fullscreen mode
  useEffect(() => {
    if (!inline || !isFullscreen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inline, isFullscreen]);

  const formContent = (
    <>
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

      <form onSubmit={handleSubmit} className="modal-form" id="edit-customer-form">
          {/* Basic Info - Always visible */}
          <div className="row two">
            <div>
              <label className="label" htmlFor="edit-name">Name *</label>
              <input
                id="edit-name"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
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
              <label className="label" htmlFor="edit-phone">Phone</label>
              <input
                id="edit-phone"
                name="phone"
                className="input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-address">Address</label>
              <input
                id="edit-address"
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
                      <label className="label" htmlFor="edit-alternatePhone">Alternate Phone</label>
                      <input
                        id="edit-alternatePhone"
                        name="alternatePhone"
                        className="input"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="edit-customerType">Customer Type</label>
                      <select
                        id="edit-customerType"
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
                      <label className="label" htmlFor="edit-preferredContact">Preferred Contact</label>
                      <select
                        id="edit-preferredContact"
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
                      <label className="label" htmlFor="edit-deviceType">Device Type</label>
                      <select
                        id="edit-deviceType"
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
                      <label className="label" htmlFor="edit-brand">Brand</label>
                      <select
                        id="edit-brand"
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
                      <label className="label" htmlFor="edit-model">Model</label>
                      <input
                        id="edit-model"
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
                      <label className="label" htmlFor="edit-imei">IMEI / Serial Number</label>
                      <input
                        id="edit-imei"
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
                      <label className="label" htmlFor="edit-carrier">Carrier</label>
                      <select
                        id="edit-carrier"
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
                      <label className="label" htmlFor="edit-issueCategory">Issue Category</label>
                      <select
                        id="edit-issueCategory"
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
                      <label className="label" htmlFor="edit-repairType">Repair Type</label>
                      <select
                        id="edit-repairType"
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
                      <label className="label" htmlFor="edit-priority">Priority</label>
                      <select
                        id="edit-priority"
                        name="priority"
                        className="select"
                        value={formData.priority}
                        onChange={handleChange}
                      >
                        <option value="">Select Priority</option>
                        {PRIORITY_LEVELS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="edit-issueDescription">Issue Description</label>
                    <textarea
                      id="edit-issueDescription"
                      name="issueDescription"
                      className="textarea"
                      value={formData.issueDescription}
                      onChange={handleChange}
                      placeholder="Describe the issue in detail..."
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="edit-technicalStaffName">Technical Staff Name</label>
                    <input
                      id="edit-technicalStaffName"
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
                      <label className="label" htmlFor="edit-estimatedCost">Estimated Cost ($)</label>
                      <input
                        id="edit-estimatedCost"
                        name="estimatedCost"
                        type="number"
                        className="input"
                        placeholder="0.00"
                        value={formData.estimatedCost}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="edit-advancePaid">Advance Paid ($)</label>
                      <input
                        id="edit-advancePaid"
                        name="advancePaid"
                        type="number"
                        className="input"
                        placeholder="0.00"
                        value={formData.advancePaid}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="edit-partsType">Parts Type</label>
                      <select
                        id="edit-partsType"
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
              <label className="label" htmlFor="edit-submissionDate">Submission Date *</label>
              <input
                id="edit-submissionDate"
                name="submissionDate"
                type="date"
                className="input"
                value={formData.submissionDate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-status">Status *</label>
              <select
                id="edit-status"
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
              <label className="label" htmlFor="edit-expectedDate">Expected Date</label>
              <input
                id="edit-expectedDate"
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
                <label className="label" htmlFor="edit-deviceReceivedDate">Device Received Date by Technical Staff</label>
                <input
                  id="edit-deviceReceivedDate"
                  name="deviceReceivedDate"
                  type="date"
                  className="input"
                  value={formData.deviceReceivedDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label" htmlFor="edit-repairStartDate">Repair Start Date</label>
                <input
                  id="edit-repairStartDate"
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
            <label className="label" htmlFor="edit-notes">Notes</label>
            <textarea
              id="edit-notes"
              name="notes"
              className="textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes here..."
            />
          </div>

          {warning && <div className="warning-message">⚠️ {warning}</div>}
          {error && <div className="error-message">{error}</div>}

          {!inline && (
            <div className="modal-actions">
              <button type="button" className="btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </form>
        {inline && (
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form="edit-customer-form" className="btn" disabled={loading}>
              {loading ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        )}
    </>
  );

  // Inline mode: render form content directly without modal wrapper
  if (inline) {
    const inlineContent = (
      <div className={`inline-edit-container ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="inline-edit-header">
          <h4>✏️ Edit Customer Record</h4>
          <div className="inline-edit-actions">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
        {formContent}
      </div>
    );

    if (isFullscreen) {
      return createPortal(
        <div className="fullscreen-overlay">
          {inlineContent}
        </div>,
        document.body
      );
    }

    return inlineContent;
  }

  // Modal mode: render with overlay and modal wrapper
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Edit Customer Record</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {formContent}
      </div>
    </div>
  );
}
