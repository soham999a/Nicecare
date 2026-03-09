import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useStores } from '../../hooks/useStores';
import { useEmployees } from '../../hooks/useEmployees';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useInventoryAuth } from '../../context/InventoryAuthContext';

export default function MasterDashboard() {
  const { userProfile } = useInventoryAuth();
  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';

  if (!isMaster && !isManager) {
    return <Navigate to="/inventory/pos" replace />;
  }

  return (
    <MasterDashboardContent
      userProfile={userProfile}
      isMaster={isMaster}
      isManager={isManager}
    />
  );
}

function MasterDashboardContent({ userProfile, isMaster, isManager }) {
  const { stores, loading: storesLoading } = useStores();
  const { employees, loading: employeesLoading } = useEmployees();
  const { products, lowStockProducts, loading: productsLoading } = useProducts();
  const { stats, loading: salesLoading } = useSales();

  const employeeCountByStore = useMemo(() => {
    const counts = {};
    for (const emp of employees) {
      if (emp.assignedStoreId) {
        counts[emp.assignedStoreId] = (counts[emp.assignedStoreId] || 0) + 1;
      }
    }
    return counts;
  }, [employees]);

  const loading = storesLoading || employeesLoading || productsLoading || salesLoading;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">

      {/* --- HERO SECTION --- */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {userProfile?.displayName || (isMaster ? 'Business Owner' : 'Store Manager')}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-blue-100 text-sm md:text-base">
                {isMaster
                  ? 'Monitor your performance and manage operations in real-time.'
                  : 'Monitor your assigned store performance and team operations in real-time.'}
              </p>
              {isManager && userProfile?.assignedStoreName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold tracking-wide">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  Store: {userProfile.assignedStoreName}
                </span>
              )}
            </div>
          </div>
          {lowStockProducts.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-xl px-4 py-3 max-w-md">
              <div className="text-amber-200 shrink-0 mt-0.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="space-y-1">
                <strong className="text-sm font-semibold text-amber-100">Low Stock Alert!</strong>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {lowStockProducts.slice(0, 3).map((product, idx) => (
                    <span key={idx} className="bg-white/15 px-2 py-0.5 rounded-full">{product.name}</span>
                  ))}
                  {lowStockProducts.length > 3 && <span className="text-amber-200">+{lowStockProducts.length - 3} more</span>}
                  <a href="/inventory/products" className="text-white font-semibold underline underline-offset-2 hover:text-amber-100 ml-1">View All</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-8">
        {/* --- MAIN STATS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 px-2">
          <StatCard label={isMaster ? 'Total Stores' : 'Assigned Store'} value={loading ? '...' : (isMaster ? stores.length : 1)} icon={<StoreIcon />} type="stores" />
          <StatCard label="Total Products" value={loading ? '...' : products.length} icon={<ProductIcon />} type="products" />
          <StatCard label="Total Employees" value={loading ? '...' : employees.length} icon={<EmployeeIcon />} type="employees" />
          <StatCard label="Total Revenue" value={loading ? '...' : formatCurrency(stats?.totalRevenue)} icon={<RevenueIcon />} type="revenue" />
        </div>

        {/* --- SECONDARY STATS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{marginBottom: '40px'}}>
            <MiniCard label="Today's Sales" value={loading ? '...' : stats?.todaySales} />
            <MiniCard label="Today's Revenue" value={loading ? '...' : formatCurrency(stats?.todayRevenue)} />
            <MiniCard label="Avg. Order" value={loading ? '...' : formatCurrency(stats?.averageOrderValue)} />
            <MiniCard label="Low Stock" value={loading ? '...' : lowStockProducts.length} warning />
        </div>

        {/* --- QUICK ACTIONS SECTION --- */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-50">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isMaster && <QuickActionCard href="/inventory/stores" label="Add Store" icon={<AddIcon />} />}
            <QuickActionCard href="/inventory/employees" label="Add Employee" icon={<UserAddIcon />} />
            <QuickActionCard href="/inventory/products" label="Add Product" icon={<BoxAddIcon />} />
            <QuickActionCard href="/inventory/sales" label="View Reports" icon={<ReportIcon />} />
          </div>
        </div>

        {/* --- TABLE OVERVIEWS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Stores Table Panel (master only) */}
          {isMaster && (
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700">
                <h3 className="text-base font-bold text-slate-900 dark:text-gray-50">Stores Overview</h3>
                <a href="/inventory/stores" className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide hover:underline">VIEW ALL</a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-gray-700">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Store Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Employees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {loading ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }} className="text-slate-400 dark:text-gray-500">Loading data...</td></tr>
                    ) : stores.slice(0, 5).map(store => (
                      <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-gray-50">{store.name}</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-gray-400">{store.address || 'Global Store'}</td>
                        <td className="px-5 py-3 font-semibold text-blue-600 dark:text-blue-400">{employeeCountByStore[store.id] || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Employees Table Panel */}
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-gray-50">Recent Employees</h3>
              <a href="/inventory/employees" className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide hover:underline">VIEW ALL</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Assigned Store</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}} className="text-slate-400 dark:text-gray-500">Loading data...</td></tr>
                  ) : employees.slice(0, 5).map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-gray-50">{emp.displayName}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-gray-400">{emp.assignedStoreName || 'Corporate'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
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
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 shadow-card">
            <span className="text-xs font-medium text-slate-400 dark:text-gray-500">{label}</span>
            <h3 className={`text-lg font-bold mt-0.5 ${warning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-gray-50'}`}>{value}</h3>
        </div>
    );
}

function QuickActionCard({ href, label, icon }) {
  return (
    <a href={href} className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-5 shadow-card hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-0.5 transition-all group">
      <div className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">{label}</span>
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
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-5 shadow-card flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: colors[type].bg, color: colors[type].color }}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-gray-50 leading-tight">{value}</h3>
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{label}</p>
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
