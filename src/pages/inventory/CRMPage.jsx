import { useState, useEffect } from 'react';
import CustomerForm from '../../components/CustomerForm';
import CustomerTable from '../../components/CustomerTable';
import { useCustomers } from '../../hooks/useCustomers';
import { useStores } from '../../hooks/useStores';
import { useInventoryAuth } from '../../context/InventoryAuthContext';

export default function CRMPage() {
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => document.body.classList.remove('edge-to-edge-page');
  }, []);

  const { userProfile } = useInventoryAuth();
  const isMaster = userProfile?.role === 'master';

  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const { stores } = useStores();

  const {
    customers,
    loading,
    error,
    addingCustomer,
    addCustomer,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer,
  } = useCustomers(isMaster ? selectedStoreId : null);

  const [updatingCustomer, setUpdatingCustomer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // disable body scroll while the add modal is visible
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  async function handleAddCustomer(formData) {
    try {
      const payload = { ...formData };
      if (isMaster) {
        const storeId = selectedStoreId || (stores?.length ? stores[0].id : null);
        if (!storeId) {
          alert('Please create a store first (Stores page), or select a store to add customers.');
          return;
        }
        payload.storeId = storeId;
      }
      await addCustomer(payload);
      // only close modal after successful addition
      setShowAddModal(false);
    } catch (err) {
      alert(err.message || 'Failed to add customer. Please try again.');
    }
  }

  async function handleUpdateCustomer(customerId, formData) {
    setUpdatingCustomer(true);
    try {
      await updateCustomer(customerId, formData);
    } catch (err) {
      alert('Failed to update customer. Please try again.');
      throw err;
    } finally {
      setUpdatingCustomer(false);
    }
  }

  async function handleUpdateStatus(customerId, newStatus) {
    try {
      await updateCustomerStatus(customerId, newStatus);
    } catch (err) {
      alert('Failed to update status. Please try again.');
    }
  }

  async function handleDeleteCustomer(customerId) {
    try {
      await deleteCustomer(customerId);
    } catch (err) {
      alert('Failed to delete customer. Please try again.');
    }
  }

  return (
    <main className="dashboard-content">
      {error && <div className="error-banner">{error}</div>}

      {isMaster && stores?.length > 0 && (
        <div className="card store-filter-card" style={{ marginBottom: '1rem' }}>
          <label htmlFor="crm-store-filter" style={{ marginRight: '0.5rem' }}>Store:</label>
          <select
            id="crm-store-filter"
            value={selectedStoreId || ''}
            onChange={(e) => setSelectedStoreId(e.target.value || null)}
            style={{ padding: '0.35rem 0.75rem', borderRadius: 6 }}
          >
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* control bar with add button */}
      <div className="crm-controls">
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ Create New Customer Details
        </button>
      </div>

      {/* modal for adding new customer */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>➕ Add a New Customer Detail</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <CustomerForm onSubmit={handleAddCustomer} loading={addingCustomer} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container card">
          <h3>Submitted Customer Details</h3>
          <div className="loading">Loading...</div>
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          onUpdateStatus={handleUpdateStatus}
          onUpdateCustomer={handleUpdateCustomer}
          onDelete={handleDeleteCustomer}
          updatingCustomer={updatingCustomer}
        />
      )}
    </main>
  );
}
