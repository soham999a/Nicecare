import { useState, useEffect, useMemo } from 'react';
import { useStores } from './useStores';
import { useEmployees } from './useEmployees';
import { useProducts } from './useProducts';
import { useSales } from './useSales';
import { useCustomers } from './useCustomers';
import AnalyticsEngine from '../services/analyticsEngine';

const CLOSED_CUSTOMER_STATUSES = new Set(['Delivered', 'Cancelled', 'Unrepairable', 'Picked Up']);
const READY_CUSTOMER_STATUSES = new Set(['Ready for Pickup', 'Ready for Delivery']);

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis());
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const parseMoney = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTicketStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized || normalized === 'device received' || normalized === 'new') return 'admitted';
  if (normalized === 'repair in progress' || normalized === 'diagnosing') return 'in-progress';
  if (normalized === 'qc check') return 'preparing';
  if (normalized === 'ready for pickup' || normalized === 'ready for delivery') return 'ready-for-delivery';
  if (normalized === 'delivered' || normalized === 'picked up') return 'delivered';
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'unrepairable') return 'cancelled';
  return normalized;
};

const getMaxTimestamp = (records) => {
  if (!Array.isArray(records) || records.length === 0) return null;
  let maxMillis = 0;
  records.forEach((record) => {
    const date = toDate(record.updatedAt) || toDate(record.createdAt);
    if (date && date.getTime() > maxMillis) maxMillis = date.getTime();
  });
  return maxMillis || null;
};

/**
 * Enhanced Dashboard Hook
 * Provides comprehensive analytics and KPIs for enterprise dashboard
 */
export const useEnhancedDashboard = (options = {}) => {
  const { selectedStoreId = null, dateRange = null, compareMode = 'vs-yesterday' } = options;
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { stores, loading: storesLoading } = useStores();
  const { employees, loading: employeesLoading } = useEmployees();
  const { products, loading: productsLoading } = useProducts(selectedStoreId);
  const { sales, loading: salesLoading } = useSales(selectedStoreId, dateRange);
  const { customers, loading: customersLoading } = useCustomers(selectedStoreId);

  const scopedStores = useMemo(() => {
    if (!selectedStoreId) return stores;
    return stores.filter((store) => store.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  const scopedEmployees = useMemo(() => {
    if (!selectedStoreId) return employees;
    return employees.filter((employee) => employee.assignedStoreId === selectedStoreId);
  }, [employees, selectedStoreId]);

  const scopedProducts = useMemo(() => {
    if (!selectedStoreId) return products;
    return products.filter((product) => product.storeId === selectedStoreId);
  }, [products, selectedStoreId]);

  const scopedCustomers = useMemo(() => {
    if (!selectedStoreId) return customers;
    return customers.filter((customer) => customer.storeId === selectedStoreId);
  }, [customers, selectedStoreId]);

  const tickets = useMemo(
    () =>
      scopedCustomers.map((customer) => ({
        id: customer.id,
        ticketNumber: customer.ticketNumber || customer.jobNumber || customer.id,
        storeId: customer.storeId,
        status: normalizeTicketStatus(customer.status),
        createdAt:
          customer.deviceReceivedDate ||
          customer.repairStartDate ||
          customer.createdAt,
        updatedAt: customer.updatedAt || customer.createdAt,
        statusHistory: customer.statusHistory || [],
        estimatedCost: parseMoney(customer.estimatedCost),
        advancePaid: parseMoney(customer.advancePaid),
      })),
    [scopedCustomers]
  );

  const loading = storesLoading || employeesLoading || productsLoading || salesLoading || customersLoading;

  const analyticsEngine = useMemo(() => {
    if (loading) return null;
    return new AnalyticsEngine(scopedStores, scopedEmployees, scopedProducts, sales, tickets);
  }, [scopedStores, scopedEmployees, scopedProducts, sales, tickets, loading]);

  const kpis = useMemo(() => {
    if (!analyticsEngine) return null;
    return analyticsEngine.calculateKPIs();
  }, [analyticsEngine]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const chartData = useMemo(() => {
    if (!kpis) {
      return {
        revenue: [],
        performance: [],
        trends: [],
        employeePerformance: [],
        repairTypes: [],
      };
    }

    const repairTypeCounts = {};
    scopedCustomers.forEach((customer) => {
      const type = (customer.repairType || '').trim();
      if (!type) return;
      if (CLOSED_CUSTOMER_STATUSES.has(customer.status)) return;
      repairTypeCounts[type] = (repairTypeCounts[type] || 0) + 1;
    });

    const totalRepairs = Object.values(repairTypeCounts).reduce((sum, count) => sum + count, 0);
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#94a3b8'];

    const repairTypes = Object.entries(repairTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        value: totalRepairs ? Math.round((count / totalRepairs) * 100) : 0,
        count,
        color: palette[index % palette.length],
      }));

    return {
      revenue: kpis.trends.dailyTrends.slice(-30),
      performance: kpis.performance.stores,
      trends: kpis.trends.weeklyTrends,
      employeePerformance: kpis.employees.topPerformers,
      repairTypes,
    };
  }, [kpis, scopedCustomers]);

  const summary = useMemo(() => {
    if (!kpis) return null;

    const queueLength = Object.values(kpis.repairs.repairQueueByStore || {}).reduce(
      (sum, store) => sum + (store.queue || 0),
      0
    );

    const pendingPickupValue = tickets.reduce((sum, ticket) => {
      const isReady = ticket.status === 'ready-for-delivery';
      if (!isReady) return sum;
      return sum + Math.max(0, ticket.estimatedCost - ticket.advancePaid);
    }, 0);

    const cashAtRisk = tickets.reduce((sum, ticket) => {
      const isOpen = !['delivered', 'cancelled'].includes(ticket.status);
      if (!isOpen) return sum;
      return sum + Math.max(0, ticket.estimatedCost - ticket.advancePaid);
    }, 0);

    return {
      revenue: {
        today: kpis.revenue.today,
        growth: kpis.revenue.todayGrowth,
        week: kpis.revenue.week,
        month: kpis.revenue.month,
      },
      profitability: {
        grossProfit: kpis.revenue.totalGrossProfit,
        grossMarginPct: kpis.revenue.grossMarginPercent,
      },
      operations: {
        totalStores: kpis.performance.totalStores,
        activeStores: kpis.performance.activeStores,
        totalEmployees: kpis.employees.total,
        activeEmployees: kpis.employees.active,
      },
      inventory: {
        totalProducts: kpis.inventory.totalProducts,
        lowStock: kpis.inventory.lowStockCount,
        criticalStock: kpis.inventory.criticalStockCount,
        totalValue: kpis.inventory.totalInventoryValue,
      },
      repairs: {
        totalTickets: kpis.repairs.totalTickets,
        queueLength,
        staleTickets: kpis.repairs.staleTickets,
        completionRate: kpis.repairs.completionRate,
        readyForPickup: kpis.repairs.readyForPickup || 0,
      },
      cashflow: {
        pendingPickupValue,
        cashAtRisk,
      },
    };
  }, [kpis, tickets]);

  const alerts = useMemo(() => {
    if (!kpis || !summary) return [];
    const criticalAlerts = [];

    if (kpis.inventory.criticalStockCount > 0) {
      criticalAlerts.push({
        id: 'critical-stock',
        type: 'critical',
        title: 'Critical Stock Levels',
        message: `${kpis.inventory.criticalStockCount} products are critically low`,
        action: 'View Inventory',
        href: '/inventory/products',
      });
    }

    if (kpis.repairs.staleTickets > 0) {
      criticalAlerts.push({
        id: 'stale-repairs',
        type: 'warning',
        title: 'Stale Repair Tickets',
        message: `${kpis.repairs.staleTickets} tickets need attention`,
        action: 'View Tickets',
        href: '/inventory/crm',
      });
    }

    if (summary.cashflow.cashAtRisk > 1000) {
      criticalAlerts.push({
        id: 'cash-at-risk',
        type: 'warning',
        title: 'Cash Exposure',
        message: `$${summary.cashflow.cashAtRisk.toFixed(0)} is tied up in open jobs`,
        action: 'Review Jobs',
        href: '/inventory/crm',
      });
    }

    if (kpis.performance.underPerforming.length > 0) {
      criticalAlerts.push({
        id: 'underperforming-stores',
        type: 'info',
        title: 'Store Performance',
        message: `${kpis.performance.underPerforming.length} stores need attention`,
        action: 'View Stores',
        href: '/inventory/stores',
      });
    }

    return criticalAlerts;
  }, [kpis, summary]);

  const insights = useMemo(() => {
    if (!kpis) return [];
    const list = [];

    if (kpis.revenue.todayGrowth > 10) {
      list.push({
        type: 'positive',
        title: 'Strong Revenue Growth',
        description: `Today's revenue is ${kpis.revenue.todayGrowth.toFixed(1)}% higher than yesterday`,
      });
    } else if (kpis.revenue.todayGrowth < -10) {
      list.push({
        type: 'negative',
        title: 'Revenue Decline',
        description: `Today's revenue is ${Math.abs(kpis.revenue.todayGrowth).toFixed(1)}% lower than yesterday`,
      });
    }

    if (kpis.inventory.accessoryAttachRate > 50) {
      list.push({
        type: 'positive',
        title: 'High Accessory Sales',
        description: `${kpis.inventory.accessoryAttachRate.toFixed(1)}% of sales include accessories`,
      });
    }

    return list;
  }, [kpis]);

  const compareSnapshot = useMemo(() => {
    if (!summary) return null;
    if (compareMode === 'vs-last-week') {
      return {
        label: 'vs last week',
        value: summary.revenue.week,
      };
    }
    return {
      label: 'vs yesterday',
      value: summary.revenue.growth,
    };
  }, [summary, compareMode]);

  const dataHealth = useMemo(() => {
    const sourceTimestamps = {
      stores: getMaxTimestamp(stores),
      employees: getMaxTimestamp(employees),
      products: getMaxTimestamp(products),
      sales: getMaxTimestamp(sales),
      customers: getMaxTimestamp(customers),
      tickets: getMaxTimestamp(tickets),
    };

    const freshnessWarnings = [];
    if (!tickets.length) freshnessWarnings.push('No live repair tickets found');
    if (!sales.length) freshnessWarnings.push('No sales records in selected range');
    if (!stores.length) freshnessWarnings.push('No active store data');

    return {
      sourceTimestamps,
      freshnessWarnings,
      hasLiveData:
        stores.length > 0 || products.length > 0 || sales.length > 0 || customers.length > 0,
    };
  }, [stores, employees, products, sales, customers, tickets]);

  const ownerPulse = useMemo(() => {
    if (!summary) return null;
    return {
      todayRevenue: summary.revenue.today,
      grossProfit: summary.profitability.grossProfit,
      grossMarginPct: summary.profitability.grossMarginPct,
      openRepairQueue: summary.repairs.queueLength,
      criticalInventory: summary.inventory.criticalStock,
      cashAtRisk: summary.cashflow.cashAtRisk,
    };
  }, [summary]);

  return {
    stores: scopedStores,
    employees: scopedEmployees,
    products: scopedProducts,
    sales,
    customers: scopedCustomers,
    tickets,
    kpis,
    summary,
    chartData,
    alerts,
    insights,
    ownerPulse,
    compareSnapshot,
    dataHealth,
    loading,
    lastRefresh,
    refreshInterval,
    setRefreshInterval,
    controls: {
      selectedStoreId,
      dateRange,
      compareMode,
    },
    formatCurrency: (value) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0),
    formatNumber: (value) => new Intl.NumberFormat('en-US').format(value || 0),
    formatPercentage: (value) => `${(value || 0).toFixed(1)}%`,
    isClosedStatus: (status) =>
      CLOSED_CUSTOMER_STATUSES.has(status) || ['cancelled', 'delivered'].includes(normalizeTicketStatus(status)),
    isReadyStatus: (status) =>
      READY_CUSTOMER_STATUSES.has(status) || normalizeTicketStatus(status) === 'ready-for-delivery',
  };
};

export default useEnhancedDashboard;
