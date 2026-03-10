import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS } from '../collections';

export async function getStoresOnce(ownerUid) {
  const q = query(
    collection(db, 'stores'),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export function subscribeStores(ownerUid, onData, onError) {
  const q = query(
    collection(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const storeData = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      onData(storeData);
    },
    onError
  );
}

export async function addStore(ownerUid, storeData) {
  const newStore = {
    ...storeData,
    ownerUid,
    employeeCount: 0,
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS), newStore);
  return docRef.id;
}

export async function updateStore(storeId, updates) {
  const storeRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, storeId);
  await updateDoc(storeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStore(storeId) {
  const storeRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, storeId);
  await deleteDoc(storeRef);
}
