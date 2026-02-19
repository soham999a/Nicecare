import { useStores } from '../../hooks/useStores';
import { useEmployees } from '../../hooks/useEmployees';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import InventoryNavbar from '../../components/inventory/InventoryNavbar';
import LowStockAlert from '../../components/inventory/LowStockAlert';
import InventoryChatbot from '../../components/inventory/InventoryChatbot';


export default function MasterDashboard() {
  const { userProfile } = useInventoryAuth();
  const { stores, loading: storesLoading } = useStores();
  const { employees, loading: employeesLoading } = useEmployees();
  const { products, lowStockProducts, loading: productsLoading } = useProducts();
  const { stats, loading: salesLoading } = useSales();

  const loading = storesLoading || employeesLoading || productsLoading || salesLoading;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="inventory-dashboard">
      <InventoryNavbar />
      
      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {userProfile?.displayName || 'Business Owner'}</h1>
            <p>Here's an overview of your business</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <LowStockAlert products={lowStockProducts} />
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stores">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : stores.length}</h3>
              <p>Total Stores</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon employees">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : employees.length}</h3>
              <p>Total Employees</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : products.length}</h3>
              <p>Total Products</p>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon revenue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : formatCurrency(stats.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="stats-grid secondary">
          <div className="stat-card small">
            <div className="stat-info">
              <h3>{loading ? '...' : stats.todaySales}</h3>
              <p>Today's Sales</p>
            </div>
          </div>

          <div className="stat-card small">
            <div className="stat-info">
              <h3>{loading ? '...' : formatCurrency(stats.todayRevenue)}</h3>
              <p>Today's Revenue</p>
            </div>
          </div>

          <div className="stat-card small">
            <div className="stat-info">
              <h3>{loading ? '...' : formatCurrency(stats.averageOrderValue)}</h3>
              <p>Avg. Order Value</p>
            </div>
          </div>

          <div className="stat-card small warning">
            <div className="stat-info">
              <h3>{loading ? '...' : lowStockProducts.length}</h3>
              <p>Low Stock Items</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <a href="/inventory/stores" className="quick-action-card">
              <div className="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span>Add Store</span>
            </a>
            <a href="/inventory/employees" className="quick-action-card">
              <div className="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              </div>
              <span>Add Employee</span>
            </a>
            <a href="/inventory/products" className="quick-action-card">
              <div className="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="12" y1="10" x2="12" y2="18"/>
                  <line x1="8" y1="14" x2="16" y2="14"/>
                </svg>
              </div>
              <span>Add Product</span>
            </a>
            <a href="/inventory/sales" className="quick-action-card">
              <div className="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <span>View Reports</span>
            </a>
          </div>
        </div>

        {/* Recent Activity - Stores Overview */}
        <div className="overview-section">
          <div className="overview-header">
            <h3>Stores Overview</h3>
            <a href="/inventory/stores">View All</a>
          </div>
          <div className="overview-content">
            {loading ? (
              <p className="empty-message">Loading stores...</p>
            ) : stores.length === 0 ? (
              <p className="empty-message">No stores yet. Create your first store to get started.</p>
            ) : (
              stores.slice(0, 5).map((store) => (
                <div key={store.id} className="overview-item">
                  <div>
                    <div className="name">{store.name}</div>
                    <div className="meta">{store.address || 'No address'}</div>
                  </div>
                  <div className="meta">
                    {store.employeeCount || 0} employees
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overview-section">
          <div className="overview-header">
            <h3>Recent Employees</h3>
            <a href="/inventory/employees">View All</a>
          </div>
          <div className="overview-content">
            {loading ? (
              <p className="empty-message">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="empty-message">No employees yet. Add employees to your stores.</p>
            ) : (
              employees.slice(0, 5).map((employee) => (
                <div key={employee.id} className="overview-item">
                  <div>
                    <div className="name">{employee.displayName}</div>
                    <div className="meta">{employee.assignedStoreName || 'Unassigned'}</div>
                  </div>
                  <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* AI Chatbot */}
      <InventoryChatbot />
    </div>
  );
}
