import React, { useState } from 'react';

const StoreMap = ({ stores = [], performanceData = [], className = '' }) => {
  const [selectedStore, setSelectedStore] = useState(null);

  const getStorePerformance = (storeId) => {
    return performanceData.find((entry) => entry.storeId === storeId) || {};
  };

  const getStoreAddress = (store) => {
    return store.address || store.location || store.city || 'Address not provided';
  };

  const getMarkerColor = (storeId) => {
    const performance = getStorePerformance(storeId);
    const efficiency = performance.efficiency || 0;

    if (efficiency >= 0.8) return '#10b981';
    if (efficiency >= 0.6) return '#3b82f6';
    if (efficiency >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Store Locations</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Performance by active business location
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-600 dark:text-gray-400">High Performance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Good Performance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Average Performance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Needs Attention</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {stores.map((store) => {
              const performance = getStorePerformance(store.id);
              const isSelected = selectedStore?.id === store.id;

              return (
                <div
                  key={store.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedStore(store)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {store.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
                        {getStoreAddress(store)}
                      </p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: getMarkerColor(store.id) }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">Revenue</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(performance.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">Employees</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {performance.employeeCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">Queue</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {performance.repairQueue || 0}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600">
            {selectedStore ? (
              (() => {
                const performance = getStorePerformance(selectedStore.id);
                return (
                  <>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedStore.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                      {getStoreAddress(selectedStore)}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-5">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Revenue</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {formatCurrency(performance.revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Employees</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {performance.employeeCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Efficiency</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {Math.round((performance.efficiency || 0) * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Repair Queue</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {performance.repairQueue || 0}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="h-full flex items-center justify-center text-center py-8">
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Select a location to view detailed metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
