import { useState, useEffect } from 'react';
import { useInventoryAuth } from '../context/InventoryAuthContext';
import * as productsRepo from '../backend/firestore/repositories/productsRepository';

export function useProducts(storeId = null) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const { currentUser, userProfile } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let ownerUid = currentUser.uid;
    let effectiveStoreId = storeId;
    if (userProfile?.role === 'member') {
      ownerUid = userProfile.ownerUid || userProfile.masterUid;
      effectiveStoreId = userProfile.assignedStoreId;
      if (!effectiveStoreId || !ownerUid) {
        setProducts([]);
        setLoading(false);
        return;
      }
    } else if (userProfile?.role !== 'master') {
      setProducts([]);
      setLoading(false);
      return;
    }

    const unsubscribe = productsRepo.subscribeProducts({
      ownerUid,
      storeId: effectiveStoreId || null,
      onData: (productData) => {
        setProducts(productData);
        const lowStock = productData.filter(
          (p) => p.quantity <= (p.lowStockThreshold || 10)
        );
        setLowStockProducts(lowStock);
        setLoading(false);
        setError(null);
      },
      onError: (err) => {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, [currentUser, userProfile, storeId]);

  async function addProduct(productData) {
    if (!currentUser) throw new Error('Not authenticated');
    let ownerUid = currentUser.uid;
    if (userProfile?.role === 'member') {
      ownerUid = userProfile.masterUid;
    }
    return productsRepo.addProduct(ownerUid, productData);
  }

  async function updateProduct(productId, updates) {
    if (!currentUser) throw new Error('Not authenticated');
    return productsRepo.updateProduct(productId, updates);
  }

  async function updateStock(productId, quantityChange, reason = '') {
    if (!currentUser) throw new Error('Not authenticated');
    let ownerUid = currentUser.uid;
    if (userProfile?.role === 'member') {
      ownerUid = userProfile.ownerUid;
    }
    return productsRepo.updateStock(
      productId,
      quantityChange,
      reason,
      {
        currentUserUid: currentUser.uid,
        ownerUid,
        displayName: userProfile?.displayName || currentUser.email,
      }
    );
  }

  async function deleteProduct(productId) {
    if (!currentUser) throw new Error('Not authenticated');
    return productsRepo.deleteProduct(productId);
  }

  async function bulkUpdateStock(updates) {
    if (!currentUser) throw new Error('Not authenticated');
    return productsRepo.bulkUpdateStock(updates);
  }

  return {
    products,
    loading,
    error,
    lowStockProducts,
    addProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    bulkUpdateStock,
  };
}
