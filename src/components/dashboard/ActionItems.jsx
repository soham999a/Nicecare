import React, { useMemo } from 'react';

const SEVERITY = {
  high: {
    iconBg: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    borderLeft: 'border-l-red-500',
    actionColor: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
  },
  medium: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    borderLeft: 'border-l-amber-500',
    actionColor: 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300',
  },
  low: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    borderLeft: 'border-l-emerald-500',
    actionColor: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
  },
};

const WarningIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ICON_MAP = {
  critical: <WarningIcon />,
  warning: <ClockIcon />,
  info: <InfoIcon />,
  pickup: <CheckIcon />,
};

const ActionItems = ({ alerts = [] }) => {
  const items = useMemo(() => {
    const list = alerts.map(alert => ({
      id: alert.id,
      severity: alert.type === 'critical' ? 'high' : alert.type === 'warning' ? 'medium' : 'low',
      iconKey: alert.type,
      label: alert.title,
      detail: alert.message,
      action: alert.action,
      href: alert.href,
    }));
    return list.slice(0, 6);
  }, [alerts]);

  const criticalCount = items.filter(i => i.severity === 'high').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Action Required</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
            Items needing your attention
          </p>
        </div>
        {items.length > 0 && (
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              criticalCount > 0 ? 'bg-red-500' : 'bg-amber-500'
            }`}
          >
            {items.length}
          </span>
        )}
      </div>

      <div className="p-4 space-y-2 flex-1">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">All clear!</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">No actions required right now</p>
          </div>
        ) : (
          items.map((item) => {
            const cfg = SEVERITY[item.severity];
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${cfg.borderLeft} bg-slate-50 dark:bg-gray-700/50`}
              >
                <div
                  className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${cfg.iconBg}`}
                >
                  {ICON_MAP[item.iconKey] ?? <InfoIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {item.detail}
                  </p>
                </div>
                <a
                  href={item.href}
                  className={`flex-shrink-0 text-xs font-semibold whitespace-nowrap mt-0.5 transition-colors ${cfg.actionColor}`}
                >
                  {item.action} →
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActionItems;
