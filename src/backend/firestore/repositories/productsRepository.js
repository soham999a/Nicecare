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
import { db } from '../../../config/firebase';

/**
 * Subscribe to products list. Returns unsubscribe function.
 * @param {Object} options - { ownerUid, storeId (optional for master), onData, onError }
 */
export function subscribeProducts({ ownerUid, storeId, onData, onError }) {
  const constraints = [
    where('ownerUid', '==', ownerUid),
    ...(storeId ? [where('storeId', '==', storeId)] : []),
    orderBy('createdAt', 'desc'),
  ];
  const q = query(collection(db, 'products'), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const productData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onData(productData);
    },
    onError
  );
}

export async function addProduct(ownerUid, productData) {
  const newProduct = {
    ...productData,
    ownerUid,
    quantity: productData.quantity ?? 0,
    lowStockThreshold: productData.lowStockThreshold ?? 10,
    price: parseFloat(productData.price) || 0,
    cost: parseFloat(productData.cost) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'products'), newProduct);

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

export async function updateProduct(productId, updates) {
  const productRef = doc(db, 'products', productId);

  if (updates.storeId !== undefined) {
    const productDoc = await getDoc(productRef);
    if (productDoc.exists()) {
      const oldStoreId = productDoc.data().storeId;
      const newStoreId = updates.storeId;

      if (oldStoreId !== newStoreId) {
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

export async function updateStock(productId, quantityChange, reason, { currentUserUid, ownerUid, displayName }) {
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

  await addDoc(collection(db, 'stockMovements'), {
    productId,
    productName: productDoc.data().name,
    storeId: productDoc.data().storeId,
    ownerUid,
    previousQuantity: currentQuantity,
    newQuantity,
    change: quantityChange,
    reason: reason || '',
    performedBy: currentUserUid,
    performedByName: displayName || '',
    createdAt: serverTimestamp(),
  });

  return newQuantity;
}

export async function deleteProduct(productId) {
  const productRef = doc(db, 'products', productId);
  const productDoc = await getDoc(productRef);

  if (productDoc.exists()) {
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

export async function bulkUpdateStock(updates) {
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
