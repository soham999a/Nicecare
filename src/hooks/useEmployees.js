import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useInventoryAuth } from '../context/InventoryAuthContext';

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const { currentUser, userProfile, createEmployee: createEmployeeInvitation } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'master') {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'employees'),
      where('ownerUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const employeeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeeData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  async function createEmployee(employeeData) {
    if (!currentUser || userProfile?.role !== 'master') {
      throw new Error('Only master accounts can create employees');
    }

    setCreating(true);
    
    try {
      // Use the invitation-based system from InventoryAuthContext
      const result = await createEmployeeInvitation(employeeData);
      
      return {
        name: employeeData.name,
        email: employeeData.email,
        inviteCode: result.inviteCode,
        invitationId: result.invitationId,
        storeName: employeeData.storeName,
      };
    } finally {
      setCreating(false);
    }
  }

  async function updateEmployee(employeeId, updates) {
    if (!currentUser) throw new Error('Not authenticated');

    const employeeRef = doc(db, 'employees', employeeId);
    
    // If store assignment changed, update store counts
    if (updates.assignedStoreId !== undefined) {
      const employeeDoc = await getDoc(employeeRef);
      if (employeeDoc.exists()) {
        const oldStoreId = employeeDoc.data().assignedStoreId;
        const newStoreId = updates.assignedStoreId;

        // Decrement old store count
        if (oldStoreId) {
          const oldStoreRef = doc(db, 'stores', oldStoreId);
          const oldStoreDoc = await getDoc(oldStoreRef);
          if (oldStoreDoc.exists()) {
            const currentCount = oldStoreDoc.data().employeeCount || 0;
            await updateDoc(oldStoreRef, {
              employeeCount: Math.max(0, currentCount - 1),
              updatedAt: serverTimestamp(),
            });
          }
        }

        // Increment new store count
        if (newStoreId) {
          const newStoreRef = doc(db, 'stores', newStoreId);
          const newStoreDoc = await getDoc(newStoreRef);
          if (newStoreDoc.exists()) {
            const currentCount = newStoreDoc.data().employeeCount || 0;
            await updateDoc(newStoreRef, {
              employeeCount: currentCount + 1,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    }

    await updateDoc(employeeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Also update inventoryUsers if the employee has a uid
    const employeeDoc = await getDoc(employeeRef);
    if (employeeDoc.exists() && employeeDoc.data().uid) {
      const userRef = doc(db, 'inventoryUsers', employeeDoc.data().uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    }
  }

  async function toggleEmployeeActive(employeeId, isActive) {
    await updateEmployee(employeeId, { isActive });
  }

  async function deleteEmployee(employeeId) {
    if (!currentUser) throw new Error('Not authenticated');

    const employeeRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(employeeRef);
    
    if (employeeDoc.exists()) {
      // Update store employee count
      const storeId = employeeDoc.data().assignedStoreId;
      if (storeId) {
        const storeRef = doc(db, 'stores', storeId);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          const currentCount = storeDoc.data().employeeCount || 0;
          await updateDoc(storeRef, {
            employeeCount: Math.max(0, currentCount - 1),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await deleteDoc(employeeRef);
  }

  return {
    employees,
    loading,
    error,
    creating,
    createEmployee,
    updateEmployee,
    toggleEmployeeActive,
    deleteEmployee,
  };
}
