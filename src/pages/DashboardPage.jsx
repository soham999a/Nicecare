import Navbar from '../components/Navbar';
import CustomerForm from '../components/CustomerForm';
import CustomerTable from '../components/CustomerTable';
import CustomerChatbot from '../components/CustomerChatbot';
import { useCustomers } from '../hooks/useCustomers';
import { useState } from 'react';

export default function DashboardPage() {
  const {
    customers,
    loading,
    error,
    addingCustomer,
    addCustomer,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer,
  } = useCustomers();

  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  async function handleAddCustomer(formData) {
    try {
      await addCustomer(formData);
    } catch (err) {
      alert('Failed to add customer. Please try again.');
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
      <Navbar />
      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}
        
        <div className="grid">
          <CustomerForm onSubmit={handleAddCustomer} loading={addingCustomer} />
          
          {loading ? (
            <section className="card">
              <h3>Submitted Customer Details</h3>
              <div className="loading">Loading...</div>
            </section>
          ) : (
            <CustomerTable
              customers={customers}
              onUpdateStatus={handleUpdateStatus}
              onUpdateCustomer={handleUpdateCustomer}
              onDelete={handleDeleteCustomer}
              updatingCustomer={updatingCustomer}
            />
          )}
        </div>
      </main>
      
      {/* AI Chatbot for customer data queries */}
      <CustomerChatbot />
    </div>
  );
}
