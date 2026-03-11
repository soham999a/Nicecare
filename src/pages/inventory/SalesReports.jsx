import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useSales } from '../../hooks/useSales';
import { useStores } from '../../hooks/useStores';

const thCls =
  'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400 border-b-2 border-x border-slate-200 dark:border-gray-700 first:border-l-0 last:border-r-0';
const tdCls =
  'px-4 py-3.5 text-left border-b border-x border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-50 first:border-l-0 last:border-r-0';

function getPaymentBadgeClasses(method) {
  const base =
    'inline-flex items-center px-2 py-0.5 rounded-full text-[0.71rem] font-bold uppercase';
  switch (method?.toLowerCase()) {
    case 'cash':
      return `${base} bg-emerald-600/[0.14] text-emerald-600 dark:text-emerald-400`;
    case 'card':
      return `${base} bg-blue-600/[0.14] text-blue-600 dark:text-blue-400`;
    case 'upi':
    case 'bank':
    case 'transfer':
      return `${base} bg-violet-600/[0.14] text-violet-600`;
    default:
      return `${base} bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-400`;
  }
}

export default function SalesReports() {
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => document.body.classList.remove('edge-to-edge-page');
  }, []);

  const { userProfile } = useInventoryAuth();
  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';

  if (!isMaster && !isManager) {
    return <Navigate to="/inventory/pos" replace />;
  }

  return (
    <SalesReportsContent
      userProfile={userProfile}
      isMaster={isMaster}
      isManager={isManager}
    />
  );
}

function SalesReportsContent({ userProfile, isMaster, isManager }) {
  const { stores } = useStores();
  const [filterStore, setFilterStore] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

  const managerStoreId = isManager ? userProfile?.assignedStoreId || null : null;
  const managerStoreName = isManager ? (userProfile?.assignedStoreName || 'My Store') : '';
  const effectiveStores = isManager && managerStoreId
    ? [{ id: managerStoreId, name: managerStoreName }]
    : stores;

  const { sales, stats, loading, error, getSalesReport } = useSales(
    managerStoreId || filterStore || null,
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
    <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-[1.9rem] font-bold tracking-tight text-slate-900 dark:text-gray-50">
            Sales Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            {isMaster ? 'View and analyze sales across all stores' : 'View and analyze sales for your store'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 flex items-start gap-4 transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight break-words">
              {loading ? '...' : formatCurrency(stats.totalRevenue)}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm">Total Revenue</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 flex items-start gap-4 transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight break-words">
              {loading ? '...' : stats.totalSales}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm">Total Transactions</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 flex items-start gap-4 transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight break-words">
              {loading ? '...' : formatCurrency(stats.averageOrderValue)}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm">Average Order Value</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 to-sky-500/10 rounded-2xl p-6 border border-blue-600 dark:border-blue-400 flex items-start gap-4 transition-all duration-200 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight break-words">
              {loading ? '...' : formatCurrency(stats.todayRevenue)}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm">
              Today's Revenue ({stats.todaySales} sales)
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3.5 flex-nowrap p-4 rounded-[14px] border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-md:flex-col max-md:items-stretch">
        <div className="flex flex-col gap-1 min-w-[180px] max-md:min-w-full">
          <label className="text-[0.73rem] font-bold tracking-wider uppercase text-slate-600 dark:text-gray-400">
            Store:
          </label>
          {!isManager ? (
            <select
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0a0f1a] text-slate-900 dark:text-gray-50 text-sm truncate min-w-[180px] max-w-[250px]"
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {effectiveStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0a0f1a] text-slate-900 dark:text-gray-50 text-sm truncate min-w-[180px] max-w-[250px]"
              value={managerStoreName || 'Unassigned'}
              readOnly
            />
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-[180px] max-md:min-w-full">
          <label className="text-[0.73rem] font-bold tracking-wider uppercase text-slate-600 dark:text-gray-400">
            From:
          </label>
          <input
            type="date"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0a0f1a] text-slate-900 dark:text-gray-50 text-sm"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({
              ...dateRange,
              start: new Date(e.target.value),
            })}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[180px] max-md:min-w-full">
          <label className="text-[0.73rem] font-bold tracking-wider uppercase text-slate-600 dark:text-gray-400">
            To:
          </label>
          <input
            type="date"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0a0f1a] text-slate-900 dark:text-gray-50 text-sm"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({
              ...dateRange,
              end: new Date(e.target.value),
            })}
          />
        </div>

        <button
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={handleGenerateReport}
          disabled={generatingReport}
        >
          {generatingReport ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report Summary */}
      {reportData && (
        <div className="rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-gray-50">
              Report Summary
            </h2>
            <span className="text-slate-600 dark:text-gray-400 text-sm font-semibold">
              {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[repeat(2,minmax(240px,1fr))] gap-4">
            <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-[#0a0f1a]">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-gray-50">
                Payment Methods
              </h3>
              <div>
                {Object.entries(reportData.paymentMethodBreakdown || {}).map(([method, amount]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-gray-700 text-sm last:border-b-0"
                  >
                    <span className="text-slate-900 dark:text-gray-50">{method}</span>
                    <span className="font-bold text-slate-900 dark:text-gray-50">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-[#0a0f1a]">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-gray-50">
                Daily Revenue
              </h3>
              <div>
                {Object.entries(reportData.dailyRevenue || {}).slice(0, 7).map(([date, amount]) => (
                  <div
                    key={date}
                    className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-gray-700 text-sm last:border-b-0"
                  >
                    <span className="text-slate-900 dark:text-gray-50">{date}</span>
                    <span className="font-bold text-slate-900 dark:text-gray-50">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-5 mb-4">
          <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-gray-50">
            Recent Transactions
          </h2>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-600/20">
            {sales.length} transactions
          </span>
        </div>

        {loading ? (
          <div className="min-h-[170px] flex items-center justify-center border border-dashed border-slate-200 dark:border-gray-700 rounded-[10px] mt-2 mx-5 mb-5 text-[0.94rem] text-slate-600 dark:text-gray-400">
            Loading sales...
          </div>
        ) : error ? (
          <div className="min-h-[170px] flex items-center justify-center border border-dashed rounded-[10px] mt-2 mx-5 mb-5 text-[0.94rem] text-red-600 border-red-600/35 bg-red-600/5">
            {error}
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 px-8 text-slate-600 dark:text-gray-400">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 opacity-50"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <h3 className="text-slate-900 dark:text-gray-50 mb-2">No sales yet</h3>
            <p>Sales will appear here once transactions are made</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-gray-700 rounded-[14px] bg-white dark:bg-gray-900 overflow-x-auto mx-5 mb-5">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Customer</th>
                  <th className={thCls}>Items</th>
                  <th className={thCls}>Payment</th>
                  <th className={thCls}>Total</th>
                  <th className={thCls}>Employee</th>
                  <th className={thCls}>Store</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 last:[&>td]:border-b"
                  >
                    <td className={tdCls}>{formatDate(sale.createdAt)}</td>
                    <td className={tdCls}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">
                          {sale.customerName || 'Walk-in'}
                        </span>
                        {sale.customerPhone && (
                          <small className="text-slate-600 dark:text-gray-400 text-xs">
                            {sale.customerPhone}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className={tdCls}>
                      <span className="text-slate-600 dark:text-gray-400 text-sm font-semibold">
                        {sale.itemCount} items
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className={getPaymentBadgeClasses(sale.paymentMethod)}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <strong>{formatCurrency(sale.total)}</strong>
                    </td>
                    <td className={tdCls}>{sale.employeeName || '-'}</td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                        {effectiveStores.find(s => s.id === sale.storeId)?.name || 'Unknown'}
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
  );
}
