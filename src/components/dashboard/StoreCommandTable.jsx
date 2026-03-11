import React, { useEffect, useState } from 'react';

const headerClass = 'px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider';
const cellClass = 'px-3 py-3 text-sm text-slate-700 dark:text-gray-200';

const statusTone = (value, warningThreshold = 1) => {
  if (value > warningThreshold) return 'text-red-600 dark:text-red-400';
  if (value > 0) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

const getRiskBadge = (row) => {
  const riskScore = (row.staleRepairs || 0) + (row.lowStockCount || 0);
  if (riskScore >= 6) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
  if (riskScore >= 2) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
};

const StoreCommandTable = ({ rows = [], formatCurrency }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded]);

  const summaryStats = {
    stores: rows.length,
    totalRevenue: rows.reduce((sum, row) => sum + (row.revenue || 0), 0),
    highRiskStores: rows.filter((row) => ((row.staleRepairs || 0) + (row.lowStockCount || 0)) >= 6).length,
    avgMargin:
      rows.length > 0
        ? rows.reduce((sum, row) => sum + (row.marginPercent || 0), 0) / rows.length
        : 0,
  };

  const renderBody = (expanded = false) => {
    if (rows.length === 0) {
      return (
        <div className="p-8 text-sm text-center text-slate-500 dark:text-gray-400">
          No store command data available.
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="w-full min-w-[820px] [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-gray-700">
          <thead className={`bg-slate-50 dark:bg-gray-700/40 border-b border-slate-200 dark:border-gray-700 ${expanded ? 'sticky top-0 z-10 backdrop-blur-sm' : ''}`}>
            <tr>
              <th className={headerClass}>Store</th>
              <th className={headerClass}>Revenue</th>
              <th className={headerClass}>Margin</th>
              <th className={headerClass}>Queue</th>
              <th className={headerClass}>Stale</th>
              <th className={headerClass}>Low Stock</th>
              <th className={headerClass}>Manager</th>
              <th className={headerClass}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.storeId}
                className={`border-b border-slate-100 dark:border-gray-700/60 last:border-b-0 hover:bg-slate-50 dark:hover:bg-gray-700/30 ${expanded && index % 2 === 0 ? 'bg-white/60 dark:bg-gray-800/60' : ''}`}
              >
                <td className={cellClass}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-gray-700 text-[11px] font-bold text-slate-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-gray-100">{row.storeName}</p>
                  </div>
                </td>
                <td className={`${cellClass} font-semibold tabular-nums`}>
                  {formatCurrency(row.revenue)}
                </td>
                <td className={`${cellClass} tabular-nums`}>
                  <span className={row.marginPercent < 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {row.marginPercent.toFixed(1)}%
                  </span>
                </td>
                <td className={`${cellClass} tabular-nums`}>{row.repairQueue}</td>
                <td className={`${cellClass} tabular-nums ${statusTone(row.staleRepairs)}`}>{row.staleRepairs}</td>
                <td className={`${cellClass} tabular-nums ${statusTone(row.lowStockCount, 3)}`}>{row.lowStockCount}</td>
                <td className={cellClass}>{row.managerName || 'Unassigned'}</td>
                <td className={cellClass}>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getRiskBadge(row)}`}>
                    {((row.staleRepairs || 0) + (row.lowStockCount || 0)) >= 6
                      ? 'High'
                      : ((row.staleRepairs || 0) + (row.lowStockCount || 0)) >= 2
                      ? 'Medium'
                      : 'Low'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Store Command</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Revenue, margin, queue, and risk in one view
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
          >
            Expand
          </button>
        </div>
        {renderBody(false)}
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="max-w-7xl mx-auto h-full bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Store Command (Expanded)</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                    Full-screen executive comparison across all stores
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Stores</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{summaryStats.stores}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Total Revenue</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(summaryStats.totalRevenue)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Avg Margin</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{summaryStats.avgMargin.toFixed(1)}%</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">High-Risk Stores</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{summaryStats.highRiskStores}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto">{renderBody(true)}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreCommandTable;
