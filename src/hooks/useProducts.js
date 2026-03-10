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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guard clause reset
      setProducts([]);
      setLoading(false);
      return;
    }

    let ownerUid = currentUser.uid;
    let effectiveStoreId = storeId;

    if (userProfile?.role === 'member' || userProfile?.role === 'manager') {
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

    // #region agent log
    fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H2',location:'src/hooks/useProducts.js',message:'Products query resolved',data:{role:userProfile?.role||null,hasOwnerUid:!!ownerUid,effectiveStoreId:effectiveStoreId||null,requestedStoreId:storeId||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H4',location:'src/hooks/useProducts.js',message:'Products query failed',data:{role:userProfile?.role||null,errorCode:err?.code||null,errorMessage:err?.message||String(err)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
    let data = { ...productData };

    if (userProfile?.role === 'member') {
      ownerUid = userProfile.masterUid;
    } else if (userProfile?.role === 'manager') {
      ownerUid = userProfile.ownerUid || userProfile.masterUid;
      if (!userProfile.assignedStoreId) {
        throw new Error('No store assigned to manager. Please contact the business owner.');
      }
      data = {
        ...data,
        storeId: userProfile.assignedStoreId,
        storeName: userProfile.assignedStoreName || data.storeName || '',
      };
    }

    return productsRepo.addProduct(ownerUid, data);
  }

  async function updateProduct(productId, updates) {
    if (!currentUser) throw new Error('Not authenticated');
    return productsRepo.updateProduct(productId, updates);
  }

  async function updateStock(productId, quantityChange, reason = '') {
    if (!currentUser) throw new Error('Not authenticated');
    let ownerUid = currentUser.uid;
    if (userProfile?.role === 'member' || userProfile?.role === 'manager') {
      ownerUid = userProfile.ownerUid || userProfile.masterUid;
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
