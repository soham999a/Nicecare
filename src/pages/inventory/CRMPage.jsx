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
          alert(
            'Please create a store first (Stores page), or select a store to add customers.'
          );
          return;
        }

        payload.storeId = storeId;
      }

      await addCustomer(payload);
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
    } catch (_err) {
      alert('Failed to update status. Please try again.');
    }
  }

  async function handleDeleteCustomer(customerId) {
    try {
      await deleteCustomer(customerId);
    } catch (_err) {
      alert('Failed to delete customer. Please try again.');
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in bg-slate-50 dark:bg-[#0a0f1a]">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-[1.9rem] font-bold tracking-tight text-slate-900 dark:text-gray-50">
            Customer Relationship Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage customer details and track interactions
          </p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Store Filter + Add Customer */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        {isMaster && stores?.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">

            <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Filter Store
            </span>

            <select
              id="crm-store-filter"
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
              className="min-w-[200px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-gray-600 
              bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500
              shadow-sm hover:border-blue-400 transition"
            >
              <option value="">All Stores</option>

              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

          </div>
        )}

        {/* Create Customer Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-700 hover:to-indigo-700
            text-white text-sm font-semibold
            rounded-lg shadow-md hover:shadow-lg
            transition-all duration-200"
          >
            <span className="text-lg">＋</span>
            Create New Customer
          </button>
        </div>

      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">

              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50">
                ➕ Add a New Customer Detail
              </h3>

              <button
                className="text-2xl leading-none text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 bg-transparent border-none cursor-pointer"
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

      {/* Customer Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm text-center">

          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50 mb-4">
            Submitted Customer Details
          </h3>

          <div className="text-slate-500 dark:text-gray-400">
            Loading...
          </div>

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