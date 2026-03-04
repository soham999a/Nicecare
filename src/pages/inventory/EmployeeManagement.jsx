import { useState, useEffect } from 'react';
import { useEmployees } from '../../hooks/useEmployees';
import { useStores } from '../../hooks/useStores';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function EmployeeManagement() {
  // add body class to eliminate padding/gaps for this page
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => {
      document.body.classList.remove('edge-to-edge-page');
    };
  }, []);

  const { employees, loading, error, creating, createEmployee, updateEmployee, toggleEmployeeActive, deleteEmployee } = useEmployees();
  const { stores } = useStores();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeId: '',
    storeName: '',
  });
  const [formError, setFormError] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone: '',
      storeId: '',
      storeName: '',
    });
    setEditingEmployee(null);
    setShowForm(false);
    setFormError('');
  }

  function handleStoreChange(storeId) {
    const store = stores.find(s => s.id === storeId);
    setFormData({
      ...formData,
      storeId,
      storeName: store?.name || '',
    });
  }

  function handleEdit(employee) {
    setFormData({
      name: employee.displayName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      storeId: employee.assignedStoreId || '',
      storeName: employee.assignedStoreName || '',
    });
    setEditingEmployee(employee);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Employee name is required');
      return;
    }

    if (!editingEmployee && !formData.email.trim()) {
      setFormError('Email is required for new employees');
      return;
    }

    if (!formData.storeId) {
      setFormError('Please assign the employee to a store');
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          displayName: formData.name,
          phone: formData.phone,
          assignedStoreId: formData.storeId,
          assignedStoreName: formData.storeName,
        });
        resetForm();
      } else {
        const result = await createEmployee({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          storeId: formData.storeId,
          storeName: formData.storeName,
        });
        setNewEmployeeCredentials(result);
        resetForm();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save employee');
    }
  }

  async function handleToggleActive(employee) {
    try {
      await toggleEmployeeActive(employee.id, !employee.isActive);
    } catch (err) {
      alert('Failed to update employee status: ' + err.message);
    }
  }

  async function handleDelete(employeeId, employeeName) {
    setDeleteConfirm({ id: employeeId, name: employeeName });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    try {
      await deleteEmployee(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete employee: ' + err.message);
      setDeleteConfirm(null);
    }
  }

  const filteredEmployees = filterStore
    ? employees.filter(e => e.assignedStoreId === filterStore)
    : employees;

  return (
    <main className="dashboard-content">
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Remove Employee"
        message={`Are you sure you want to remove "${deleteConfirm?.name}"? This will deactivate their account.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="page-header">
        <div>
          <h1>Employee Management</h1>
          <p>Manage your store employees</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => setShowForm(!showForm)}
          disabled={stores.length === 0}
          title={showForm ? "Close form" : "Add new employee"}
        >
          {showForm ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            '+ Add Employee'
          )}
        </button>
      </div>

      {stores.length === 0 && (
        <div className="alert alert-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You need to create at least one store before adding employees.
          <a href="/inventory/stores" className="alert-link">Create a store</a>
        </div>
      )}

      {/* New Employee Invitation Modal */}
      {newEmployeeCredentials && (
        <div className="modal-overlay">
          <ModalSuccessContent 
            credentials={newEmployeeCredentials} 
            onClose={() => setNewEmployeeCredentials(null)} 
          />
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card form-card">
          <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>

          {formError && (
            <div className="alert alert-error">{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Email {!editingEmployee && '*'}</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@company.com"
                  disabled={editingEmployee}
                  required={!editingEmployee}
                />
                {editingEmployee && (
                  <span className="input-hint">Email cannot be changed</span>
                )}
              </div>

              <div className="form-group">
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label className="label">Assigned Store *</label>
                <select
                  className="select"
                  value={formData.storeId}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
              </button>
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      {stores.length > 0 && (
        <div className="filters-bar">
          <div className="filter-group">
            <label>Filter by Store:</label>
            <select
              className="select"
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="card">
        <div className="card-header">
          <h2>Your Employees</h2>
          <span className="badge">{filteredEmployees.length} employees</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading employees...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>No employees yet</h3>
            <p>{filterStore ? 'No employees in this store' : 'Add employees to your stores'}</p>
            {!filterStore && stores.length > 0 && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Add Employee
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table inventory-list-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Assigned Store</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className={!employee.isActive ? 'inactive-row' : ''}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {employee.displayName?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <strong>{employee.displayName}</strong>
                      </div>
                    </td>
                    <td>{employee.email}</td>
                    <td>{employee.phone || '-'}</td>
                    <td>
                      <span className="store-badge">
                        {employee.assignedStoreName || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(employee)}
                          title="Edit"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`btn-icon ${employee.isActive ? 'warning' : 'success'}`}
                          onClick={() => handleToggleActive(employee)}
                          title={employee.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {employee.isActive ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(employee.id, employee.displayName)}
                          title="Delete"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

// Sub-component for the Success Modal to handle copy feedback
function ModalSuccessContent({ credentials, onClose }) {
  const [copiedType, setCopiedType] = useState(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const signupLink = `${window.location.origin}/inventory/signup?type=employee&code=${credentials.inviteCode}`;

  return (
    <div className="modal success-modal-container">
      <div className="success-icon-wrapper">
        <div className="success-circle-bg">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-svg">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <div className="modal-content-center">
        <h2>Invitation Ready!</h2>
        <p className="subtitle">Account created for <strong>{credentials.name}</strong>. Share the details below.</p>
        
        <div className="credentials-card">
          <div className="credential-row">
            <div className="cred-info">
              <label>Email Address</label>
              <span>{credentials.email}</span>
            </div>
          </div>

          <div className="credential-row">
            <div className="cred-info">
              <label>Invitation Code</label>
              <span className="code-text">{credentials.inviteCode}</span>
            </div>
            <button 
              className={`copy-pill-btn ${copiedType === 'code' ? 'copied' : ''}`}
              onClick={() => handleCopy(credentials.inviteCode, 'code')}
            >
              {copiedType === 'code' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          <div className="credential-row">
            <div className="cred-info link-info">
              <label>Direct Signup Link</label>
              <input 
                readOnly 
                className="minimal-link-input"
                value={signupLink}
              />
            </div>
            <button 
              className={`copy-pill-btn primary ${copiedType === 'link' ? 'copied' : ''}`}
              onClick={() => handleCopy(signupLink, 'link')}
            >
              {copiedType === 'link' ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="invitation-notice">
          <div className="notice-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Expires in 7 days</span>
          </div>
          <p>The employee can sign up using an existing account or create a new one using this link.</p>
        </div>
      </div>

      <div className="modal-footer-simple">
        <button className="btn-done-full" onClick={onClose}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}