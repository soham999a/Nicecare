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

    const ownerUid = userProfile.role === 'master'
      ? currentUser.uid
      : (userProfile.ownerUid || userProfile.masterUid || currentUser.uid);
    const customersRef = collection(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS);
    const isStoreScopedUser = userProfile.role === 'member' || userProfile.role === 'manager';

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

    // #region agent log
    fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H2',location:'src/hooks/useCustomers.js',message:'Customers query resolved',data:{role:userProfile?.role||null,isStoreScopedUser,hasOwnerUid:!!ownerUid,assignedStoreId:userProfile?.assignedStoreId||null,requestedStoreId:storeId||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H4',location:'src/hooks/useCustomers.js',message:'Customers query failed',data:{role:userProfile?.role||null,errorCode:err?.code||null,errorMessage:err?.message||String(err)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile, storeId]);

  async function addCustomer(customerData) {
    if (!currentUser || !userProfile) throw new Error('Not authenticated');

    const ownerUid = userProfile.role === 'master'
      ? currentUser.uid
      : (userProfile.ownerUid || userProfile.masterUid || currentUser.uid);
    const resolvedStoreId = customerData.storeId ?? (
      userProfile.role === 'member' || userProfile.role === 'manager'
        ? userProfile.assignedStoreId
        : null
    );

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
