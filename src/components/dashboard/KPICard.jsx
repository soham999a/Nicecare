import React, { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// ---------- Mini sparkline ----------
const MiniSparkline = ({ data, color, uid }) => {
  const gradId = `spark-${uid}`;
  if (!data || data.length < 2) return null;

  const chartData = data.map((item, i) => ({
    i,
    v: typeof item === 'object' ? (item.revenue ?? item.v ?? 0) : item,
  }));

  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ---------- Color tokens ----------
const COLOR_CLASSES = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    sparkColor: '#3b82f6',
    trend: {
      up: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      down: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      neutral: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-700',
    },
  },
  green: {
    bg: 'from-green-500 to-green-600',
    icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    sparkColor: '#10b981',
    trend: {
      up: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      down: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      neutral: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-700',
    },
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    sparkColor: '#8b5cf6',
    trend: {
      up: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      down: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      neutral: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-700',
    },
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    sparkColor: '#f97316',
    trend: {
      up: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      down: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      neutral: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-700',
    },
  },
  red: {
    bg: 'from-red-500 to-red-600',
    icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    sparkColor: '#ef4444',
    trend: {
      up: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      down: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      neutral: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-700',
    },
  },
};

const TrendArrow = ({ direction }) => {
  if (direction === 'up')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  if (direction === 'down')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

// ---------- Base KPI Card ----------
const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = 'blue',
  size = 'default',
  sparklineData,
  className = '',
  onClick,
}) => {
  const uid = useId().replace(/:/g, '');
  const colors = COLOR_CLASSES[color];

  const sizeClass = size === 'small' ? 'p-4' : size === 'large' ? 'p-8' : 'p-6';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Gradient accent circle */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.bg} opacity-5 rounded-full transform translate-x-16 -translate-y-16`}
      />

      <div className={sizeClass}>
        <div className="flex items-start justify-between mb-3">
          {icon && (
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
              {icon}
            </div>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.trend[trend]}`}>
              <TrendArrow direction={trend} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <div className="mb-1">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </h3>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white leading-tight">
            {value}
          </p>
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Sparkline strip */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="px-2 pb-2 -mt-2">
          <MiniSparkline data={sparklineData} color={colors.sparkColor} uid={uid} />
        </div>
      )}
    </div>
  );
};

// ---------- Specialized cards ----------

export const RevenueKPICard = ({ todayRevenue, growth, sparklineData, className }) => (
  <KPICard
    title="Today's Revenue"
    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(todayRevenue)}
    trend={growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'}
    trendValue={`${Math.abs(growth).toFixed(1)}%`}
    color="green"
    sparklineData={sparklineData}
    icon={
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    }
    className={className}
  />
);

export const RepairsKPICard = ({ repairsCount, completionRate, sparklineData, className }) => (
  <KPICard
    title="Repairs Completed"
    value={repairsCount.toLocaleString()}
    subtitle={completionRate > 0 ? `${completionRate.toFixed(0)}% completion rate` : 'All time total'}
    trend={completionRate >= 80 ? 'up' : completionRate >= 50 ? 'neutral' : 'down'}
    trendValue={completionRate > 0 ? `${completionRate.toFixed(0)}%` : '—'}
    color="blue"
    sparklineData={sparklineData}
    icon={
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    }
    className={className}
  />
);

// Keep the old SalesKPICard as an alias so existing usages don't break
export const SalesKPICard = ({ salesCount, growth, sparklineData, className }) => (
  <KPICard
    title="Total Sales"
    value={salesCount.toLocaleString()}
    subtitle="Transactions completed"
    trend={growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'}
    trendValue={`${Math.abs(growth).toFixed(1)}%`}
    color="blue"
    sparklineData={sparklineData}
    icon={
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    }
    className={className}
  />
);

export const InventoryKPICard = ({ criticalCount, lowStockCount, className }) => (
  <KPICard
    title="Parts Alerts"
    value={criticalCount + lowStockCount}
    subtitle={`${criticalCount} critical · ${lowStockCount} low stock`}
    trend={criticalCount > 0 ? 'down' : 'neutral'}
    trendValue={criticalCount > 0 ? 'Action needed' : 'Stock OK'}
    color={criticalCount > 0 ? 'red' : 'green'}
    icon={
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    }
    className={className}
  />
);

export const RepairKPICard = ({ queueLength, staleCount, sparklineData, className }) => (
  <KPICard
    title="Queue Depth"
    value={queueLength}
    subtitle={staleCount > 0 ? `${staleCount} stale tickets` : 'All tickets current'}
    trend={staleCount > 0 ? 'down' : 'neutral'}
    trendValue={staleCount > 0 ? 'Attention needed' : 'On track'}
    color={staleCount > 0 ? 'orange' : 'blue'}
    sparklineData={sparklineData}
    icon={
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    }
    className={className}
  />
);

export default KPICard;
