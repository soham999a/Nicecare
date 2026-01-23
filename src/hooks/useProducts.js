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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useInventoryAuth } from '../context/InventoryAuthContext';

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

    let q;

    if (userProfile?.role === 'master') {
      // Master can see all products or filter by store
      if (storeId) {
        q = query(
          collection(db, 'products'),
          where('ownerUid', '==', currentUser.uid),
          where('storeId', '==', storeId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'products'),
          where('ownerUid', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }
    } else if (userProfile?.role === 'member') {
      // Members can only see products from their assigned store
      const memberStoreId = userProfile.assignedStoreId;
      const ownerUid = userProfile.ownerUid;
      if (!memberStoreId || !ownerUid) {
        setProducts([]);
        setLoading(false);
        return;
      }
      q = query(
        collection(db, 'products'),
        where('ownerUid', '==', ownerUid),
        where('storeId', '==', memberStoreId),
        orderBy('createdAt', 'desc')
      );
    } else {
      setProducts([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productData);
        
        // Calculate low stock products
        const lowStock = productData.filter(
          (p) => p.quantity <= (p.lowStockThreshold || 10)
        );
        setLowStockProducts(lowStock);
        
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile, storeId]);

  async function addProduct(productData) {
    if (!currentUser) throw new Error('Not authenticated');

    // Determine ownerUid based on role
    let ownerUid = currentUser.uid;
    if (userProfile?.role === 'member') {
      ownerUid = userProfile.masterUid;
    }

    const newProduct = {
      ...productData,
      ownerUid,
      quantity: productData.quantity || 0,
      lowStockThreshold: productData.lowStockThreshold || 10,
      price: parseFloat(productData.price) || 0,
      cost: parseFloat(productData.cost) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'products'), newProduct);

    // Update store product count
    if (productData.storeId) {
      const storeRef = doc(db, 'stores', productData.storeId);
      const storeDoc = await getDoc(storeRef);
      if (storeDoc.exists()) {
        const currentCount = storeDoc.data().productCount || 0;
        await updateDoc(storeRef, {
          productCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return docRef.id;
  }

  async function updateProduct(productId, updates) {
    if (!currentUser) throw new Error('Not authenticated');

    const productRef = doc(db, 'products', productId);
    
    // If store assignment changed, update store counts
    if (updates.storeId !== undefined) {
      const productDoc = await getDoc(productRef);
      if (productDoc.exists()) {
        const oldStoreId = productDoc.data().storeId;
        const newStoreId = updates.storeId;

        if (oldStoreId !== newStoreId) {
          // Decrement old store count
          if (oldStoreId) {
            const oldStoreRef = doc(db, 'stores', oldStoreId);
            const oldStoreDoc = await getDoc(oldStoreRef);
            if (oldStoreDoc.exists()) {
              const currentCount = oldStoreDoc.data().productCount || 0;
              await updateDoc(oldStoreRef, {
                productCount: Math.max(0, currentCount - 1),
                updatedAt: serverTimestamp(),
              });
            }
          }

          // Increment new store count
          if (newStoreId) {
            const newStoreRef = doc(db, 'stores', newStoreId);
            const newStoreDoc = await getDoc(newStoreRef);
            if (newStoreDoc.exists()) {
              const currentCount = newStoreDoc.data().productCount || 0;
              await updateDoc(newStoreRef, {
                productCount: currentCount + 1,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }
    }

    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function updateStock(productId, quantityChange, reason = '') {
    if (!currentUser) throw new Error('Not authenticated');

    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }

    const currentQuantity = productDoc.data().quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + quantityChange);

    await updateDoc(productRef, {
      quantity: newQuantity,
      updatedAt: serverTimestamp(),
    });

    // Determine ownerUid for stock movement
    let movementOwnerUid = currentUser.uid;
    if (userProfile?.role === 'member') {
      movementOwnerUid = userProfile.ownerUid;
    }

    // Log stock movement
    await addDoc(collection(db, 'stockMovements'), {
      productId,
      productName: productDoc.data().name,
      storeId: productDoc.data().storeId,
      ownerUid: movementOwnerUid,
      previousQuantity: currentQuantity,
      newQuantity,
      change: quantityChange,
      reason,
      performedBy: currentUser.uid,
      performedByName: userProfile?.displayName || currentUser.email,
      createdAt: serverTimestamp(),
    });

    return newQuantity;
  }

  async function deleteProduct(productId) {
    if (!currentUser) throw new Error('Not authenticated');

    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      // Update store product count
      const storeId = productDoc.data().storeId;
      if (storeId) {
        const storeRef = doc(db, 'stores', storeId);
        const storeDoc = await getDoc(storeRef);
        if (storeDoc.exists()) {
          const currentCount = storeDoc.data().productCount || 0;
          await updateDoc(storeRef, {
            productCount: Math.max(0, currentCount - 1),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await deleteDoc(productRef);
  }

  // Bulk update stock (used after sales)
  async function bulkUpdateStock(updates) {
    if (!currentUser) throw new Error('Not authenticated');

    const batch = writeBatch(db);

    for (const { productId, quantityChange } of updates) {
      const productRef = doc(db, 'products', productId);
      const productDoc = await getDoc(productRef);
      
      if (productDoc.exists()) {
        const currentQuantity = productDoc.data().quantity || 0;
        const newQuantity = Math.max(0, currentQuantity + quantityChange);
        batch.update(productRef, {
          quantity: newQuantity,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
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
