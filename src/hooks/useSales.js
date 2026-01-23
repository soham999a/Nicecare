import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useInventoryAuth } from '../context/InventoryAuthContext';

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
      setSales([]);
      setLoading(false);
      return;
    }

    let constraints = [];

    if (userProfile?.role === 'master') {
      constraints.push(where('ownerUid', '==', currentUser.uid));
      if (storeId) {
        constraints.push(where('storeId', '==', storeId));
      }
    } else if (userProfile?.role === 'member') {
      const memberStoreId = userProfile.assignedStoreId;
      if (!memberStoreId) {
        setSales([]);
        setLoading(false);
        return;
      }
      constraints.push(where('storeId', '==', memberStoreId));
    } else {
      setSales([]);
      setLoading(false);
      return;
    }

    // Add date range filter if provided
    if (dateRange?.start) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(dateRange.start)));
    }
    if (dateRange?.end) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(dateRange.end)));
    }

    const q = query(
      collection(db, 'sales'),
      ...constraints,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSales(salesData);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const todaySalesData = salesData.filter(sale => {
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
      (err) => {
        console.error('Error fetching sales:', err);
        setError('Failed to load sales');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile, storeId, dateRange?.start?.getTime(), dateRange?.end?.getTime()]);

  async function createSale(saleData) {
    if (!currentUser) throw new Error('Not authenticated');

    // Determine ownerUid based on role
    let ownerUid = currentUser.uid;
    if (userProfile?.role === 'member') {
      // For members, ownerUid is stored in their profile (the master who hired them)
      ownerUid = userProfile.ownerUid || userProfile.masterUid;
    }

    if (!ownerUid) {
      throw new Error('Unable to determine owner. Please contact your administrator.');
    }

    const newSale = {
      ...saleData,
      ownerUid,
      employeeId: currentUser.uid,
      employeeName: userProfile?.displayName || currentUser.email,
      status: 'completed',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'sales'), newSale);
    return docRef.id;
  }

  // Get sales report by date range
  async function getSalesReport(startDate, endDate, filterStoreId = null) {
    if (!currentUser) throw new Error('Not authenticated');

    let constraints = [];

    if (userProfile?.role === 'master') {
      constraints.push(where('ownerUid', '==', currentUser.uid));
      if (filterStoreId) {
        constraints.push(where('storeId', '==', filterStoreId));
      }
    } else if (userProfile?.role === 'member') {
      constraints.push(where('storeId', '==', userProfile.assignedStoreId));
    }

    constraints.push(where('createdAt', '>=', Timestamp.fromDate(startDate)));
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(endDate)));

    const q = query(
      collection(db, 'sales'),
      ...constraints,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const salesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate report stats
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const paymentMethodBreakdown = salesData.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + (sale.total || 0);
      return acc;
    }, {});

    // Group by day
    const dailyRevenue = salesData.reduce((acc, sale) => {
      const date = sale.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown';
      acc[date] = (acc[date] || 0) + (sale.total || 0);
      return acc;
    }, {});

    return {
      sales: salesData,
      totalSales: salesData.length,
      totalRevenue,
      averageOrderValue: salesData.length > 0 ? totalRevenue / salesData.length : 0,
      paymentMethodBreakdown,
      dailyRevenue,
    };
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
