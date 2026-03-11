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
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS } from '../collections';

export async function getStoresOnce(ownerUid) {
  const q = query(
    collection(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS),
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

export function subscribeStoreById(storeId, onData, onError) {
  const storeRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, storeId);

  return onSnapshot(
    storeRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      onData([
        {
          id: snapshot.id,
          ...snapshot.data(),
        },
      ]);
    },
    onError
  );
}

export async function getStoreById(storeId) {
  const storeRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, storeId);
  const snapshot = await getDoc(storeRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
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
