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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useInventoryAuth } from '../context/InventoryAuthContext';

export function useStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { currentUser, userProfile } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'master') {
      setStores([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'stores'),
      where('ownerUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const storeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStores(storeData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching stores:', err);
        setError('Failed to load stores');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  async function addStore(storeData) {
    if (!currentUser) throw new Error('Not authenticated');

    const newStore = {
      ...storeData,
      ownerUid: currentUser.uid,
      employeeCount: 0,
      productCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'stores'), newStore);
    return docRef.id;
  }

  async function updateStore(storeId, updates) {
    if (!currentUser) throw new Error('Not authenticated');

    const storeRef = doc(db, 'stores', storeId);
    await updateDoc(storeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteStore(storeId) {
    if (!currentUser) throw new Error('Not authenticated');

    const storeRef = doc(db, 'stores', storeId);
    await deleteDoc(storeRef);
  }

  return {
    stores,
    loading,
    error,
    addStore,
    updateStore,
    deleteStore,
  };
}
