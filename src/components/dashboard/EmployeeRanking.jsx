import React from 'react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const PERFORMANCE_BADGES = [
  { min: 1.5, label: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { min: 1.0, label: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { min: 0.5, label: 'Average', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { min: 0, label: 'Needs Improvement', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const getPerformanceBadge = (performance) =>
  PERFORMANCE_BADGES.find(b => performance >= b.min) ?? PERFORMANCE_BADGES[PERFORMANCE_BADGES.length - 1];

const getAvatarColor = (name) => {
  const palette = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-red-500', 'bg-amber-500', 'bg-teal-500',
  ];
  return palette[name.charCodeAt(0) % palette.length];
};

const RankBadge = ({ index }) => {
  if (index === 0)
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
        1
      </div>
    );
  if (index === 1)
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
        2
      </div>
    );
  if (index === 2)
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
        3
      </div>
    );
  return (
    <div className="w-8 h-8 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-slate-500 dark:text-gray-400 font-bold text-sm">
      {index + 1}
    </div>
  );
};

const EmployeeRanking = ({ employees = [], className = '' }) => {
  const topEmployee = employees[0];

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Top Performing Technicians
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Ranked by revenue across all locations
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-gray-400">Current period</span>
        </div>
      </div>

      {/* Star of the Week callout */}
      {topEmployee && (
        <div className="mx-6 mt-5 mb-1 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-700/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Star of the Week
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${getAvatarColor(topEmployee.name)} flex items-center justify-center text-white font-bold`}
              >
                {topEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{topEmployee.name}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{topEmployee.storeName || 'Corporate'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg tabular-nums text-amber-700 dark:text-amber-400">
                {formatCurrency(topEmployee.revenue)}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {topEmployee.salesCount} repairs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings list */}
      <div className="p-6 pt-4">
        <div className="space-y-3">
          {employees.map((employee, index) => {
            const badge = getPerformanceBadge(employee.performance);

            return (
              <div
                key={employee.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  <RankBadge index={index} />
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white font-semibold`}
                  >
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {employee.name}
                    </h4>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
                    {employee.storeName || 'Corporate'} · {employee.salesCount} repairs
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(employee.revenue)}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-gray-500 tabular-nums">
                    {formatCurrency(employee.averageOrderValue)} avg
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex-shrink-0 w-14">
                  <div className="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${Math.min(employee.performance * 50, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-center text-slate-400 dark:text-gray-500 mt-1 tabular-nums">
                    {(employee.performance * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-gray-300 mb-1">
              No employee data yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Rankings appear once sales are recorded
            </p>
          </div>
        )}
      </div>

      {employees.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700">
          <a
            href="/inventory/employees"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View all employees
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default EmployeeRanking;
