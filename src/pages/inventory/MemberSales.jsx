import { useEffect } from 'react';
import { useSales } from '../../hooks/useSales';
import { useInventoryAuth } from '../../context/InventoryAuthContext';

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

export default function MemberSales() {
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => document.body.classList.remove('edge-to-edge-page');
  }, []);

  const { userProfile, currentUser } = useInventoryAuth();
  const storeId = userProfile?.assignedStoreId;

  const { sales, loading, error } = useSales(storeId);

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
    <main className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="flex items-start gap-4 mb-2">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-2xl md:text-[1.9rem] font-bold tracking-tight text-slate-900 dark:text-gray-50">
            My Sales
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[0.95rem] text-slate-600 dark:text-gray-400">
              View your sales history at {userProfile?.assignedStoreName || 'your store'}
            </p>
            {userProfile?.assignedStoreName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Store: {userProfile.assignedStoreName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600/10 to-sky-500/10 rounded-2xl p-6 border border-blue-600 dark:border-blue-400 flex items-start gap-4 transition-all duration-200 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight">
              {loading ? '...' : formatCurrency(myStats.todayRevenue)}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm">
              Today's Sales ({myStats.todayCount})
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 flex items-start gap-4 transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight">
              {loading ? '...' : formatCurrency(myStats.totalRevenue)}
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
          <div>
            <h3 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-1 leading-tight">
              {loading ? '...' : myStats.totalSales}
            </h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm">Total Transactions</p>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-5 mb-4">
          <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-gray-50">
            Sales History
          </h2>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-600/20">
            {mySales.length} sales
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
        ) : mySales.length === 0 ? (
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
            <p>Your sales will appear here</p>
            <a
              href="/inventory/pos"
              className="inline-block mt-4 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Go to POS
            </a>
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
                </tr>
              </thead>
              <tbody>
                {mySales.map((sale) => (
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
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-600 dark:text-gray-400 text-sm font-semibold">
                          {sale.itemCount} items
                        </span>
                        <div className="flex flex-col gap-0.5 text-xs text-slate-400 dark:text-gray-500">
                          {sale.items?.slice(0, 2).map((item, idx) => (
                            <span key={idx}>{item.productName}</span>
                          ))}
                          {sale.items?.length > 2 && (
                            <span>+{sale.items.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <span className={getPaymentBadgeClasses(sale.paymentMethod)}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className={tdCls}>
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
