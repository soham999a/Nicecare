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
import { db } from '../../../config/firebase';
import { COLLECTIONS } from '../collections';

/**
 * Build query constraints for sales list/report.
 * @param {Object} options - { ownerUid, storeId (optional), dateRange: { start, end } (optional) }
 */
function buildSalesConstraints({ ownerUid, storeId, dateRange }) {
  const constraints = [where('ownerUid', '==', ownerUid)];
  if (storeId) constraints.push(where('storeId', '==', storeId));
  if (dateRange?.start) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(dateRange.start)));
  }
  if (dateRange?.end) {
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(dateRange.end)));
  }
  return constraints;
}

/**
 * Subscribe to sales list. Returns unsubscribe function.
 */
export function subscribeSales({ ownerUid, storeId, dateRange, onData, onError }) {
  const constraints = buildSalesConstraints({ ownerUid, storeId, dateRange });
  const q = query(
    collection(db, COLLECTIONS.SALES_TRANSACTION_RECORDS),
    ...constraints,
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const salesData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onData(salesData);
    },
    onError
  );
}

export async function createSale(ownerUid, saleData, { employeeId, employeeName, employeeEmail }) {
  const newSale = {
    ...saleData,
    ownerUid,
    employeeId,
    employeeName: employeeName || '',
    employeeEmail: employeeEmail || '',
    status: 'completed',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SALES_TRANSACTION_RECORDS), newSale);
  return docRef.id;
}

export async function getSalesReport(startDate, endDate, { ownerUid, storeId }) {
  const constraints = buildSalesConstraints({
    ownerUid,
    storeId: storeId || null,
    dateRange: { start: startDate, end: endDate },
  });

  const q = query(
    collection(db, COLLECTIONS.SALES_TRANSACTION_RECORDS),
    ...constraints,
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const salesData = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const paymentMethodBreakdown = salesData.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'Unknown';
    acc[method] = (acc[method] || 0) + (sale.total || 0);
    return acc;
  }, {});

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
