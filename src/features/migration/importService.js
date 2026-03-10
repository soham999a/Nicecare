/**
 * Firestore import handlers for migration. Writes validated docs in chunks.
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { addStore } from '../../backend/firestore/repositories/storesRepository';
import { addProduct } from '../../backend/firestore/repositories/productsRepository';

const BATCH_SIZE = 500; // Firestore batch limit is 500

/**
 * Resolve storeId from storeName or storeId using existing stores.
 * @param {{ id: string; name: string }[]} stores
 * @param {string} storeIdOrName - Store document ID or store name
 * @returns {string|null}
 */
function resolveStoreId(stores, storeIdOrName) {
  if (!storeIdOrName || !stores?.length) return null;
  const trimmed = String(storeIdOrName).trim();
  const byId = stores.find((s) => s.id === trimmed);
  if (byId) return byId.id;
  const byName = stores.find((s) => (s.name || '').trim().toLowerCase() === trimmed.toLowerCase());
  return byName ? byName.id : null;
}

/**
 * Augment a doc with computed fields before write.
 * @param {Record<string, unknown>} doc
 * @param {string} entityId
 * @param {string} ownerUid
 * @param {{ id: string; name: string }[]} [stores]
 */
function prepareDoc(doc, entityId, ownerUid, stores = []) {
  const augmented = { ...doc, ownerUid };

  if (entityId === 'stores') {
    augmented.employeeCount = 0;
    augmented.productCount = 0;
    return augmented;
  }

  if (entityId === 'products' || entityId === 'employees' || entityId === 'customers') {
    const storeField = entityId === 'products' ? 'storeId' : entityId === 'employees' ? 'assignedStoreId' : 'storeId';
    const storeNameField = entityId === 'products' ? 'storeName' : entityId === 'employees' ? 'assignedStoreName' : null;
    const currentStoreId = doc[storeField];
    const currentStoreName = doc[storeNameField] ?? doc.storeName ?? doc.assignedStoreName;
    const resolved = resolveStoreId(stores, currentStoreId || currentStoreName);
    if (resolved) {
      augmented[storeField] = resolved;
      if (storeNameField) {
        const store = stores.find((s) => s.id === resolved);
        augmented[storeNameField] = store?.name ?? doc[storeNameField] ?? '';
      }
    }
  }

  if (entityId === 'employees') {
    augmented.isActive = true;
  }

  return augmented;
}

/**
 * Import stores.
 * @param {{ doc: Record<string, unknown> }[]} validRows
 * @param {string} ownerUid
 * @returns {Promise<{ succeeded: number; failed: number; errors: { rowIndex: number; message: string }[]; createdDocIds: string[] }>}
 */
async function importStores(validRows, ownerUid) {
  const errors = [];
  let succeeded = 0;
  const createdDocIds = [];

  for (const { rowIndex, doc: rowDoc } of validRows) {
    try {
      const prepared = prepareDoc(rowDoc, 'stores', ownerUid);
      const docId = await addStore(ownerUid, prepared);
      createdDocIds.push(docId);
      succeeded++;
    } catch (err) {
      errors.push({ rowIndex, message: err.message || 'Import failed' });
    }
  }

  return {
    succeeded,
    failed: errors.length,
    errors,
    createdDocIds,
  };
}

/**
 * Import products. Requires storeId resolved via stores list.
 * @param {{ doc: Record<string, unknown> }[]} validRows
 * @param {string} ownerUid
 * @param {{ id: string; name: string }[]} stores
 */
async function importProducts(validRows, ownerUid, stores) {
  const errors = [];
  let succeeded = 0;
  const createdDocIds = [];

  for (const { rowIndex, doc: rowDoc } of validRows) {
    try {
      const prepared = prepareDoc(rowDoc, 'products', ownerUid, stores);
      if (!prepared.storeId) {
        errors.push({ rowIndex, message: 'Store could not be resolved. Import stores first or provide a valid Store ID/Name.' });
        continue;
      }
      const docId = await addProduct(ownerUid, prepared);
      createdDocIds.push(docId);
      succeeded++;
    } catch (err) {
      errors.push({ rowIndex, message: err.message || 'Import failed' });
    }
  }

  return {
    succeeded,
    failed: errors.length,
    errors,
    createdDocIds,
  };
}

/**
 * Import employees. Creates employee docs directly (no Auth/invitation).
 * @param {{ doc: Record<string, unknown> }[]} validRows
 * @param {string} ownerUid
 * @param {{ id: string; name: string }[]} stores
 */
async function importEmployees(validRows, ownerUid, stores) {
  const errors = [];
  let succeeded = 0;
  const employeesRef = collection(db, 'employees');

  const createdDocIds = [];
  for (const { rowIndex, doc: rowDoc } of validRows) {
    try {
      const prepared = prepareDoc(rowDoc, 'employees', ownerUid, stores);
      if (!prepared.assignedStoreId) {
        errors.push({ rowIndex, message: 'Store could not be resolved. Import stores first or provide a valid Store ID/Name.' });
        continue;
      }
      const docRef = await addDoc(employeesRef, {
        ...prepared,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdDocIds.push(docRef.id);
      succeeded++;

      // Update store employeeCount
      const storeRef = doc(db, 'stores', prepared.assignedStoreId);
      const storeDoc = await getDoc(storeRef);
      if (storeDoc.exists()) {
        const currentCount = storeDoc.data().employeeCount || 0;
        await updateDoc(storeRef, {
          employeeCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      errors.push({ rowIndex, message: err.message || 'Import failed' });
    }
  }

  return {
    succeeded,
    failed: errors.length,
    errors,
    createdDocIds,
  };
}

/**
 * Import customers.
 * @param {{ doc: Record<string, unknown> }[]} validRows
 * @param {string} ownerUid
 * @param {{ id: string; name: string }[]} stores
 */
async function importCustomers(validRows, ownerUid, stores) {
  const errors = [];
  let succeeded = 0;
  const customersRef = collection(db, 'customers');
  const createdDocIds = [];

  for (const { rowIndex, doc: rowDoc } of validRows) {
    try {
      const prepared = prepareDoc(rowDoc, 'customers', ownerUid, stores);
      if (!prepared.storeId) {
        errors.push({ rowIndex, message: 'Store could not be resolved. Import stores first or provide a valid Store ID/Name.' });
        continue;
      }
      const docRef = await addDoc(customersRef, {
        ...prepared,
        createdAt: serverTimestamp(),
      });
      createdDocIds.push(docRef.id);
      succeeded++;
    } catch (err) {
      errors.push({ rowIndex, message: err.message || 'Import failed' });
    }
  }

  return {
    succeeded,
    failed: errors.length,
    errors,
    createdDocIds,
  };
}

/**
 * Run import for an entity.
 * @param {string} entityId
 * @param {{ rowIndex: number; doc: Record<string, unknown> }[]} validRows
 * @param {string} ownerUid
 * @param {{ id: string; name: string }[]} [stores]
 * @returns {Promise<{ succeeded: number; failed: number; errors: { rowIndex: number; message: string }[]; createdDocIds: string[] }>}
 */
export async function runImport(entityId, validRows, ownerUid, stores = []) {
  if (entityId === 'stores') {
    return importStores(validRows, ownerUid);
  }
  if (entityId === 'products') {
    return importProducts(validRows, ownerUid, stores);
  }
  if (entityId === 'employees') {
    return importEmployees(validRows, ownerUid, stores);
  }
  if (entityId === 'customers') {
    return importCustomers(validRows, ownerUid, stores);
  }
  return { succeeded: 0, failed: validRows.length, errors: [{ rowIndex: 0, message: 'Unknown entity type' }], createdDocIds: [] };
}

/**
 * Run imports for multiple entities in dependency order.
 * Calls getStores before each batch so newly imported stores are available for products/employees/customers.
 * @param {Array<{ entityId: string; validRows: { rowIndex: number; doc: Record<string, unknown> }[] }>} batches - ordered by dependency (stores first)
 * @param {string} ownerUid
 * @param {() => Promise<{ id: string; name: string }[]> | { id: string; name: string }[]} getStores - returns current stores; called before each batch (can be async)
 * @param {(entityId: string, validRows: unknown[], ownerUid: string, stores: unknown[]) => Promise<{ succeeded: number; failed: number; errors: unknown[]; createdDocIds?: string[] }>} [importFn] - optional override for testing
 * @returns {Promise<{ byEntity: Record<string, { succeeded: number; failed: number; errors: { rowIndex: number; message: string }[] }>; createdDocIds: Record<string, string[]> }>}
 */
export async function runImportBatch(batches, ownerUid, getStores, importFn = runImport) {
  const byEntity = {};
  const createdDocIds = { stores: [], products: [], employees: [], customers: [] };

  for (const { entityId, validRows } of batches) {
    if (!validRows?.length) continue;

    const storesResult = typeof getStores === 'function' ? getStores() : [];
    const stores = Array.isArray(storesResult) ? storesResult : await storesResult;

    const result = await importFn(entityId, validRows, ownerUid, stores || []);

    if (!byEntity[entityId]) {
      byEntity[entityId] = { succeeded: 0, failed: 0, errors: [] };
    }
    byEntity[entityId].succeeded += result.succeeded;
    byEntity[entityId].failed += result.failed;
    byEntity[entityId].errors.push(...(result.errors || []));

    const ids = result.createdDocIds ?? [];
    if (ids.length && Array.isArray(createdDocIds[entityId])) {
      createdDocIds[entityId].push(...ids);
    }
  }

  return { byEntity, createdDocIds };
}
