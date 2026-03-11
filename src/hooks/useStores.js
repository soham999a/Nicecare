import { useState, useEffect } from 'react';
import { useInventoryAuth } from '../context/InventoryAuthContext';
import * as storesRepo from '../backend/firestore/repositories/storesRepository';

export function useStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { currentUser, userProfile } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser || !userProfile || !['master', 'manager'].includes(userProfile.role)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guard clause reset
      setStores([]);
      setLoading(false);
      return;
    }

    const ownerUid =
      userProfile.role === 'master'
        ? currentUser.uid
        : (userProfile.ownerUid || userProfile.masterUid);

    if (!ownerUid) {
      setStores([]);
      setLoading(false);
      return;
    }

    const unsubscribe = storesRepo.subscribeStores(
      ownerUid,
      (storeData) => {
        const scopedData = userProfile.role === 'manager' && userProfile.assignedStoreId
          ? storeData.filter((store) => store.id === userProfile.assignedStoreId)
          : storeData;
        setStores(scopedData);
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
    return storesRepo.addStore(currentUser.uid, storeData);
  }

  async function updateStore(storeId, updates) {
    if (!currentUser) throw new Error('Not authenticated');
    return storesRepo.updateStore(storeId, updates);
  }

  async function deleteStore(storeId) {
    if (!currentUser) throw new Error('Not authenticated');
    return storesRepo.deleteStore(storeId);
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
