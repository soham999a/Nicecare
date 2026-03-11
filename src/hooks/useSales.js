import { useState, useEffect } from 'react';
import { useInventoryAuth } from '../context/InventoryAuthContext';
import * as salesRepo from '../backend/firestore/repositories/salesRepository';
import { resolveOwnerUid, resolveScopedStoreId } from '../utils/inventoryScope';

export function useSales(storeId = null, dateRange = null) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todaySales: 0,
    todayRevenue: 0,
  });

  const { currentUser, userProfile } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guard clause reset
      setSales([]);
      setLoading(false);
      return;
    }

    const ownerUid = resolveOwnerUid(currentUser, userProfile);
    const effectiveStoreId = resolveScopedStoreId(userProfile, storeId);
    if (userProfile?.role === 'member' || userProfile?.role === 'manager') {
      if (!effectiveStoreId || !ownerUid) {
        setSales([]);
        setLoading(false);
        return;
      }
    }

    const unsubscribe = salesRepo.subscribeSales({
      ownerUid,
      storeId: effectiveStoreId || null,
      dateRange: dateRange || null,
      onData: (salesData) => {
        setSales(salesData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const todaySalesData = salesData.filter((sale) => {
          const saleDate = sale.createdAt?.toDate?.();
          return saleDate && saleDate >= today;
        });
        const todayRevenue = todaySalesData.reduce((sum, sale) => sum + (sale.total || 0), 0);

        setStats({
          totalSales: salesData.length,
          totalRevenue,
          averageOrderValue: salesData.length > 0 ? totalRevenue / salesData.length : 0,
          todaySales: todaySalesData.length,
          todayRevenue,
        });
        setLoading(false);
        setError(null);
      },
      onError: (err) => {
        console.error('Error fetching sales:', err);
        setError('Failed to load sales');
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, [currentUser, userProfile, storeId, dateRange]);

  async function createSale(saleData, options = {}) {
    if (!currentUser) throw new Error('Not authenticated');

    const ownerUid = resolveOwnerUid(currentUser, userProfile);
    if (!ownerUid) {
      throw new Error('Unable to determine owner. Please contact your administrator.');
    }

    const selectedEmployee = options.selectedEmployee || null;
    const employeeId = selectedEmployee?.id || currentUser.uid;
    const employeeName = selectedEmployee?.displayName || selectedEmployee?.name || selectedEmployee?.email || userProfile?.displayName || currentUser.email;
    const employeeEmail = selectedEmployee?.email || currentUser.email;

    return salesRepo.createSale(ownerUid, saleData, {
      employeeId,
      employeeName,
      employeeEmail,
    });
  }

  async function getSalesReport(startDate, endDate, filterStoreId = null) {
    if (!currentUser) throw new Error('Not authenticated');

    const ownerUid = resolveOwnerUid(currentUser, userProfile);
    const effectiveStoreId = resolveScopedStoreId(userProfile, filterStoreId);
    if (!ownerUid) throw new Error('Unable to determine owner. Please contact your administrator.');

    return salesRepo.getSalesReport(startDate, endDate, {
      ownerUid,
      storeId: effectiveStoreId || null,
    });
  }

  return {
    sales,
    loading,
    error,
    stats,
    createSale,
    getSalesReport,
  };
}
