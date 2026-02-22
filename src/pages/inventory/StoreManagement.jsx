import { useState } from 'react';
import { useStores } from '../../hooks/useStores';

export default function StoreManagement() {
  const { stores, loading, error, addStore, updateStore, deleteStore } = useStores();
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function resetForm() {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
    });
    setEditingStore(null);
    setShowForm(false);
    setFormError('');
  }

  function handleEdit(store) {
    setFormData({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      manager: store.manager || '',
    });
    setEditingStore(store);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Store name is required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingStore) {
        await updateStore(editingStore.id, formData);
      } else {
        await addStore(formData);
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save store');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(storeId, storeName) {
    if (!window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteStore(storeId);
    } catch (err) {
      alert('Failed to delete store: ' + err.message);
    }
  }

  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1>Store Management</h1>
          <p>Manage your store locations</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Store'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card form-card">
          <h2>{editingStore ? 'Edit Store' : 'Add New Store'}</h2>

          {formError && (
            <div className="alert alert-error">{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="label">Store Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Downtown Store"
                  required
                />
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
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., store@company.com"
                />
              </div>

              <div className="form-group">
                <label className="label">Store Manager</label>
                <input
                  type="text"
                  className="input"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="e.g., John Smith"
                />
              </div>

              <div className="form-group full-width">
                <label className="label">Address</label>
                <textarea
                  className="textarea"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter store address"
                  rows={2}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingStore ? 'Update Store' : 'Add Store'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stores List */}
      <div className="card">
        <div className="card-header">
          <h2>Your Stores</h2>
          <span className="badge">{stores.length} stores</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading stores...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <h3>No stores yet</h3>
            <p>Create your first store to get started</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Add Store
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Manager</th>
                  <th>Employees</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <strong>{store.name}</strong>
                    </td>
                    <td>{store.address || '-'}</td>
                    <td>
                      <div className="contact-info">
                        {store.phone && <span>{store.phone}</span>}
                        {store.email && <span>{store.email}</span>}
                        {!store.phone && !store.email && '-'}
                      </div>
                    </td>
                    <td>{store.manager || '-'}</td>
                    <td>
                      <span className="badge">{store.employeeCount || 0}</span>
                    </td>
                    <td>
                      <span className="badge">{store.productCount || 0}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(store)}
                          title="Edit"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(store.id, store.name)}
                          title="Delete"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
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
