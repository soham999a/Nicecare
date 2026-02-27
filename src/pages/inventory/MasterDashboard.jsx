import React, { useState, useEffect } from 'react';
import { useStores } from '../../hooks/useStores';
import { useEmployees } from '../../hooks/useEmployees';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import LowStockAlert from '../../components/inventory/LowStockAlert';

export default function MasterDashboard() {
  const [showActions, setShowActions] = useState(false);
  const { userProfile } = useInventoryAuth();
  const { stores, loading: storesLoading } = useStores();
  const { employees, loading: employeesLoading } = useEmployees();
  const { products, lowStockProducts, loading: productsLoading } = useProducts();
  const { stats, loading: salesLoading } = useSales();

  // Prevent background scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = showActions ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showActions]);

  const loading = storesLoading || employeesLoading || productsLoading || salesLoading;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <main className="dashboard-container">
      {/* --- PREMIUM MODAL --- */}
      {showActions && (
        <div className="modal-overlay" onClick={() => setShowActions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quick Actions</h2>
              <p>Streamline your workflow by choosing an action below</p>
            </div>
            
            <div className="modal-actions-grid">
              <ModalAction href="/inventory/stores" label="Add Store" icon={<AddIcon />} />
              <ModalAction href="/inventory/employees" label="Add Employee" icon={<UserAddIcon />} />
              <ModalAction href="/inventory/products" label="Add Product" icon={<BoxAddIcon />} />
              <ModalAction href="/inventory/sales" label="View Reports" icon={<ReportIcon />} />
            </div>
            
            <button 
              className="btn-close-modal"
              onClick={() => setShowActions(false)}
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="dashboard-hero">
        <div className="hero-header">
          <div className="hero-content">
            <h1>Welcome back, {userProfile?.displayName || 'Business Owner'}</h1>
            <p>Monitor your performance and manage operations in real-time.</p>
          </div>
          <button className="btn-quick-action" onClick={() => setShowActions(true)}>
            <AddIcon />
            <span>Quick Actions</span>
          </button>
        </div>
      </section>

      <div className="dashboard-body">
        {/* --- MAIN STATS --- */}
        <div className="main-stats-overlap">
          <StatCard label="Total Stores" value={loading ? '...' : stores.length} icon={<StoreIcon />} type="stores" />
          <StatCard label="Total Products" value={loading ? '...' : products.length} icon={<ProductIcon />} type="products" />
          <StatCard label="Total Employees" value={loading ? '...' : employees.length} icon={<EmployeeIcon />} type="employees" />
          <StatCard label="Total Revenue" value={loading ? '...' : formatCurrency(stats?.totalRevenue)} icon={<RevenueIcon />} type="revenue" />
        </div>

        {/* ALERTS */}
        {lowStockProducts.length > 0 && (
          <div style={{marginBottom: '32px'}}>
            <LowStockAlert products={lowStockProducts} />
          </div>
        )}

        {/* --- SECONDARY STATS --- */}
        <div className="secondary-stats-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px'}}>
            <MiniCard label="Today's Sales" value={loading ? '...' : stats?.todaySales} />
            <MiniCard label="Today's Revenue" value={loading ? '...' : formatCurrency(stats?.todayRevenue)} />
            <MiniCard label="Avg. Order" value={loading ? '...' : formatCurrency(stats?.averageOrderValue)} />
            <MiniCard label="Low Stock" value={loading ? '...' : lowStockProducts.length} warning />
        </div>

        {/* --- TABLE OVERVIEWS --- */}
        <div className="overview-layout">
          
          {/* Stores Table Panel */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3>Stores Overview</h3>
              <a href="/inventory/stores">VIEW ALL</a>
            </div>
            <div className="panel-body">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>Location</th>
                    <th>Employees</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>Loading data...</td></tr>
                  ) : stores.slice(0, 5).map(store => (
                    <tr key={store.id}>
                      <td className="table-cell-bold">{store.name}</td>
                      <td className="table-cell-secondary">{store.address || 'Global Store'}</td>
                      <td className="table-cell-accent">{store.employeeCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employees Table Panel */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3>Recent Employees</h3>
              <a href="/inventory/employees">VIEW ALL</a>
            </div>
            <div className="panel-body">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Assigned Store</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>Loading data...</td></tr>
                  ) : employees.slice(0, 5).map(emp => (
                    <tr key={emp.id}>
                      <td className="table-cell-bold">{emp.displayName}</td>
                      <td className="table-cell-secondary">{emp.assignedStoreName || 'Corporate'}</td>
                      <td>
                        <span className={`status-pill ${emp.isActive ? 'active' : 'inactive'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

/* Sub-Components */
function MiniCard({ label, value, warning }) {
    return (
        <div className="mini-card">
            <span className="mini-card-label">{label}</span>
            <h3 className={`mini-card-value ${warning ? 'warning' : ''}`}>{value}</h3>
        </div>
    );
}

function ModalAction({ href, label, icon }) {
  return (
    <a href={href} className="modal-action-card">
      <div className="icon-wrap">{icon}</div>
      <span>{label}</span>
    </a>
  );
}

function StatCard({ label, value, icon, type }) {
  const colors = {
    stores: { bg: '#eef2ff', color: '#4318ff' },
    products: { bg: '#fef2f2', color: '#ee5d50' },
    employees: { bg: '#f0fdf4', color: '#05cd99' },
    revenue: { bg: '#fffbeb', color: '#ffb547' }
  };
  
  return (
    <div className="main-card">
      <div className="card-icon" style={{ background: colors[type].bg, color: colors[type].color }}>
        {icon}
      </div>
      <div className="card-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

/* Icons */
const StoreIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ProductIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const EmployeeIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
const RevenueIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const UserAddIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
const BoxAddIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="12" y1="10" x2="12" y2="18"/><line x1="8" y1="14" x2="16" y2="14"/></svg>;
const ReportIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;