import React, { useMemo } from 'react';

const RepairPipeline = ({ stores = [], queueLength = 0, staleTickets = 0, performanceData = [] }) => {
  const storeQueues = useMemo(() => {
    const byStore = new Map(
      (performanceData || []).map((entry) => [entry.storeId, entry])
    );

    return stores
      .map((store) => {
        const metrics = byStore.get(store.id);
        const criticalCount = Array.isArray(metrics?.criticalAlerts)
          ? metrics.criticalAlerts.length
          : 0;

        return {
          id: store.id,
          name: store.name,
          queue: metrics?.repairQueue ?? 0,
          criticalCount,
        };
      })
      .sort((a, b) => b.queue - a.queue);
  }, [stores, performanceData]);

  const maxQueue = Math.max(...storeQueues.map((store) => store.queue), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Repair Pipeline
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Live queue totals by location
            </p>
          </div>
          <div className="flex items-center gap-3">
            {staleTickets > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                {staleTickets} Stale
              </span>
            )}
            <span className="text-sm font-medium text-slate-500 dark:text-gray-400">
              {queueLength} active devices
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {storeQueues.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              By Location
            </p>
            <div className="space-y-3">
              {storeQueues.map(store => (
                <div
                  key={store.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-gray-700/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-gray-200 truncate">
                        {store.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        {store.criticalCount} critical inventory alerts
                      </p>
                    </div>
                    <div className="text-lg font-bold tabular-nums text-slate-700 dark:text-gray-200">
                      {store.queue}
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.round((store.queue / maxQueue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {storeQueues.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-8">
            No store performance data available yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default RepairPipeline;
