import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
        {label}
      </p>
      <div className="space-y-1">
        <p className="text-sm text-slate-600 dark:text-gray-400">
          Revenue: <span className="font-semibold text-slate-900 dark:text-white">
            {formatCurrency(entry.revenue)}
          </span>
        </p>
        <p className="text-sm text-slate-600 dark:text-gray-400">
          Employees: <span className="font-semibold text-slate-900 dark:text-white">
            {entry.employeeCount}
          </span>
        </p>
        <p className="text-sm text-slate-600 dark:text-gray-400">
          Efficiency: <span className="font-semibold text-slate-900 dark:text-white">
            {Math.round(entry.efficiency * 100)}%
          </span>
        </p>
        {entry.repairQueue > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Repair Queue: <span className="font-semibold">
              {entry.repairQueue}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

const PerformanceChart = ({ data, className = '' }) => {
  const chartData = Array.isArray(data) ? data : [];

  // Color coding based on performance
  const getBarColor = (value, maxValue) => {
    if (maxValue <= 0) return '#3b82f6';
    const ratio = value / maxValue;
    if (ratio >= 0.8) return '#10b981'; // Green - Excellent
    if (ratio >= 0.6) return '#3b82f6'; // Blue - Good
    if (ratio >= 0.4) return '#f59e0b'; // Yellow - Average
    return '#ef4444'; // Red - Poor
  };

  const maxRevenue = Math.max(...chartData.map(item => item.revenue), 0);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Store Performance</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Revenue comparison across locations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Excellent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Average</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600 dark:text-gray-400">Poor</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="storeName"
                stroke="#64748b"
                className="dark:stroke-gray-400"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="#64748b"
                className="dark:stroke-gray-400"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.revenue, maxRevenue)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex items-center justify-center text-center">
            <p className="text-sm text-slate-500 dark:text-gray-400">
              No store revenue data available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;