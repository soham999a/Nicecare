import React, { useState, useMemo, useEffect } from 'react';
import EditCustomerModal from './EditCustomerModal';

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

// Helper to display value or N/A
const displayValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return <span className="detail-value na">N/A</span>;
  }
  return <span className="detail-value">{value}</span>;
};

// Helper to format currency
const formatCurrency = (value) => {
  if (!value) return <span className="detail-value na">N/A</span>;
  return <span className="detail-value">${parseFloat(value).toFixed(2)}</span>;
};

// Helper to get status badge class
const getStatusClass = (status) => {
  return status?.toLowerCase().replace(/\s+/g, '-') || '';
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusClass = getStatusClass(status);
  return (
    <span className={`status-badge ${statusClass}`}>
      {status}
    </span>
  );
};

export default function CustomerTable({ customers, onUpdateStatus, onUpdateCustomer, onDelete, updatingCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;

    const term = searchTerm.toLowerCase();
    return customers.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.imei?.toLowerCase().includes(term) ||
        customer.model?.toLowerCase().includes(term)
      );
    });
  }, [customers, searchTerm]);

  // adjust current page if filtered length changes
  useEffect(() => {
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredCustomers, currentPage]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  function toggleExpand(id) {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  // Check if customer has detailed data
  function hasDetailedData(customer) {
    return (
      customer.deviceType ||
      customer.brand ||
      customer.model ||
      customer.imei ||
      customer.issueCategory ||
      customer.estimatedCost ||
      customer.customerType
    );
  }

  function handleExport() {
    const headers = [
      'Name', 'Email', 'Phone', 'Address', 'Alternate Phone', 'Customer Type', 'Preferred Contact',
      'Device Type', 'Brand', 'Model', 'IMEI', 'Carrier',
      'Issue Category', 'Issue Description', 'Repair Type', 'Priority', 'Technical Staff Name',
      'Estimated Cost', 'Advance Paid', 'Parts Type',
      'Submission Date', 'Expected Date', 'Device Received Date by Technical Staff', 'Repair Start Date',
      'Status', 'Notes'
    ];
    const rows = filteredCustomers.map((c) => {
      return [
        c.name || '',
        c.email || '',
        c.phone || '',
        c.address || '',
        c.alternatePhone || '',
        c.customerType || '',
        c.preferredContact || '',
        c.deviceType || '',
        c.brand || '',
        c.model || '',
        c.imei || '',
        c.carrier || '',
        c.issueCategory || '',
        c.issueDescription || '',
        c.repairType || '',
        c.priority || '',
        c.technicalStaffName || '',
        c.estimatedCost || '',
        c.advancePaid || '',
        c.partsType || '',
        c.submissionDate || '',
        c.expectedDate || '',
        c.deviceReceivedDate || '',
        c.repairStartDate || '',
        c.status || '',
        c.notes || '',
      ].map((v) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v));
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this record?')) {
      onDelete(id);
    }
  }

  function handleEdit(customer) {
    setModalCustomer(customer);
    setShowEditModal(true);
  }

  async function handleSaveEdit(formData) {
    try {
      await onUpdateCustomer(modalCustomer.id, formData);
      setShowEditModal(false);
      setModalCustomer(null);
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  }

  function handleCancelEdit() {
    setShowEditModal(false);
    setModalCustomer(null);
  }

  if (customers.length === 0) {
    return (
      <section className="card">
        <h3>Submitted Customer Details</h3>
        <div className="empty">No records yet. Add your first customer!</div>
      </section>
    );
  }

  return (
    <>
    <section className="card">
      <h3>Submitted Customer Details</h3>

      <div className="search-bar">
        <input
          className="input"
          placeholder="🔍 Search by Name, Phone or Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn" onClick={handleExport}>
          📊 Export to CSV
        </button>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty">No matching records found</div>
      ) : (
        <>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Contact</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr>
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(customer.id)}
                        title={expandedRows.has(customer.id) ? 'Collapse details' : 'Expand details'}
                      >
                        {expandedRows.has(customer.id) ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>
                      <span className="customer-name">{customer.name}</span>
                      {customer.customerType && (
                        <span className="customer-type-tag">{customer.customerType}</span>
                      )}
                    </td>
                    <td>
                      <div className="contact-info">
                        <span className="contact-phone">{customer.phone || '—'}</span>
                        <span className="contact-email">{customer.email || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <span className="date-label">In:</span> {customer.submissionDate}
                        <br />
                        <span className="date-label">Due:</span> {customer.expectedDate || '—'}
                      </div>
                    </td>
                    <td>
                      {editingStatusId === customer.id ? (
                        <select
                          className="inline-select"
                          value={customer.status}
                          onChange={(e) => {
                            onUpdateStatus(customer.id, e.target.value);
                            setEditingStatusId(null);
                          }}
                          onBlur={() => setEditingStatusId(null)}
                          autoFocus
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button 
                          className="status-badge-btn"
                          onClick={() => setEditingStatusId(customer.id)}
                          title="Click to change status"
                        >
                          <StatusBadge status={customer.status} />
                        </button>
                      )}
                    </td>
                    <td>
                      <span className="notes-preview">{customer.notes || '—'}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-outline"
                          onClick={() => handleEdit(customer)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-outline btn-danger"
                          onClick={() => handleDelete(customer.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(customer.id) && (
                    <tr className="expanded-details">
                      <td colSpan="7">
                        <div className="details-grid">
                          {/* Customer Info */}
                          <div className="detail-group">
                            <h4>👤 Customer Info</h4>
                            <div className="detail-item">
                              <span className="detail-label">Customer Type</span>
                              {displayValue(customer.customerType)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Preferred Contact</span>
                              {displayValue(customer.preferredContact)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Alternate Phone</span>
                              {displayValue(customer.alternatePhone)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Address</span>
                              {displayValue(customer.address)}
                            </div>
                          </div>

                          {/* Device Info */}
                          <div className="detail-group">
                            <h4>📱 Device Info</h4>
                            <div className="detail-item">
                              <span className="detail-label">Device Type</span>
                              {displayValue(customer.deviceType)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Brand / Model</span>
                              {displayValue(customer.brand && customer.model ? `${customer.brand} ${customer.model}` : customer.brand || customer.model)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">IMEI / Serial</span>
                              {displayValue(customer.imei)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Carrier</span>
                              {displayValue(customer.carrier)}
                            </div>
                          </div>

                          {/* Repair Details */}
                          <div className="detail-group">
                            <h4>🔧 Repair Details</h4>
                            <div className="detail-item">
                              <span className="detail-label">Issue Category</span>
                              {displayValue(customer.issueCategory)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Repair Type</span>
                              {displayValue(customer.repairType)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Priority</span>
                              {displayValue(customer.priority)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Issue Description</span>
                              {displayValue(customer.issueDescription)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Technical Staff</span>
                              {displayValue(customer.technicalStaffName)}
                            </div>
                          </div>

                          {/* Cost & Parts */}
                          <div className="detail-group">
                            <h4>💰 Cost & Parts</h4>
                            <div className="detail-item">
                              <span className="detail-label">Estimated Cost</span>
                              {formatCurrency(customer.estimatedCost)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Advance Paid</span>
                              {formatCurrency(customer.advancePaid)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Balance Due</span>
                              {customer.estimatedCost ? (
                                <span className="detail-value">
                                  ${(parseFloat(customer.estimatedCost || 0) - parseFloat(customer.advancePaid || 0)).toFixed(2)}
                                </span>
                              ) : (
                                <span className="detail-value na">N/A</span>
                              )}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Parts Type</span>
                              {displayValue(customer.partsType)}
                            </div>
                          </div>

                          {/* Additional Dates */}
                          <div className="detail-group">
                            <h4>📅 Timeline</h4>
                            <div className="detail-item">
                              <span className="detail-label">Submitted</span>
                              {displayValue(customer.submissionDate)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Device Received</span>
                              {displayValue(customer.deviceReceivedDate)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Repair Started</span>
                              {displayValue(customer.repairStartDate)}
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Expected Completion</span>
                              {displayValue(customer.expectedDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {/* pagination controls */}
        {filteredCustomers.length > itemsPerPage && (
          <div className="pagination">
            <button
              className="btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ◀ Prev
            </button>
            <span className="page-number">
              Page {currentPage} of {Math.ceil(filteredCustomers.length / itemsPerPage)}
            </span>
            <button
              className="btn"
              disabled={currentPage >= Math.ceil(filteredCustomers.length / itemsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next ▶
            </button>
          </div>
        )}
        </>
      )}
    </section>

      {/* render the edit modal directly; the component already handles its own overlay
          avoiding a brief "popup inside a popup" which was caused by the outer wrapper */}
      {showEditModal && modalCustomer && (
        <EditCustomerModal
          customer={modalCustomer}
          onSave={handleSaveEdit}
          onClose={handleCancelEdit}
          loading={updatingCustomer}
        />
      )}
    </>
    );
}
