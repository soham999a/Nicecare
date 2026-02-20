import { useState } from 'react';
import InventoryNavbar from '../../components/inventory/InventoryNavbar';
import CustomerForm from '../../components/CustomerForm';
import CustomerTable from '../../components/CustomerTable';
import CustomerChatbot from '../../components/CustomerChatbot';
import { useCustomers } from '../../hooks/useCustomers';
import { useStores } from '../../hooks/useStores';
import { useInventoryAuth } from '../../context/InventoryAuthContext';

export default function CRMPage() {
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
    <div className="dashboard">
      <InventoryNavbar />
      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}

        {isMaster && stores?.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
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

        <div className="grid">
          <CustomerForm onSubmit={handleAddCustomer} loading={addingCustomer} />

          {loading ? (
            <section className="card">
              <h3>Submitted Customer Details</h3>
              <div className="loading">Loading...</div>
            </section>
          ) : (
            <section className="card">
              <h3>Submitted Customer Details</h3>
              <CustomerTable
                customers={customers}
                onUpdateStatus={handleUpdateStatus}
                onUpdateCustomer={handleUpdateCustomer}
                onDelete={handleDeleteCustomer}
                updatingCustomer={updatingCustomer}
              />
            </section>
          )}
        </div>
      </main>

      <CustomerChatbot />
    </div>
  );
}
