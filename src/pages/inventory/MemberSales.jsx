import { useSales } from '../../hooks/useSales';
import { useInventoryAuth } from '../../context/InventoryAuthContext';

export default function MemberSales() {
  const { userProfile, currentUser } = useInventoryAuth();
  const storeId = userProfile?.assignedStoreId;

  const { sales, loading, error } = useSales(storeId);

  // Filter sales to only show current employee's sales
  const mySales = sales.filter(sale => sale.employeeId === currentUser?.uid);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate my stats
  const myStats = {
    totalSales: mySales.length,
    totalRevenue: mySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    todaySales: mySales.filter(sale => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const saleDate = sale.createdAt?.toDate?.() || new Date(sale.createdAt);
      return saleDate && saleDate >= today;
    }),
  };
  myStats.todayRevenue = myStats.todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  myStats.todayCount = myStats.todaySales.length;

  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1>My Sales</h1>
          <p>View your sales history at {userProfile?.assignedStoreName || 'your store'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-icon today">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : formatCurrency(myStats.todayRevenue)}</h3>
            <p>Today's Sales ({myStats.todayCount})</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : formatCurrency(myStats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sales">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : myStats.totalSales}</h3>
            <p>Total Transactions</p>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="card">
        <div className="card-header">
          <h2>Sales History</h2>
          <span className="badge">{mySales.length} sales</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading sales...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : mySales.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <h3>No sales yet</h3>
            <p>Your sales will appear here</p>
            <a href="/inventory/pos" className="btn btn-primary">
              Go to POS
            </a>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table inventory-list-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {mySales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>
                      <div className="customer-cell">
                        <span>{sale.customerName || 'Walk-in'}</span>
                        {sale.customerPhone && (
                          <small>{sale.customerPhone}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="items-cell">
                        <span className="items-count">{sale.itemCount} items</span>
                        <div className="items-preview">
                          {sale.items?.slice(0, 2).map((item, idx) => (
                            <span key={idx}>{item.productName}</span>
                          ))}
                          {sale.items?.length > 2 && (
                            <span>+{sale.items.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`payment-badge ${sale.paymentMethod?.toLowerCase()}`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <strong>{formatCurrency(sale.total)}</strong>
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
