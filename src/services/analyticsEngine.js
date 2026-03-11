/**
 * Enterprise Analytics Engine
 * Handles complex business intelligence calculations and KPI computations
 */

import { startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

const REPAIR_STATUS_ALIASES = {
  admitted: ['admitted', 'device received', 'new', 'new / intake'],
  'in-progress': ['in-progress', 'repair in progress', 'diagnosing', 'in repair', 'working-on-device'],
  preparing: ['preparing', 'qc check'],
  'ready-for-delivery': ['ready-for-delivery', 'ready for pickup', 'ready'],
  delivered: ['delivered', 'picked up', 'completed'],
  cancelled: ['cancelled', 'canceled', 'unrepairable'],
};

const STATUS_KEYS = ['admitted', 'in-progress', 'preparing', 'ready-for-delivery', 'delivered', 'cancelled'];

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis());
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const normalizeRepairStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'admitted';

  const match = Object.entries(REPAIR_STATUS_ALIASES).find(([, aliases]) =>
    aliases.includes(normalized)
  );
  return match?.[0] ?? 'in-progress';
};

const isClosedStatus = (status) => ['delivered', 'cancelled'].includes(normalizeRepairStatus(status));

const getTicketUpdatedAt = (ticket) => {
  const history = Array.isArray(ticket.statusHistory) ? ticket.statusHistory : [];
  const historyTimestamp = history[history.length - 1]?.timestamp || history[history.length - 1]?.at;
  return toDate(ticket.updatedAt) || toDate(historyTimestamp) || toDate(ticket.createdAt);
};

export class AnalyticsEngine {
  constructor(stores, employees, products, sales, serviceTickets = []) {
    this.stores = stores || [];
    this.employees = employees || [];
    this.products = products || [];
    this.sales = sales || [];
    this.serviceTickets = serviceTickets || [];
  }

  calculateKPIs() {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);
    const lastMonth = subDays(today, 30);

    return {
      revenue: this.calculateRevenueMetrics(today, yesterday, lastWeek, lastMonth),
      performance: this.calculatePerformanceMetrics(),
      inventory: this.calculateInventoryMetrics(),
      employees: this.calculateEmployeeMetrics(),
      repairs: this.calculateRepairMetrics(),
      trends: this.calculateTrendAnalysis(lastMonth, today),
    };
  }

  calculateRevenueMetrics(today, yesterday, lastWeek, lastMonth) {
    const todayRevenue = this.getRevenueForPeriod(startOfDay(today), endOfDay(today));
    const yesterdayRevenue = this.getRevenueForPeriod(startOfDay(yesterday), endOfDay(yesterday));
    const weekRevenue = this.getRevenueForPeriod(startOfDay(lastWeek), endOfDay(today));
    const monthRevenue = this.getRevenueForPeriod(startOfDay(lastMonth), endOfDay(today));
    const grossProfit = this.calculateGrossProfit();
    const grossMarginPercent = monthRevenue > 0 ? (grossProfit / monthRevenue) * 100 : 0;

    return {
      today: todayRevenue,
      yesterday: yesterdayRevenue,
      week: weekRevenue,
      month: monthRevenue,
      todayGrowth: this.calculateGrowthRate(todayRevenue, yesterdayRevenue),
      weekGrowth: this.calculateGrowthRate(
        weekRevenue,
        this.getRevenueForPeriod(subDays(lastWeek, 7), subDays(today, 7))
      ),
      averageOrderValue: this.calculateAverageOrderValue(),
      totalGrossProfit: grossProfit,
      grossMarginPercent,
    };
  }

  calculatePerformanceMetrics() {
    const staleByStore = this.getStaleTicketsByStore();

    const storePerformance = this.stores.map((store) => {
      const storeRevenue = this.getStoreRevenue(store.id);
      const storeGrossProfit = this.getStoreGrossProfit(store.id);
      const storeEmployees = this.employees.filter((emp) => emp.assignedStoreId === store.id);
      const storeProducts = this.products.filter((prod) => prod.storeId === store.id);
      const staleRepairs = staleByStore.get(store.id) || 0;

      return {
        storeId: store.id,
        storeName: store.name,
        revenue: storeRevenue,
        grossProfit: storeGrossProfit,
        marginPercent: storeRevenue > 0 ? (storeGrossProfit / storeRevenue) * 100 : 0,
        employeeCount: storeEmployees.length,
        productCount: storeProducts.length,
        efficiency: this.calculateStoreEfficiency(store.id),
        repairQueue: this.getRepairQueueLength(store.id),
        staleRepairs,
        criticalAlerts: this.getCriticalAlerts(store.id),
      };
    });

    return {
      stores: storePerformance,
      topPerforming: [...storePerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 3),
      underPerforming: storePerformance.filter((store) => store.efficiency < 0.7),
      totalStores: this.stores.length,
      activeStores: storePerformance.filter((store) => store.employeeCount > 0).length,
    };
  }

  getThresholds(product) {
    const lowThreshold = Number(product.lowStockThreshold) > 0 ? Number(product.lowStockThreshold) : 10;
    const criticalThreshold = Math.max(1, Math.floor(lowThreshold * 0.5));
    return { lowThreshold, criticalThreshold };
  }

  calculateInventoryMetrics() {
    const lowStockProducts = this.products.filter((p) => {
      const { lowThreshold, criticalThreshold } = this.getThresholds(p);
      return p.quantity <= lowThreshold && p.quantity > criticalThreshold;
    });

    const criticalStockProducts = this.products.filter((p) => {
      const { criticalThreshold } = this.getThresholds(p);
      return p.quantity <= criticalThreshold;
    });

    const totalInventoryValue = this.products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);

    return {
      totalProducts: this.products.length,
      lowStockCount: lowStockProducts.length,
      criticalStockCount: criticalStockProducts.length,
      totalInventoryValue,
      accessoryAttachRate: this.calculateAccessoryAttachRate(),
      inventoryTurnover: this.calculateInventoryTurnover(),
      stockAlerts: [...lowStockProducts, ...criticalStockProducts].map((p) => {
        const { criticalThreshold } = this.getThresholds(p);
        return {
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          storeId: p.storeId,
          severity: p.quantity <= criticalThreshold ? 'critical' : 'warning',
        };
      }),
    };
  }

  calculateEmployeeMetrics() {
    const activeEmployees = this.employees.filter((emp) => emp.isActive);
    const employeePerformance = activeEmployees.map((emp) => {
      const empSales = this.sales.filter((sale) => sale.employeeId === emp.id);
      const empRevenue = empSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

      return {
        id: emp.id,
        name: emp.displayName,
        storeId: emp.assignedStoreId,
        storeName: emp.assignedStoreName,
        salesCount: empSales.length,
        revenue: empRevenue,
        averageOrderValue: empSales.length > 0 ? empRevenue / empSales.length : 0,
        performance: this.calculateEmployeePerformanceScore(emp.id),
      };
    });

    return {
      total: this.employees.length,
      active: activeEmployees.length,
      topPerformers: [...employeePerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      averagePerformance:
        employeePerformance.reduce((sum, emp) => sum + emp.performance, 0) / employeePerformance.length || 0,
      performanceDistribution: this.calculatePerformanceDistribution(employeePerformance),
    };
  }

  calculateRepairMetrics() {
    const emptyStatusBreakdown = STATUS_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

    if (!this.serviceTickets || this.serviceTickets.length === 0) {
      return {
        totalTickets: 0,
        statusBreakdown: emptyStatusBreakdown,
        staleTickets: 0,
        averageRepairTime: 0,
        repairQueueByStore: {},
        completionRate: 0,
        readyForPickup: 0,
      };
    }

    const statusCounts = { ...emptyStatusBreakdown };
    this.serviceTickets.forEach((ticket) => {
      const status = normalizeRepairStatus(ticket.status);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const staleTickets = this.serviceTickets.filter((ticket) => {
      const lastUpdate = getTicketUpdatedAt(ticket);
      if (!lastUpdate) return false;
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate >= 24 && !isClosedStatus(ticket.status);
    });

    return {
      totalTickets: this.serviceTickets.length,
      statusBreakdown: statusCounts,
      staleTickets: staleTickets.length,
      averageRepairTime: this.calculateAverageRepairTime(),
      repairQueueByStore: this.calculateRepairQueueByStore(),
      completionRate: this.calculateRepairCompletionRate(),
      readyForPickup: statusCounts['ready-for-delivery'] || 0,
    };
  }

  calculateTrendAnalysis(startDate, endDate) {
    const days = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayRevenue = this.getRevenueForPeriod(startOfDay(currentDate), endOfDay(currentDate));
      const daySales = this.getSalesForPeriod(startOfDay(currentDate), endOfDay(currentDate));

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        revenue: dayRevenue,
        salesCount: daySales.length,
        averageOrderValue: daySales.length > 0 ? dayRevenue / daySales.length : 0,
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return {
      dailyTrends: days,
      weeklyTrends: this.aggregateWeeklyTrends(days),
      growthRate: this.calculatePeriodGrowthRate(days),
      seasonality: this.detectSeasonalPatterns(days),
    };
  }

  getRevenueForPeriod(start, end) {
    return this.sales
      .filter((sale) => {
        const saleDate = toDate(sale.createdAt);
        return saleDate && saleDate >= start && saleDate <= end;
      })
      .reduce((sum, sale) => sum + (sale.total || 0), 0);
  }

  getSalesForPeriod(start, end) {
    return this.sales.filter((sale) => {
      const saleDate = toDate(sale.createdAt);
      return saleDate && saleDate >= start && saleDate <= end;
    });
  }

  getStoreRevenue(storeId) {
    return this.sales
      .filter((sale) => sale.storeId === storeId)
      .reduce((sum, sale) => sum + (sale.total || 0), 0);
  }

  getStoreGrossProfit(storeId) {
    return this.sales
      .filter((sale) => sale.storeId === storeId)
      .reduce((sum, sale) => {
        const cost =
          sale.items?.reduce((itemSum, item) => {
            const product = this.products.find((p) => p.id === item.productId);
            return itemSum + ((product?.cost || 0) * item.quantity);
          }, 0) || 0;
        return sum + ((sale.total || 0) - cost);
      }, 0);
  }

  calculateGrowthRate(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  calculateAverageOrderValue() {
    if (this.sales.length === 0) return 0;
    const totalRevenue = this.sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    return totalRevenue / this.sales.length;
  }

  calculateGrossProfit() {
    return this.sales.reduce((sum, sale) => {
      const cost =
        sale.items?.reduce((itemSum, item) => {
          const product = this.products.find((p) => p.id === item.productId);
          return itemSum + ((product?.cost || 0) * item.quantity);
        }, 0) || 0;
      return sum + ((sale.total || 0) - cost);
    }, 0);
  }

  calculateStoreEfficiency(storeId) {
    const storeEmployees = this.employees.filter((emp) => emp.assignedStoreId === storeId && emp.isActive);
    const storeRevenue = this.getStoreRevenue(storeId);
    if (storeEmployees.length === 0) return 0;
    return Math.min(storeRevenue / (storeEmployees.length * 10000), 1);
  }

  calculateAccessoryAttachRate() {
    const salesWithAccessories = this.sales.filter((sale) =>
      sale.items?.some((item) => {
        const product = this.products.find((p) => p.id === item.productId);
        return product?.category?.toLowerCase().includes('accessory');
      })
    );
    return this.sales.length > 0 ? (salesWithAccessories.length / this.sales.length) * 100 : 0;
  }

  calculateInventoryTurnover() {
    const totalCost = this.products.reduce((sum, p) => sum + ((p.cost || 0) * (p.quantity || 0)), 0);
    const costOfGoodsSold = this.sales.reduce((sum, sale) => {
      const cost =
        sale.items?.reduce((itemSum, item) => {
          const product = this.products.find((p) => p.id === item.productId);
          return itemSum + ((product?.cost || 0) * item.quantity);
        }, 0) || 0;
      return sum + cost;
    }, 0);
    return totalCost > 0 ? costOfGoodsSold / totalCost : 0;
  }

  calculateEmployeePerformanceScore(employeeId) {
    const empSales = this.sales.filter((sale) => sale.employeeId === employeeId);
    const empRevenue = empSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const avgRevenue =
      this.sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / Math.max(this.employees.length, 1);
    return avgRevenue > 0 ? Math.min(empRevenue / avgRevenue, 2) : 0;
  }

  calculatePerformanceDistribution(employeePerformance) {
    const ranges = { excellent: 0, good: 0, average: 0, poor: 0 };
    employeePerformance.forEach((emp) => {
      if (emp.performance >= 1.5) ranges.excellent += 1;
      else if (emp.performance >= 1.0) ranges.good += 1;
      else if (emp.performance >= 0.5) ranges.average += 1;
      else ranges.poor += 1;
    });
    return ranges;
  }

  getRepairQueueLength(storeId) {
    if (!this.serviceTickets || this.serviceTickets.length === 0) return 0;
    return this.serviceTickets.filter(
      (ticket) => ticket.storeId === storeId && !isClosedStatus(ticket.status)
    ).length;
  }

  getStaleTicketsByStore() {
    const staleByStore = new Map();

    if (!this.serviceTickets || this.serviceTickets.length === 0) return staleByStore;

    this.serviceTickets.forEach((ticket) => {
      const updatedAt = getTicketUpdatedAt(ticket);
      if (!updatedAt || isClosedStatus(ticket.status)) return;
      const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) return;
      staleByStore.set(ticket.storeId, (staleByStore.get(ticket.storeId) || 0) + 1);
    });

    return staleByStore;
  }

  getCriticalAlerts(storeId) {
    const alerts = [];

    const lowStock = this.products.filter((p) => {
      if (p.storeId !== storeId) return false;
      const { criticalThreshold } = this.getThresholds(p);
      return p.quantity <= criticalThreshold;
    });
    alerts.push(...lowStock.map((p) => ({ type: 'low-stock', product: p.name, severity: 'high' })));

    if (this.serviceTickets && this.serviceTickets.length > 0) {
      const staleRepairs = this.serviceTickets.filter((ticket) => {
        const updatedAt = getTicketUpdatedAt(ticket);
        if (!updatedAt || isClosedStatus(ticket.status)) return false;
        const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
        return ticket.storeId === storeId && hoursSinceUpdate >= 24;
      });
      alerts.push(
        ...staleRepairs.map((t) => ({
          type: 'stale-repair',
          ticket: t.ticketNumber || t.id,
          severity: 'medium',
        }))
      );
    }

    return alerts;
  }

  calculateAverageRepairTime() {
    if (!this.serviceTickets || this.serviceTickets.length === 0) return 0;

    const completedTickets = this.serviceTickets.filter(
      (ticket) => normalizeRepairStatus(ticket.status) === 'delivered'
    );
    if (completedTickets.length === 0) return 0;

    const totalTime = completedTickets.reduce((sum, ticket) => {
      const created = toDate(ticket.createdAt)?.getTime() || Date.now();
      const history = Array.isArray(ticket.statusHistory) ? ticket.statusHistory : [];
      const deliveredEntry = history.find(
        (h) => normalizeRepairStatus(h.status) === 'delivered'
      );
      const completed = toDate(deliveredEntry?.timestamp || deliveredEntry?.at)?.getTime() || created;
      return sum + (completed - created);
    }, 0);

    return totalTime / completedTickets.length / (1000 * 60 * 60);
  }

  calculateRepairQueueByStore() {
    const staleByStore = this.getStaleTicketsByStore();
    const queueByStore = {};

    this.stores.forEach((store) => {
      queueByStore[store.id] = {
        storeName: store.name,
        queue: this.getRepairQueueLength(store.id),
        staleCount: staleByStore.get(store.id) || 0,
      };
    });

    return queueByStore;
  }

  calculateRepairCompletionRate() {
    if (!this.serviceTickets || this.serviceTickets.length === 0) return 0;
    const totalTickets = this.serviceTickets.length;
    const completedTickets = this.serviceTickets.filter(
      (ticket) => normalizeRepairStatus(ticket.status) === 'delivered'
    ).length;
    return totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;
  }

  aggregateWeeklyTrends(dailyData) {
    const weeks = {};

    dailyData.forEach((day) => {
      const dayDate = parseISO(day.date);
      const weekStart = format(startOfDay(subDays(dayDate, dayDate.getDay())), 'yyyy-MM-dd');

      if (!weeks[weekStart]) {
        weeks[weekStart] = { revenue: 0, salesCount: 0, days: 0 };
      }

      weeks[weekStart].revenue += day.revenue;
      weeks[weekStart].salesCount += day.salesCount;
      weeks[weekStart].days += 1;
    });

    return Object.entries(weeks).map(([week, data]) => ({
      week,
      revenue: data.revenue,
      salesCount: data.salesCount,
      averageOrderValue: data.salesCount > 0 ? data.revenue / data.salesCount : 0,
    }));
  }

  calculatePeriodGrowthRate(dailyData) {
    if (dailyData.length < 2) return 0;
    const firstWeek = dailyData.slice(0, 7).reduce((sum, day) => sum + day.revenue, 0);
    const lastWeek = dailyData.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    return this.calculateGrowthRate(lastWeek, firstWeek);
  }

  detectSeasonalPatterns(dailyData) {
    const dayOfWeekRevenue = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    dailyData.forEach((day) => {
      const dayOfWeek = parseISO(day.date).getDay();
      dayOfWeekRevenue[dayOfWeek] += day.revenue;
      dayOfWeekCounts[dayOfWeek] += 1;
    });

    const averages = {};
    Object.keys(dayOfWeekRevenue).forEach((day) => {
      averages[day] = dayOfWeekCounts[day] > 0 ? dayOfWeekRevenue[day] / dayOfWeekCounts[day] : 0;
    });

    return averages;
  }
}

export default AnalyticsEngine;
