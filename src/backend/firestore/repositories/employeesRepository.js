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

export function subscribeEmployees(ownerUid, onData, onError) {
  const q = query(
    collection(db, 'employees'),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const employeeData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onData(employeeData);
    },
    onError
  );
}

export async function updateEmployee(employeeId, updates, { syncInventoryUsers = false, inventoryUserUid = null } = {}) {
  const employeeRef = doc(db, 'employees', employeeId);

  if (updates.assignedStoreId !== undefined) {
    const employeeDoc = await getDoc(employeeRef);
    if (employeeDoc.exists()) {
      const oldStoreId = employeeDoc.data().assignedStoreId;
      const newStoreId = updates.assignedStoreId;

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

  if (syncInventoryUsers && inventoryUserUid) {
    const userRef = doc(db, 'inventoryUsers', inventoryUserUid);
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
  const employeeRef = doc(db, 'employees', employeeId);
  const employeeDoc = await getDoc(employeeRef);

  if (employeeDoc.exists()) {
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
