import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useStores } from '../../hooks/useStores';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

import RevenueChart from '../../components/dashboard/charts/RevenueChart';
import PerformanceChart from '../../components/dashboard/charts/PerformanceChart';
import RepairTypeChart from '../../components/dashboard/charts/RepairTypeChart';
import StoreMap from '../../components/dashboard/StoreMap';
import EmployeeRanking from '../../components/dashboard/EmployeeRanking';
import RepairPipeline from '../../components/dashboard/RepairPipeline';
import ActionItems from '../../components/dashboard/ActionItems';
import StoreCommandTable from '../../components/dashboard/StoreCommandTable';
import { reconcileInventoryConsistency } from '../../services/inventoryConsistencyService';
import {
  RevenueKPICard,
  RepairsKPICard,
  InventoryKPICard,
  RepairKPICard,
} from '../../components/dashboard/KPICard';

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7d' },
  { id: '30d', label: 'Last 30d' },
  { id: 'month', label: 'This Month' },
];

const resolveDateRange = (preset) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (preset === 'today') {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (preset === '7d') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (preset === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  start.setDate(now.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
    <div className="h-52 bg-gradient-to-r from-[#0f1f3d] to-[#1a56db] animate-pulse" />
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 animate-pulse" />
        ))}
      </div>
      <div className="h-[540px] rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 animate-pulse" />
    </div>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">
    {children}
  </p>
);

const DataFreshness = ({ dataHealth }) => {
  const latest = Math.max(
    ...Object.values(dataHealth?.sourceTimestamps || {}).map((v) => v || 0),
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-white">Data Trust</p>
        <span className="text-xs text-slate-500 dark:text-gray-400">
          {latest ? `Latest update ${new Date(latest).toLocaleTimeString()}` : 'No updates yet'}
        </span>
      </div>
      {dataHealth?.freshnessWarnings?.length ? (
        <div className="space-y-2">
          {dataHealth.freshnessWarnings.map((warning) => (
            <p key={warning} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
              {warning}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
          All dashboard sources are streaming live.
        </p>
      )}
    </div>
  );
};

const DataConsistency = ({
  consistencyHealth,
  canReconcile,
  loading,
  statusMessage,
  errorMessage,
  runDetails,
  onDryRun,
  onApply,
}) => {
  const checks = consistencyHealth?.checks || {};
  const hasIssues = (consistencyHealth?.totalMismatches || 0) > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-white">Data Consistency</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            hasIssues
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}
        >
          {hasIssues ? `${consistencyHealth.totalMismatches} mismatches` : 'Healthy'}
        </span>
      </div>
      <div className="space-y-1.5 text-xs">
        <p className="text-slate-600 dark:text-gray-300">
          Manager mismatch: <strong>{checks.managerMismatches || 0}</strong>
        </p>
        <p className="text-slate-600 dark:text-gray-300">
          Employee count mismatch: <strong>{checks.employeeCountMismatches || 0}</strong>
        </p>
        <p className="text-slate-600 dark:text-gray-300">
          Product count mismatch: <strong>{checks.productCountMismatches || 0}</strong>
        </p>
        <p className="text-slate-600 dark:text-gray-300">
          Employee store-name drift: <strong>{checks.employeeStoreNameMismatches || 0}</strong>
        </p>
        <p className="text-slate-600 dark:text-gray-300">
          Product store-name drift: <strong>{checks.productStoreNameMismatches || 0}</strong>
        </p>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={onDryRun}
          disabled={loading || !canReconcile}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running...' : 'Dry Run'}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={loading || !canReconcile}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Fix
        </button>
      </div>
      {!canReconcile && (
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
          Reconciliation actions are available to master accounts only.
        </p>
      )}
      {statusMessage && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded mt-2">
          {statusMessage}
        </p>
      )}
      {errorMessage && (
        <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded mt-2">
          {errorMessage}
        </p>
      )}
      {runDetails && (
        <div className="mt-3 border-t border-slate-200 dark:border-gray-700 pt-2 space-y-2">
          {['stores', 'employees', 'products', 'inventoryUsers'].map((section) => {
            const rows = runDetails?.[section] || [];
            if (!rows.length) return null;
            return (
              <div key={section}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  {section} ({rows.length}{runDetails?.truncated?.[section] ? '+' : ''})
                </p>
                <div className="max-h-28 overflow-auto mt-1 space-y-1">
                  {rows.map((row) => (
                    <p key={`${section}-${row.id}`} className="text-[11px] text-slate-600 dark:text-gray-300">
                      <span className="font-mono">{row.id}</span>: {row.fields?.join(', ') || 'updated'}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function MasterDashboard() {
  const { userProfile } = useInventoryAuth();
  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';

  if (!isMaster && !isManager) return <Navigate to="/inventory/pos" replace />;
  return <EnterpriseDashboard userProfile={userProfile} isMaster={isMaster} />;
}

function EnterpriseDashboard({ userProfile, isMaster }) {
  const [datePreset, setDatePreset] = useState('30d');
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [compareMode, setCompareMode] = useState('vs-yesterday');
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileStatus, setReconcileStatus] = useState('');
  const [reconcileError, setReconcileError] = useState('');
  const [reconcileRunDetails, setReconcileRunDetails] = useState(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const { stores: allStores } = useStores();

  const dateRange = useMemo(() => resolveDateRange(datePreset), [datePreset]);
  const effectiveStoreId = selectedStoreId === 'all' ? null : selectedStoreId;

  const {
    stores,
    employees,
    summary,
    ownerPulse,
    chartData,
    alerts,
    kpis,
    loading,
    lastRefresh,
    formatCurrency,
    dataHealth,
    consistencyHealth,
    compareSnapshot,
  } = useEnhancedDashboard({
    selectedStoreId: effectiveStoreId,
    dateRange,
    compareMode,
  });

  const storeCommandRows = useMemo(() => {
    const inventoryByStore = (kpis?.inventory?.stockAlerts || []).reduce((acc, item) => {
      acc[item.storeId] = (acc[item.storeId] || 0) + 1;
      return acc;
    }, {});

    const managerByStore = employees.reduce((acc, employee) => {
      if (employee.role === 'manager' && employee.assignedStoreId) {
        acc[employee.assignedStoreId] = employee.displayName || employee.name || 'Manager';
      }
      return acc;
    }, {});

    return (chartData.performance || [])
      .map((store) => ({
        ...store,
        lowStockCount: inventoryByStore[store.storeId] || 0,
        managerName: managerByStore[store.storeId] || '',
      }))
      .sort((a, b) => {
        const riskScoreA = a.staleRepairs + a.lowStockCount;
        const riskScoreB = b.staleRepairs + b.lowStockCount;
        if (riskScoreB !== riskScoreA) return riskScoreB - riskScoreA;
        return b.revenue - a.revenue;
      });
  }, [chartData.performance, employees, kpis]);

  const revenueSparkline = useMemo(() => chartData.revenue?.slice(-7) ?? [], [chartData.revenue]);

  async function runReconciliation(apply) {
    if (!isMaster) return;
    setReconcileLoading(true);
    setReconcileStatus('');
    setReconcileError('');
    setReconcileRunDetails(null);
    try {
      const result = await reconcileInventoryConsistency({ apply });
      const total = result?.summary?.totalChangesDetected || 0;
      setReconcileRunDetails(result?.details || null);
      setReconcileStatus(
        apply
          ? `Applied ${total} change(s) across consistency checks.`
          : `Dry run complete: ${total} change(s) detected.`
      );
    } catch (err) {
      setReconcileError(err?.message || 'Failed to run reconciliation');
    } finally {
      setReconcileLoading(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      <div className="bg-gradient-to-br from-[#0f1f3d] via-[#0d2d6b] to-[#1a56db]">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-[1500px] mx-auto">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
              <div className="text-white">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-2">
                  Owner Dashboard Cockpit
                </p>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {greeting}, {userProfile?.displayName?.split(' ')[0] || 'Owner'}
                </h1>
                <p className="text-sm text-blue-200 mt-2">
                  Balanced view of profitability, operations, inventory, and team execution.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20"
                >
                  <option value="all" className="text-slate-800">All Stores</option>
                  {allStores.map((store) => (
                    <option key={store.id} value={store.id} className="text-slate-800">
                      {store.name}
                    </option>
                  ))}
                </select>

                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20"
                >
                  {DATE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id} className="text-slate-800">
                      {preset.label}
                    </option>
                  ))}
                </select>

                <select
                  value={compareMode}
                  onChange={(e) => setCompareMode(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20"
                >
                  <option value="vs-yesterday" className="text-slate-800">Compare: Yesterday</option>
                  <option value="vs-last-week" className="text-slate-800">Compare: Last Week</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-white mt-6">
              {[
                {
                  label: "Today's Revenue",
                  value: formatCurrency(ownerPulse?.todayRevenue || 0),
                  sub: `${(summary?.revenue?.growth || 0).toFixed(1)}% vs yesterday`,
                },
                {
                  label: 'Gross Profit',
                  value: formatCurrency(ownerPulse?.grossProfit || 0),
                  sub: `${(ownerPulse?.grossMarginPct || 0).toFixed(1)}% margin`,
                },
                {
                  label: 'Open Queue',
                  value: ownerPulse?.openRepairQueue || 0,
                  sub: `${summary?.repairs?.staleTickets || 0} stale`,
                },
                {
                  label: 'Critical Inventory',
                  value: ownerPulse?.criticalInventory || 0,
                  sub: `${summary?.inventory?.lowStock || 0} low stock`,
                },
                {
                  label: 'Cash At Risk',
                  value: formatCurrency(ownerPulse?.cashAtRisk || 0),
                  sub: `${formatCurrency(summary?.cashflow?.pendingPickupValue || 0)} pending pickup`,
                },
                {
                  label: 'Compare Snapshot',
                  value: compareSnapshot?.label || '--',
                  sub: compareMode === 'vs-last-week'
                    ? formatCurrency(compareSnapshot?.value || 0)
                    : `${(compareSnapshot?.value || 0).toFixed(1)}%`,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3"
                >
                  <p className="text-lg font-bold tabular-nums">{card.value}</p>
                  <p className="text-xs text-blue-100 mt-0.5 font-medium">{card.label}</p>
                  <p className="text-xs text-blue-200 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <SectionLabel>Intervention Queue</SectionLabel>
            <ActionItems alerts={alerts} />
            <DataFreshness dataHealth={dataHealth} />
            <DataConsistency
              consistencyHealth={consistencyHealth}
              canReconcile={isMaster}
              loading={reconcileLoading}
              statusMessage={reconcileStatus}
              errorMessage={reconcileError}
              runDetails={reconcileRunDetails}
              onDryRun={() => runReconciliation(false)}
              onApply={() => setShowApplyConfirm(true)}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <SectionLabel>Business Health</SectionLabel>
            <RevenueChart data={chartData.revenue} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <RevenueKPICard
                todayRevenue={summary?.revenue?.today || 0}
                growth={summary?.revenue?.growth || 0}
                sparklineData={revenueSparkline}
              />
              <RepairsKPICard
                repairsCount={summary?.repairs?.totalTickets || 0}
                completionRate={summary?.repairs?.completionRate || 0}
                sparklineData={revenueSparkline}
              />
              <InventoryKPICard
                criticalCount={summary?.inventory?.criticalStock || 0}
                lowStockCount={summary?.inventory?.lowStock || 0}
              />
              <RepairKPICard
                queueLength={summary?.repairs?.queueLength || 0}
                staleCount={summary?.repairs?.staleTickets || 0}
                sparklineData={revenueSparkline}
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <SectionLabel>Store Command</SectionLabel>
            <StoreCommandTable rows={storeCommandRows} formatCurrency={formatCurrency} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4">
            <PerformanceChart data={chartData.performance} />
          </div>
          <div className="xl:col-span-4">
            <RepairPipeline
              stores={stores}
              queueLength={summary?.repairs?.queueLength || 0}
              staleTickets={summary?.repairs?.staleTickets || 0}
              performanceData={chartData.performance ?? []}
            />
          </div>
          <div className="xl:col-span-4">
            <RepairTypeChart data={chartData.repairTypes ?? []} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7">
            <EmployeeRanking employees={chartData.employeePerformance ?? []} />
          </div>
          <div className="xl:col-span-5">
            <StoreMap stores={stores} performanceData={chartData.performance ?? []} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-[1500px] mx-auto text-xs text-slate-500 dark:text-gray-400">
          Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'waiting for first interval'}.
          {isMaster ? ' Master scope view enabled.' : ' Store-scoped manager view enabled.'}
        </div>
      </div>

      {showApplyConfirm && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Apply consistency fixes?
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">
              This will write updates to stores, employees, products, and inventory user profiles
              for detected mismatches. Run Dry Run first if you want to preview changes.
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowApplyConfirm(false)}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
                disabled={reconcileLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowApplyConfirm(false);
                  await runReconciliation(true);
                }}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={reconcileLoading}
              >
                Confirm Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
