import { useState } from 'react';
import { useSales } from '../../hooks/useSales';
import { useStores } from '../../hooks/useStores';
import InventoryNavbar from '../../components/inventory/InventoryNavbar';

export default function SalesReports() {
  const { stores } = useStores();
  const [filterStore, setFilterStore] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  
  const { sales, stats, loading, error, getSalesReport } = useSales(
    filterStore || null,
    dateRange
  );

  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const report = await getSalesReport(
        dateRange.start,
        dateRange.end,
        filterStore || null
      );
      setReportData(report);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGeneratingReport(false);
    }
  }

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

  return (
    <div className="inventory-dashboard">
      <InventoryNavbar />
      
      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Sales Reports</h1>
            <p>View and analyze your sales data</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
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

          <div className="stat-card">
            <div className="stat-icon sales">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : stats.totalSales}</h3>
              <p>Total Transactions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon average">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : formatCurrency(stats.averageOrderValue)}</h3>
              <p>Average Order Value</p>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon today">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : formatCurrency(stats.todayRevenue)}</h3>
              <p>Today's Revenue ({stats.todaySales} sales)</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Store:</label>
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

          <div className="filter-group">
            <label>From:</label>
            <input
              type="date"
              className="input"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({
                ...dateRange,
                start: new Date(e.target.value),
              })}
            />
          </div>

          <div className="filter-group">
            <label>To:</label>
            <input
              type="date"
              className="input"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({
                ...dateRange,
                end: new Date(e.target.value),
              })}
            />
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={generatingReport}
          >
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report Summary */}
        {reportData && (
          <div className="card report-card">
            <div className="card-header">
              <h2>Report Summary</h2>
              <span className="date-range">
                {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
              </span>
            </div>
            
            <div className="report-grid">
              <div className="report-section">
                <h3>Payment Methods</h3>
                <div className="payment-breakdown">
                  {Object.entries(reportData.paymentMethodBreakdown || {}).map(([method, amount]) => (
                    <div key={method} className="payment-item">
                      <span className="method">{method}</span>
                      <span className="amount">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="report-section">
                <h3>Daily Revenue</h3>
                <div className="daily-breakdown">
                  {Object.entries(reportData.dailyRevenue || {}).slice(0, 7).map(([date, amount]) => (
                    <div key={date} className="daily-item">
                      <span className="date">{date}</span>
                      <span className="amount">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales List */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Transactions</h2>
            <span className="badge">{sales.length} transactions</span>
          </div>

          {loading ? (
            <div className="loading-state">Loading sales...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <h3>No sales yet</h3>
              <p>Sales will appear here once transactions are made</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Employee</th>
                    <th>Store</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
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
                        <span className="items-count">{sale.itemCount} items</span>
                      </td>
                      <td>
                        <span className={`payment-badge ${sale.paymentMethod?.toLowerCase()}`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <strong>{formatCurrency(sale.total)}</strong>
                      </td>
                      <td>{sale.employeeName || '-'}</td>
                      <td>
                        <span className="store-badge">
                          {stores.find(s => s.id === sale.storeId)?.name || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
