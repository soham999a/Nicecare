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
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

export function subscribeStores(ownerUid, onData, onError) {
  const q = query(
    collection(db, 'stores'),
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

  const docRef = await addDoc(collection(db, 'stores'), newStore);
  return docRef.id;
}

export async function updateStore(storeId, updates) {
  const storeRef = doc(db, 'stores', storeId);
  await updateDoc(storeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStore(storeId) {
  const storeRef = doc(db, 'stores', storeId);
  await deleteDoc(storeRef);
}
