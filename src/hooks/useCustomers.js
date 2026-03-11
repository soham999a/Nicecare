import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useInventoryAuth } from '../context/InventoryAuthContext';
import { COLLECTIONS } from '../backend/firestore/collections';
import { resolveOwnerUid, resolveScopedStoreId, isStoreScopedRole } from '../utils/inventoryScope';

/**
 * Store-scoped CRM customers. Pass storeId to filter by store (master only).
 * Members and managers always see only their assigned store.
 */
export function useCustomers(storeId = null) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingCustomer, setAddingCustomer] = useState(false);

  const { currentUser, userProfile } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser || !userProfile) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const ownerUid = resolveOwnerUid(currentUser, userProfile);
    const customersRef = collection(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS);
    const isStoreScopedUser = isStoreScopedRole(userProfile.role);

    let q;

    if (isStoreScopedUser) {
      const assignedStoreId = userProfile.assignedStoreId;
      if (!assignedStoreId || !ownerUid) {
        setCustomers([]);
        setLoading(false);
        return;
      }
      q = query(
        customersRef,
        where('ownerUid', '==', ownerUid),
        where('storeId', '==', assignedStoreId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Master: filter by storeId if provided, otherwise all stores (ownerUid only for legacy + multi-store)
      if (storeId) {
        q = query(
          customersRef,
          where('ownerUid', '==', ownerUid),
          where('storeId', '==', storeId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          customersRef,
          where('ownerUid', '==', ownerUid),
          orderBy('createdAt', 'desc')
        );
      }
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile, storeId]);

  async function addCustomer(customerData) {
    if (!currentUser || !userProfile) throw new Error('Not authenticated');

    const ownerUid = resolveOwnerUid(currentUser, userProfile);
    if (!ownerUid) throw new Error('Unable to determine owner. Please contact your administrator.');
    const resolvedStoreId = customerData.storeId ?? resolveScopedStoreId(userProfile, null);

    if (!resolvedStoreId) {
      throw new Error('Store is required to add a customer. Please select a store.');
    }

    setAddingCustomer(true);
    try {
      const { storeId: _sd, ...rest } = customerData;
      await addDoc(collection(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS), {
        ...rest,
        ownerUid,
        storeId: resolvedStoreId,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error adding customer:', err);
      throw err;
    } finally {
      setAddingCustomer(false);
    }
  }

  async function updateCustomerStatus(customerId, newStatus) {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const customerRef = doc(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS, customerId);
      await updateDoc(customerRef, { status: newStatus });
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  }

  async function updateCustomer(customerId, customerData) {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const customerRef = doc(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS, customerId);
      const { storeId: _sd, ...rest } = customerData;
      await updateDoc(customerRef, {
        ...rest,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  }

  async function deleteCustomer(customerId) {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const customerRef = doc(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS, customerId);
      await deleteDoc(customerRef);
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  }

  return {
    customers,
    loading,
    error,
    addingCustomer,
    addCustomer,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer,
  };
}
