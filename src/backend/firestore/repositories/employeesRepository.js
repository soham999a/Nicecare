import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS } from '../collections';

/**
 * Subscribe to employees.
 * 
 * Backwards-compatible signature:
 * - subscribeEmployees(ownerUid, onData, onError)
 * - subscribeEmployees({ ownerUid, storeId, onData, onError })
 */
export function subscribeEmployees(ownerUidOrOptions, onData, onError) {
  let ownerUid;
  let storeId = null;
  let handleData = onData;
  let handleError = onError;

  if (typeof ownerUidOrOptions === 'object' && ownerUidOrOptions !== null) {
    ownerUid = ownerUidOrOptions.ownerUid;
    storeId = ownerUidOrOptions.storeId || null;
    handleData = ownerUidOrOptions.onData;
    handleError = ownerUidOrOptions.onError;
  } else {
    ownerUid = ownerUidOrOptions;
  }

  const constraints = [
    where('ownerUid', '==', ownerUid),
  ];

  if (storeId) {
    constraints.push(where('assignedStoreId', '==', storeId));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(
    collection(db, COLLECTIONS.STORE_STAFF_ASSIGNMENTS),
    ...constraints
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const employeeData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      handleData(employeeData);
    },
    handleError
  );
}

export async function updateEmployee(employeeId, updates, { syncInventoryUsers = false, inventoryUserUid = null } = {}) {
  const employeeRef = doc(db, COLLECTIONS.STORE_STAFF_ASSIGNMENTS, employeeId);

  if (updates.assignedStoreId !== undefined) {
    const employeeDoc = await getDoc(employeeRef);
    if (employeeDoc.exists()) {
      const oldStoreId = employeeDoc.data().assignedStoreId;
      const newStoreId = updates.assignedStoreId;

      if (oldStoreId) {
        const oldStoreRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, oldStoreId);
        const oldStoreDoc = await getDoc(oldStoreRef);
        if (oldStoreDoc.exists()) {
          const currentCount = oldStoreDoc.data().employeeCount || 0;
          await updateDoc(oldStoreRef, {
            employeeCount: Math.max(0, currentCount - 1),
            updatedAt: serverTimestamp(),
          });
        }
      }
      if (newStoreId) {
        const newStoreRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, newStoreId);
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

  if (syncInventoryUsers && inventoryUserUid) {
    const userRef = doc(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES, inventoryUserUid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function deleteEmployee(employeeId) {
  const employeeRef = doc(db, COLLECTIONS.STORE_STAFF_ASSIGNMENTS, employeeId);
  const employeeDoc = await getDoc(employeeRef);

  if (employeeDoc.exists()) {
    const storeId = employeeDoc.data().assignedStoreId;
    if (storeId) {
      const storeRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, storeId);
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
